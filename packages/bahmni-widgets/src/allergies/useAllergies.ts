import {
  FormattedAllergy,
  getFormattedAllergies,
  getFormattedError,
} from '@bahmni-frontend/bahmni-services';
import { useState, useCallback, useEffect } from 'react';
import { usePatientUUID } from '../hooks/usePatientUUID';
import { useNotification } from '../notification';

interface UseAllergiesResult {
  allergies: FormattedAllergy[];
  loading: boolean;
  error: Error | null;
  refetch: () => void;
}

/**
 * Custom hook to fetch and manage patient allergies
 * @returns Object containing allergies, loading state, error state, and refetch function
 */
export const useAllergies = (): UseAllergiesResult => {
  const [allergies, setAllergies] = useState<FormattedAllergy[]>([]);
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
      const allergies = await getFormattedAllergies(patientUUID);
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
