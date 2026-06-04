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
  const latestRequestIdRef = useRef(0);

  // Set loading immediately (before debounce) so the UI doesn't flicker "no results" during the 300ms window.
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
      setError(null);
      return;
    }

    const requestId = ++latestRequestIdRef.current;

    setError(null);

    const searchPromise =
      !activeAnnotation || activeAnnotation.searchType === 'patientNameOrId'
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
        if (requestId !== latestRequestIdRef.current) return;
        setPatients(result.pageOfResults as PatientSearchResult[]);
        setLoading(false);
      })
      .catch((err: Error) => {
        if (requestId !== latestRequestIdRef.current) return;
        setError(err.message);
        setLoading(false);
      });

    return () => {
      if (latestRequestIdRef.current === requestId) {
        latestRequestIdRef.current++;
      }
    };
  }, [debouncedTerm, activeAnnotation]);

  return { patients, loading, error };
}
