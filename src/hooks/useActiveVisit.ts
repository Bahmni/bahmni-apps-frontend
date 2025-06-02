import { useState, useCallback, useEffect } from 'react';
import { FhirEncounter } from '@types/encounter';
import { useNotification } from './useNotification';
import { getActiveVisit } from '@services/encounterService';
import { getFormattedError } from '@utils/common';

interface UseActiveVisitResult {
  activeVisit: FhirEncounter | null;
  loading: boolean;
  error: Error | null;
  refetch: () => void;
}

/**
 * Custom hook to fetch and manage the current active visit for a patient
 * @param patientUUID - The UUID of the patient
 * @returns Object containing active visit, loading state, error state, and refetch function
 */
export const useActiveVisit = (
  patientUUID: string | null,
): UseActiveVisitResult => {
  const [activeVisit, setActiveVisit] = useState<FhirEncounter | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);
  const { addNotification } = useNotification();

  const fetchActiveVisit = useCallback(async () => {
    if (!patientUUID) {
      setLoading(false);
      setError(new Error('Invalid patient UUID'));
      addNotification({
        type: 'error',
        title: 'Error',
        message: 'Invalid patient UUID',
      });
      return;
    }

    try {
      setLoading(true);
      const encounter = await getActiveVisit(patientUUID);
      if (!encounter) {
        setLoading(false);
        setError(new Error('No active visit found'));
        addNotification({
          type: 'error',
          title: 'Error',
          message: 'No active visit found',
        });
        return;
      }
      setActiveVisit(encounter);
      setError(null);
    } catch (err) {
      const { title, message } = getFormattedError(err);
      addNotification({
        type: 'error',
        title: title,
        message: message,
      });
      setError(new Error(message));
      setActiveVisit(null);
    } finally {
      setLoading(false);
    }
  }, [patientUUID, addNotification]);

  useEffect(() => {
    fetchActiveVisit();
  }, [fetchActiveVisit]);

  return {
    activeVisit,
    loading,
    error,
    refetch: fetchActiveVisit,
  };
};
