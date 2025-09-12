import {
  getPatientSearchResults,
  PatientSearchResult,
  getFormattedError,
  useTranslation,
} from '@bahmni-frontend/bahmni-services';
import { useState, useCallback, useEffect } from 'react';

interface UsePatientSearchResult {
  searchResults: PatientSearchResult[];
  totalCount: number;
  loading: boolean;
  error: string | null;
}

/**
 * Custom hook to manage patient search functionality
 * @param searchTerm - The search term to search for patients
 * @returns Object containing search results, loading state, error state, and clear function
 */
export const usePatientSearch = (
  searchTerm: string,
): UsePatientSearchResult => {
  const { t } = useTranslation();
  const [searchResults, setSearchResults] = useState<PatientSearchResult[]>(
    [],
  );
  const [totalCount, setTotalCount] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const performSearch = useCallback(async (term: string) => {
    if (!term.trim()) {
      setSearchResults([]);
      setTotalCount(0);
      setError(null);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const { results, totalCount: count } = await getPatientSearchResults(
        term,
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
  }, []);

  useEffect(() => {
    performSearch(searchTerm);
  }, [searchTerm, performSearch]);

  return {
    searchResults,
    totalCount,
    loading,
    error,
  };
};
