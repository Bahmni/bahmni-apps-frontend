import { getIdentifierTypes, IdentifierTypesResponse } from '@bahmni/services';
import { useQuery } from '@tanstack/react-query';

export const IDENTIFIER_TYPES_QUERY_KEY = ['identifierTypes'];

/**
 * Custom hook to fetch and cache identifier types from idgen
 *
 * This hook fetches identifier types with a 30-minute stale time since
 * identifier types are administrative configuration data that rarely changes.
 *
 * Cache configuration:
 * - staleTime: 30 minutes - Data remains fresh for 30 minutes before refetch
 * - gcTime: 60 minutes - Cached data kept in memory for 60 minutes after last use
 * - retry: 2 attempts with exponential backoff
 *
 * To manually refresh the data after configuration changes:
 * - Call the `refetch()` function returned by this hook
 * - Or use queryClient.invalidateQueries({ queryKey: IDENTIFIER_TYPES_QUERY_KEY })
 *
 * @returns Query result containing identifier types data, loading state, error, and refetch function
 */
export const useIdentifierTypes = () => {
  return useQuery<IdentifierTypesResponse, Error>({
    queryKey: IDENTIFIER_TYPES_QUERY_KEY,
    queryFn: getIdentifierTypes,
    staleTime: 30 * 60 * 1000, // 30 minutes
    gcTime: 60 * 60 * 1000, // 60 minutes
    retry: 2,
  });
};
