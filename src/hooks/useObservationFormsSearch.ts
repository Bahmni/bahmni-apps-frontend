import { useEffect, useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
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

interface FormApiResponse {
  name?: string;
  uuid?: string;
  formName?: string;
  formUuid?: string;
  version?: string;
  published?: boolean;
  id?: number;
  resources?: unknown;
  privileges?: unknown[];
  nameTranslation?: string;
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
        const response = await fetch(
          '/openmrs/ws/rest/v1/bahmniie/form/latestPublishedForms',
        );

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();

        // Map forms to expected format - handle both data.results and direct data array
        const formsArray = data.results ?? data ?? [];
        const mappedForms: ObservationForm[] = formsArray
          .map((form: FormApiResponse) => ({
            name: form.name ?? form.formName ?? '',
            uuid: form.uuid ?? form.formUuid ?? '',
            version: form.version ?? '1.0',
            published: form.published ?? true,
            id: form.id ?? 0,
            resources: form.resources ?? null,
            privileges: form.privileges ?? [],
            nameTranslation: form.nameTranslation ?? '[]',
            formName: form.formName,
            formUuid: form.formUuid,
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

    const searchTermLower = debouncedSearchTerm?.toLowerCase().trim() ?? '';
    if (!searchTermLower) return privilegeFilteredForms;

    // Then filter by search term
    const searchWords = searchTermLower.split(/\s+/);

    return privilegeFilteredForms.filter((form) => {
      const nameLower = form.name?.toLowerCase() ?? '';
      const formNameLower = form.formName?.toLowerCase() ?? '';

      // Match if any search word is found in either name or formName
      return searchWords.some(
        (word) => nameLower.includes(word) || formNameLower.includes(word),
      );
    });
  }, [allForms, userPrivileges, debouncedSearchTerm]);

  return {
    forms: filteredForms,
    isLoading,
    error,
  };
};

export default useObservationFormsSearch;
