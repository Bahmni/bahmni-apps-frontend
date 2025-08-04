import { useState, useEffect, useCallback } from 'react';
import {
  FormattedPatientData,
  getFormattedPatientById,
} from '@bahmni-frontend/bahmni-services';
import { usePatientUUID } from './usePatientUUID';
import { getFormattedError } from '@bahmni-frontend/bahmni-services';

interface UsePatientResult {
  patient: FormattedPatientData | null;
  loading: boolean;
  error: Error | null;
  refetch: () => void;
}

/**
 * Custom hook to fetch and manage patient data
 * @returns Object containing patient, loading state, error state, and refetch function
 */
export const usePatient = (): UsePatientResult => {
  const patientUUID = usePatientUUID();
  const [patient, setPatient] = useState<FormattedPatientData | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<Error | null>(null);

  const fetchPatient = useCallback(async () => {
    if (!patientUUID) {
      setError(new Error('Invalid patient UUID'));
      return;
    }

    try {
      setLoading(true);
      setError(null); // Clear any previous errors
      const data = await getFormattedPatientById(patientUUID);
      setPatient(data);
    } catch (err) {
      const { message } = getFormattedError(err);
      setError(err instanceof Error ? err : new Error(message));
    } finally {
      setLoading(false);
    }
  }, [patientUUID]);

  useEffect(() => {
    fetchPatient();
  }, [patientUUID, fetchPatient]);

  return { patient, loading, error, refetch: fetchPatient };
};
