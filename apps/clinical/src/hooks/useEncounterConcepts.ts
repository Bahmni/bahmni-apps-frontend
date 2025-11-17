import { getFormattedError } from '@bahmni/services';
import { useState, useCallback, useEffect } from 'react';
import { EncounterConcepts } from '../models/encounterConcepts';
import { getEncounterConcepts } from '../services/encounterConceptsService';

interface UseEncounterConceptsResult {
  encounterConcepts: EncounterConcepts | null;
  loading: boolean;
  error: Error | null;
  refetch: () => void;
}

/**
 * Custom hook to fetch and manage encounter concepts from the API
 * @returns Object containing encounterConcepts, loading state, error state, and refetch function
 */
export const useEncounterConcepts = (): UseEncounterConceptsResult => {
  const [encounterConcepts, setEncounterConcepts] =
    useState<EncounterConcepts | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<Error | null>(null);

  const fetchEncounterConcepts = useCallback(async () => {
    try {
      setLoading(true);
      const concepts = await getEncounterConcepts();
      setEncounterConcepts(concepts);
    } catch (err) {
      const { message } = getFormattedError(err);
      setError(err instanceof Error ? err : new Error(message));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchEncounterConcepts();
  }, [fetchEncounterConcepts]);

  return {
    encounterConcepts,
    loading,
    error,
    refetch: fetchEncounterConcepts,
  };
};
