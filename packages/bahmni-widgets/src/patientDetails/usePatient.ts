import {
  FormattedPatientData,
  getFormattedPatientById,
  getFormattedError,
} from '@bahmni/services';
import { useState, useEffect, useCallback } from 'react';
import { usePatientUUID } from '../hooks/usePatientUUID';

interface UsePatientOptions {
  enabled?: boolean;
}

interface UsePatientResult {
  patient: FormattedPatientData | null;
  loading: boolean;
  error: Error | null;
  refetch: () => void;
}

/**
 * Custom hook to fetch and manage patient data
 * @param options - Optional configuration. Set `enabled: false` to skip the fetch
 *   (e.g. when patient data is already provided via props from a parent component).
 * @returns Object containing patient, loading state, error state, and refetch function
 */
export const usePatient = (options?: UsePatientOptions): UsePatientResult => {
  const enabled = options?.enabled !== false;
  const patientUUID = usePatientUUID();
  const [patient, setPatient] = useState<FormattedPatientData | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<Error | null>(null);

  const fetchPatient = useCallback(async () => {
    if (!enabled) return;
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
  }, [patientUUID, enabled]);

  useEffect(() => {
    if (enabled) fetchPatient();
  }, [patientUUID, fetchPatient, enabled]);

  return { patient, loading, error, refetch: fetchPatient };
};
