import { useState, useCallback, useEffect } from 'react';
import { MedicationRequest } from '@types/medicationRequest';
import { getPatientMedications } from '@services/medicationRequestService';
import { usePatientUUID } from './usePatientUUID';
import { getFormattedError } from '@utils/common';
import { useTranslation } from 'react-i18next';

interface MedicationRequestResult {
  medications: MedicationRequest[];
  loading: boolean;
  error: Error | null;
  refetch: () => void;
}

/**
 * Custom hook to fetch and manage medications for the current patient
 * @returns Object containing medications, loading state, error state, and refetch function
 */
export const useMedicationRequest = (): MedicationRequestResult => {
  const [medications, setMedications] = useState<MedicationRequest[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);
  const patientUUID = usePatientUUID();
  const { t } = useTranslation();

  const fetchMedications = useCallback(async () => {
    try {
      setLoading(true);
      if (!patientUUID) {
        setError(new Error(t('ERROR_INVALID_PATIENT_UUID')));
        return;
      }
      const medicationsData = await getPatientMedications(patientUUID);
      setMedications(medicationsData);
      setError(null);
    } catch (err) {
      const { message } = getFormattedError(err);
      setError(err instanceof Error ? err : new Error(message));
      setMedications([]);
    } finally {
      setLoading(false);
    }
  }, [patientUUID, t]);

  useEffect(() => {
    fetchMedications();
  }, [fetchMedications]);

  return {
    medications,
    loading,
    error,
    refetch: fetchMedications,
  };
};

export default useMedicationRequest;
