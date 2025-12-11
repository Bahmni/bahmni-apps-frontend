import { fetchFormMetadata, FormMetadata } from '@bahmni/services';
import { useQuery } from '@tanstack/react-query';

/**
 * Hook to fetch observation form metadata for a given form UUID
 *
 * @param formUuid - The UUID of the observation form to fetch metadata for
 * @returns Query result with form metadata, loading state, and error
 */
export function useObservationFormMetadata(formUuid: string | undefined) {
  return useQuery<FormMetadata>({
    queryKey: ['formMetadata', formUuid],
    queryFn: () => fetchFormMetadata(formUuid!),
    enabled: !!formUuid,
  });
}
