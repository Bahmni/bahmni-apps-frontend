import { AllergyIntolerance } from 'fhir/r4';
import { useState, useCallback, useEffect } from 'react';
import { getAllergies } from '@services/allergyService';
import { getFormattedError } from '@utils/common';
import { useNotification } from './useNotification';
import { usePatientUUID } from './usePatientUUID';

interface UseAllergiesResult {
  allergies: AllergyIntolerance[];
  loading: boolean;
  error: Error | null;
  refetch: () => void;
}

/**
 * Custom hook to fetch and manage patient allergies
 * @returns Object containing allergies, loading state, error state, and refetch function
 */
export const useAllergies = (): UseAllergiesResult => {
  const [allergies, setAllergies] = useState<AllergyIntolerance[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<Error | null>(null);
  const { addNotification } = useNotification();
  const patientUUID = usePatientUUID();

  const fetchAllergies = useCallback(async () => {
    if (!patientUUID) {
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
      const allergies = await getAllergies(patientUUID);
      setAllergies(allergies);
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
  }, [patientUUID, addNotification]);

  useEffect(() => {
    fetchAllergies();
  }, [patientUUID, fetchAllergies]);

  return {
    allergies: allergies,
    loading: loading,
    error: error,
    refetch: fetchAllergies,
  };
};
