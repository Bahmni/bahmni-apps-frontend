import {
  getPatientSearchResults,
  FormattedPatientSearchResult,
  getFormattedError,
  useTranslation,
} from '@bahmni-frontend/bahmni-services';
import { useState, useCallback } from 'react';

interface UsePatientSearchResult {
  searchResults: FormattedPatientSearchResult[];
  totalCount: number;
  loading: boolean;
  error: string | null;
  searchPatients: (searchTerm: string) => Promise<void>;
  clearResults: () => void;
}

/**
 * Custom hook to manage patient search functionality
 * @returns Object containing search results, loading state, error state, and search functions
 */
export const usePatientSearch = (): UsePatientSearchResult => {
  const { t } = useTranslation();
  const [searchResults, setSearchResults] = useState<
    FormattedPatientSearchResult[]
  >([]);
  const [totalCount, setTotalCount] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const searchPatients = useCallback(
    async (searchTerm: string) => {
      if (!searchTerm.trim()) {
        setError('Search term cannot be empty');
        return;
      }

      try {
        setLoading(true);
        setError(null);

        const { results, totalCount: count } = await getPatientSearchResults(
          searchTerm,
          t,
        );

        setSearchResults(results);
        setTotalCount(count);
      } catch (err) {
        const { message } = getFormattedError(err);
        setError(message);
        setSearchResults([]);
        setTotalCount(0);
      } finally {
        setLoading(false);
      }
    },
    [t],
  );

  const clearResults = useCallback(() => {
    setSearchResults([]);
    setTotalCount(0);
    setError(null);
  }, []);

  return {
    searchResults,
    totalCount,
    loading,
    error,
    searchPatients,
    clearResults,
  };
};
