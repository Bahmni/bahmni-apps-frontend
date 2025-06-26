import { useState, useEffect } from 'react';
import useDebounce from './useDebounce';
import { Bundle, Medication } from 'fhir/r4';
import { searchMedications } from '@/services/medicationService';

interface MedicationSearchResult {
  searchResults: Medication[];
  loading: boolean;
  error: Error | null;
}


export const useMedicationSearch = (
  searchTerm: string,
  count = 20,
  debounceDelay = 500,
): MedicationSearchResult => {
  const [searchResults, setSearchResults] = useState<Medication[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<Error | null>(null);
  const debouncedSearchTerm = useDebounce(searchTerm, debounceDelay);

  const getMedicationsFromBundle = (bundle: Bundle<Medication>): Medication[] => {
    let medications: Medication[] = [];
    bundle.entry?.map(entry => {
      if (entry.resource) {
        medications.push(entry.resource);
      }
    });
    return medications;
  };

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
