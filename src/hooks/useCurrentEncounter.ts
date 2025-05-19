import { useState, useCallback, useEffect } from 'react';
import { FhirEncounter } from '@types/encounter';
import { useNotification } from './useNotification';
import { getCurrentEncounter } from '@services/encounterService';
import { getFormattedError } from '@utils/common';

interface UseCurrentEncounterResult {
  currentEncounter: FhirEncounter | null;
  loading: boolean;
  error: Error | null;
  refetch: () => void;
}

/**
 * Custom hook to fetch and manage the current active encounter for a patient
 * @param patientUUID - The UUID of the patient
 * @returns Object containing current encounter, loading state, error state, and refetch function
 */
export const useCurrentEncounter = (
  patientUUID: string | null,
): UseCurrentEncounterResult => {
  const [currentEncounter, setCurrentEncounter] =
    useState<FhirEncounter | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);
  const { addNotification } = useNotification();

  const fetchCurrentEncounter = useCallback(async () => {
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
      const encounter = await getCurrentEncounter(patientUUID);
      if (!encounter) {
        setLoading(false);
        setError(new Error('No current encounter found'));
        addNotification({
          type: 'error',
          title: 'Error',
          message: 'No current encounter found',
        });
        return;
      }
      setCurrentEncounter(encounter);
      setError(null);
    } catch (err) {
      const { title, message } = getFormattedError(err);
      addNotification({
        type: 'error',
        title: title,
        message: message,
      });
      setError(new Error(message));
      setCurrentEncounter(null);
    } finally {
      setLoading(false);
    }
  }, [patientUUID, addNotification]);

  useEffect(() => {
    fetchCurrentEncounter();
  }, [fetchCurrentEncounter]);

  return {
    currentEncounter,
    loading,
    error,
    refetch: fetchCurrentEncounter,
  };
};
