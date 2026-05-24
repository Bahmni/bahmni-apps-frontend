import {
  searchPatientByNameOrId,
  searchPatientByCustomAttribute,
  type PatientSearchResult,
} from '@bahmni/services';
import { useEffect, useRef, useState } from 'react';
import { type SearchAnnotation } from './CommandPaletteContext';
import { useDebounce } from './useDebounce';

interface CommandPaletteSearchState {
  patients: PatientSearchResult[];
  loading: boolean;
  error: string | null;
}

export function useCommandPaletteSearch(
  searchTerm: string,
  activeAnnotation: SearchAnnotation | null = null,
): CommandPaletteSearchState {
  const [patients, setPatients] = useState<PatientSearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const debouncedTerm = useDebounce(searchTerm, 300);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    if (searchTerm.length >= 2) {
      setLoading(true);
    } else {
      setLoading(false);
      setPatients([]);
    }
  }, [searchTerm]);

  useEffect(() => {
    if (debouncedTerm.length < 2) {
      setPatients([]);
      setLoading(false);
      return;
    }

    abortRef.current?.abort();
    abortRef.current = new AbortController();

    setLoading(true);
    setError(null);

    const searchType = activeAnnotation?.searchType ?? 'patientAttribute';

    const searchPromise =
      !activeAnnotation || searchType === 'patientNameOrId'
        ? searchPatientByNameOrId(debouncedTerm)
        : searchPatientByCustomAttribute(
            debouncedTerm,
            activeAnnotation.fieldType,
            activeAnnotation.fieldsToSearch,
            [],
            (key: string) => key,
          );

    searchPromise
      .then((result) => {
        setPatients(result.pageOfResults as PatientSearchResult[]);
        setLoading(false);
      })
      .catch((err: Error) => {
        if (err.name !== 'AbortError') {
          setError(err.message);
          setLoading(false);
        }
      });

    return () => {
      abortRef.current?.abort();
    };
  }, [debouncedTerm, activeAnnotation]);

  return { patients, loading, error };
}
