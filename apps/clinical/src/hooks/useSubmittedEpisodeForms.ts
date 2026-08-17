import { getEpisodeGradingStatus } from '@bahmni/services';
import { useQueries } from '@tanstack/react-query';
import { useEffect, useMemo } from 'react';

/**
 * Returns the set of form UUIDs that have already been recorded anywhere in
 * the given episode(s) — not just the current active encounter.
 *
 * This complements `useSubmittedEncounterForms`: that hook only knows about
 * the current encounter, so it can't reflect a form (e.g. a single-instance
 * Grading form) that was already submitted in an *earlier* visit for the
 * same episode. Callers should merge this Set with the encounter-scoped one.
 */
export function useSubmittedEpisodeForms(
  episodeUuids: string[] = [],
): Set<string> {
  const results = useQueries({
    queries: episodeUuids.map((episodeUuid) => ({
      queryKey: ['episodeGradingStatus', episodeUuid],
      enabled: !!episodeUuid,
      staleTime: 60_000,
      queryFn: () => getEpisodeGradingStatus(episodeUuid),
    })),
  });

  useEffect(() => {
    results.forEach((result) => {
      if (result.error) {
        // eslint-disable-next-line no-console
        console.error('Failed to fetch episode grading status', result.error);
      }
    });
  }, [results]);

  return useMemo(() => {
    const submittedUuids = new Set<string>();
    for (const result of results) {
      if (result.data?.alreadySubmitted && result.data.formUuid) {
        submittedUuids.add(result.data.formUuid);
      }
    }
    return submittedUuids;
  }, [results]);
}
