import { fetchObservationForms, ObservationForm } from '@bahmni/services';
import { useUserPrivilege } from '@bahmni/widgets';
import { useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';
import { filterFormsByUserPrivileges } from '../components/forms/observations/utils/privilegeUtils';
import useDebounce from './useDebounce';

interface UseObservationFormsSearchResult {
  forms: ObservationForm[];
  isLoading: boolean;
  error: Error | null;
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
  episodeUuids?: string[],
): UseObservationFormsSearchResult => {
  const debouncedSearchTerm = useDebounce(searchTerm);
  const { userPrivileges } = useUserPrivilege();

  const {
    data: allForms = [],
    isLoading,
    error,
  } = useQuery<ObservationForm[], Error>({
    queryKey: ['observationForms', episodeUuids],
    queryFn: () => fetchObservationForms(episodeUuids),
  });

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
