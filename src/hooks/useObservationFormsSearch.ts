import { useEffect, useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { OBSERVATION_FORMS_URL } from '@constants/app';
import { getFormattedError } from '@utils/common';
import { filterFormsByUserPrivileges } from '@utils/privilegeUtils';
import { ObservationForm } from '../types/observationForms';
import useDebounce from './useDebounce';
import { useUserPrivilege } from './useUserPrivilege';

interface UseObservationFormsSearchResult {
  forms: ObservationForm[];
  isLoading: boolean;
  error: Error | null;
}

interface ApiFormPrivilege {
  privilegeName: string;
  editable: boolean;
}
// API Response model (what backend sends)
interface FormApiResponse {
  uuid: string;
  name: string;
  id: number;
  privileges: ApiFormPrivilege[];
}

/**
 * A hook that provides debounced search functionality for observation forms.
 * It loads all observation forms and filters them based on the search term.
 *
 * @param searchTerm - Optional search term to filter observation forms
 * @returns Object containing filtered forms, loading state, and any errors
 */
const useObservationFormsSearch = (
  searchTerm: string = '',
): UseObservationFormsSearchResult => {
  const [allForms, setAllForms] = useState<ObservationForm[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const debouncedSearchTerm = useDebounce(searchTerm);
  const { t } = useTranslation();
  const { userPrivileges } = useUserPrivilege();

  // Load all observation forms
  useEffect(() => {
    const loadObservationForms = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const response = await fetch(OBSERVATION_FORMS_URL);

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();

        // Map forms to expected format - handle both data.results and direct data array
        const formsArray = data.results ?? data ?? [];
        const mappedForms: ObservationForm[] = formsArray
          .map((form: FormApiResponse) => ({
            uuid: form.uuid,
            name: form.name,
            id: form.id,
            privileges: form.privileges.map((p) => ({
              privilegeName: p.privilegeName,
              editable: p.editable,
            })),
          }))
          .filter((form: ObservationForm) => form.uuid && form.name);
        setAllForms(mappedForms);
      } catch (err) {
        const formattedError = getFormattedError(err);
        setError(
          new Error(formattedError.message ?? t('ERROR_FETCHING_CONCEPTS')),
        );
      } finally {
        setIsLoading(false);
      }
    };

    loadObservationForms();
  }, [t]);

  // Filter forms based on user privileges and search term
  const filteredForms = useMemo(() => {
    if (!allForms.length) return [];

    // Don't filter if user privileges are still loading (null)
    // This prevents showing all forms before privileges are loaded
    if (userPrivileges === null) {
      return [];
    }

    // First filter by user privileges
    const privilegeFilteredForms = filterFormsByUserPrivileges(
      userPrivileges,
      allForms,
    );

    const searchTermLower = debouncedSearchTerm.toLowerCase().trim();
    if (!searchTermLower) return privilegeFilteredForms;

    // Then filter by search term
    const searchWords = searchTermLower.split(/\s+/);

    return privilegeFilteredForms.filter((form) => {
      const nameLower = form.name.toLowerCase();

      // Match if any search word is found in name
      return searchWords.some((word) => nameLower.includes(word));
    });
  }, [allForms, userPrivileges, debouncedSearchTerm]);

  return {
    forms: filteredForms,
    isLoading,
    error,
  };
};

export default useObservationFormsSearch;
