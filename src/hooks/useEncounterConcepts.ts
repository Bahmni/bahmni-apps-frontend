import { useState, useCallback, useEffect } from 'react';
import { useNotification } from './useNotification';
import { getFormattedError } from '@utils/common';
import { getEncounterConcepts } from '@services/encounterConceptsService';
import { EncounterConcepts } from '@types/encounterConcepts';

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
  const { addNotification } = useNotification();

  const fetchEncounterConcepts = useCallback(async () => {
    try {
      setLoading(true);
      const concepts = await getEncounterConcepts();
      setEncounterConcepts(concepts);
    } catch (err) {
      const { title, message } = getFormattedError(err);
      addNotification({
        type: 'error',
        title: title,
        message: message,
      });
      setError(err instanceof Error ? err : new Error(message));
    } finally {
      setLoading(false);
    }
  }, [addNotification]);

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
