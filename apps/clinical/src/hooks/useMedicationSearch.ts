import { searchMedications } from '@bahmni/services';
import { Medication } from 'fhir/r4';
import { useState, useEffect } from 'react';

import { getMedicationsFromBundle } from '../services/medicationService';
import useDebounce from './useDebounce';

interface MedicationSearchResult {
  searchResults: Medication[];
  loading: boolean;
  error: Error | null;
}

// TODO : Remove custom hook and use tanstack query for concept search

export const useMedicationSearch = (
  searchTerm: string,
  count = 20,
  debounceDelay = 500,
): MedicationSearchResult => {
  const [searchResults, setSearchResults] = useState<Medication[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<Error | null>(null);
  const debouncedSearchTerm = useDebounce(searchTerm, debounceDelay);

  useEffect(() => {
    if (!debouncedSearchTerm || debouncedSearchTerm.trim() === '') {
      setSearchResults([]);
      setError(null);
      return;
    }

    const fetchMedications = async () => {
      setLoading(true);
      setError(null);

      try {
        const data = await searchMedications(debouncedSearchTerm, count);
        setSearchResults(getMedicationsFromBundle(data));
      } catch (err) {
        setError(
          err instanceof Error
            ? new Error(err.message)
            : new Error('Failed to fetch medications for search'),
        );
      } finally {
        setLoading(false);
      }
    };

    fetchMedications();
  }, [debouncedSearchTerm, count]);

  return { searchResults, loading, error };
};
