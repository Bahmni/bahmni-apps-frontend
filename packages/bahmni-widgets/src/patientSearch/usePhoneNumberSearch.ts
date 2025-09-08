import {
  searchPatientByCustomAttribute,
  getFormattedError,
  useTranslation,
  FormattedPatientSearchResult,
} from '@bahmni-frontend/bahmni-services';
import { useState, useCallback, useEffect } from 'react';

interface UsePhoneNumberSearchResult {
  searchResults: FormattedPatientSearchResult[];
  loading: boolean;
  error: string | null;
}

/**
 * Custom hook to manage phone number search functionality
 * @param searchTerm - The phone number to search for patients
 * @returns Object containing search results, loading state, and error state
 */
export const usePhoneNumberSearch = (
  searchTerm: string,
  attributeType: string = 'phoneNumber',
): UsePhoneNumberSearchResult => {
  const { t } = useTranslation();
  const [searchResults, setSearchResults] = useState<
    FormattedPatientSearchResult[]
  >([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const performSearch = useCallback(
    async (searchTerm: string, currentAttributeType: string) => {
      if (!searchTerm.trim()) {
        setSearchResults([]);
        setError(null);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        const results = await searchPatientByCustomAttribute(
          searchTerm,
          currentAttributeType,
          t,
        );

        setSearchResults(results);
      } catch (err) {
        const { message } = getFormattedError(err);
        setError(message);
        setSearchResults([]);
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  useEffect(() => {
    performSearch(searchTerm, attributeType);
  }, [searchTerm, attributeType, performSearch]);

  return {
    searchResults,
    loading,
    error,
  };
};
