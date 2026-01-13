import { getConceptUuidByName } from '@bahmni/services';
import { useQueryClient } from '@tanstack/react-query';
import { useCallback } from 'react';

/**
 * Hook to fetch concept UUIDs with caching
 * Checks cache first, only fetches if not cached
 * Each concept name is cached individually with infinite cache time
 */
export function useConcept() {
  const queryClient = useQueryClient();

  /**
   * Get concept UUIDs for multiple concept names with caching
   * @param conceptNames - Array of concept names to fetch UUIDs for
   * @returns Promise resolving to array of concept UUIDs (nulls filtered out)
   */
  const getConceptUuids = useCallback(
    async (conceptNames: string[]): Promise<string[]> => {
      const uuidPromises = conceptNames.map(async (name) => {
        // Check if already in cache
        const cached = queryClient.getQueryData<string | null>([
          'concept-uuid',
          name,
        ]);

        if (cached !== undefined) {
          return cached;
        }

        // Not in cache, fetch and cache it
        return queryClient.fetchQuery({
          queryKey: ['concept-uuid', name],
          queryFn: () => getConceptUuidByName(name),
          staleTime: Infinity, // Never consider stale
          gcTime: Infinity, // Never garbage collect
        });
      });

      const uuids = await Promise.all(uuidPromises);
      return uuids.filter((uuid): uuid is string => uuid !== null);
    },
    [queryClient],
  );

  return { getConceptUuids };
}
