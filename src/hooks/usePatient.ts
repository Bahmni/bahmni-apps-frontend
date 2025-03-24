import { useState, useEffect, useCallback } from 'react';
import { FhirPatient } from '@types/patient';
import { useNotification } from '@hooks/useNotification';
import { getPatientById } from '@services/patientService';

interface UsePatientResult {
  patient: FhirPatient | null;
  loading: boolean;
  error: Error | null;
  refetch: () => void;
}

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
      const errorMessage =
        err instanceof Error ? err.message : 'An unknown error occurred';
      addNotification({
        type: 'error',
        title: 'Error',
        message: errorMessage,
      });
      setError(err instanceof Error ? err : new Error(errorMessage));
    } finally {
      setLoading(false);
    }
  }, [patientUUID, addNotification]);

  useEffect(() => {
    fetchPatient();
  }, [patientUUID, fetchPatient]);

  return { patient, loading, error, refetch: fetchPatient };
};
