import { getIdentifierTypes, IdentifierTypesResponse } from '@bahmni/services';
import { useQuery } from '@tanstack/react-query';

export const IDENTIFIER_TYPES_QUERY_KEY = ['identifierTypes'];

/**
 * Custom hook to fetch and cache identifier types from idgen
 *
 * This hook fetches identifier types once and caches them indefinitely since
 * identifier types are administrative configuration data that rarely changes.
 *
 * To manually refresh the data after configuration changes:
 * - Call the `refetch()` function returned by this hook
 * - Or use queryClient.invalidateQueries({ queryKey: IDENTIFIER_TYPES_QUERY_KEY })
 * - Or reload the page
 *
 * @returns Query result containing identifier types data, loading state, error, and refetch function
 */
export const useIdentifierTypes = () => {
  return useQuery<IdentifierTypesResponse, Error>({
    queryKey: IDENTIFIER_TYPES_QUERY_KEY,
    queryFn: getIdentifierTypes,
    staleTime: Infinity, // Data never becomes stale automatically
    gcTime: Infinity, // Keep data in cache indefinitely
  });
};
