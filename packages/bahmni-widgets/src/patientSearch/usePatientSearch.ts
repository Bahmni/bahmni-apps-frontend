import {
  getPatientSearchResults,
  FormattedPatientSearchResult,
  getFormattedError,
  useTranslation,
} from '@bahmni-frontend/bahmni-services';
import { useState, useCallback, useEffect } from 'react';

interface UsePatientSearchResult {
  searchResults: FormattedPatientSearchResult[];
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
  const [searchResults, setSearchResults] = useState<
    FormattedPatientSearchResult[]
  >([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const performSearch = useCallback(async (term: string) => {
    if (!term.trim()) {
      setSearchResults([]);
      setError(null);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const results = await getPatientSearchResults(term, t);

      setSearchResults(results);
    } catch (err) {
      const { message } = getFormattedError(err);
      setError(message);
      setSearchResults([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    performSearch(searchTerm);
  }, [searchTerm, performSearch]);

  return {
    searchResults,
    loading,
    error,
  };
};
