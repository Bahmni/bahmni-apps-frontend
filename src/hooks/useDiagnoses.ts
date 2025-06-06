import { useState, useCallback, useEffect } from 'react';
import { DiagnosesByDate } from '@/types/diagnosis';
import { getPatientDiagnosesByDate } from '@services/diagnosesService';
import { usePatientUUID } from './usePatientUUID';
import { getFormattedError } from '@utils/common';
import { useTranslation } from 'react-i18next';

interface UseDiagnosesResult {
  diagnoses: DiagnosesByDate[];
  loading: boolean;
  error: Error | null;
  refetch: () => void;
}

/**
 * Custom hook to fetch and manage diagnoses for the current patient
 * @returns Object containing diagnoses, loading state, error state, and refetch function
 */
export const useDiagnoses = (): UseDiagnosesResult => {
  const [diagnoses, setDiagnoses] = useState<DiagnosesByDate[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);
  const patientUUID = usePatientUUID();
  const { t } = useTranslation();

  const fetchDiagnoses = useCallback(async () => {
    try {
      setLoading(true);
      if (!patientUUID) {
        setError(new Error(t('ERROR_INVALID_PATIENT_UUID')));
        return;
      }
      const diagnosesData = await getPatientDiagnosesByDate(patientUUID);
      setDiagnoses(diagnosesData);
      setError(null);
    } catch (err) {
      const { message } = getFormattedError(err);
      setError(err instanceof Error ? err : new Error(message));
      setDiagnoses([]);
    } finally {
      setLoading(false);
    }
  }, [patientUUID, t]);

  useEffect(() => {
    fetchDiagnoses();
  }, [fetchDiagnoses]);

  return {
    diagnoses,
    loading,
    error,
    refetch: fetchDiagnoses,
  };
};

export default useDiagnoses;
