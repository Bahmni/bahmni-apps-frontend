import { useState, useEffect, useCallback } from 'react';
import { useNotification } from '@hooks/useNotification';
import { getPatientById } from '@services/patientService';
import { FhirPatient } from '@types/patient';
import { getFormattedError } from '@utils/common';

interface UsePatientResult {
  patient: FhirPatient | null;
  loading: boolean;
  error: Error | null;
  refetch: () => void;
}

/**
 * Custom hook to fetch and manage patient data
 * @param patientUUID - The UUID of the patient
 * @returns Object containing patient, loading state, error state, and refetch function
 */
export const usePatient = (patientUUID: string | null): UsePatientResult => {
  const [patient, setPatient] = useState<FhirPatient | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<Error | null>(null);
  const { addNotification } = useNotification();

  const fetchPatient = useCallback(async () => {
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
      const data = await getPatientById(patientUUID);
      setPatient(data);
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
    fetchPatient();
  }, [patientUUID, fetchPatient]);

  return { patient, loading, error, refetch: fetchPatient };
};
