import { Condition } from 'fhir/r4';
import { useState, useCallback, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { getConditions } from '@services/conditionService';
import { getFormattedError } from '@utils/common';
import { usePatientUUID } from './usePatientUUID';

interface UseConditionsResult {
  conditions: Condition[];
  loading: boolean;
  error: Error | null;
  refetch: () => void;
}

/**
 * Custom hook to fetch and manage conditions for the current patient
 * @returns Object containing conditions, loading state, error state, and refetch function
 */
export const useConditions = (): UseConditionsResult => {
  const [conditions, setConditions] = useState<Condition[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);
  const patientUUID = usePatientUUID();
  const { t } = useTranslation();

  const fetchConditions = useCallback(async () => {
    try {
      setLoading(true);
      if (!patientUUID) {
        setError(new Error(t('ERROR_INVALID_PATIENT_UUID')));
        return;
      }
      const conditionsData = await getConditions(patientUUID);
      setConditions(conditionsData);
      setError(null);
    } catch (err) {
      const { message } = getFormattedError(err);
      setError(err instanceof Error ? err : new Error(message));
      setConditions([]);
    } finally {
      setLoading(false);
    }
  }, [patientUUID, t]);

  useEffect(() => {
    fetchConditions();
  }, [fetchConditions]);

  return {
    conditions,
    loading,
    error,
    refetch: fetchConditions,
  };
};

export default useConditions;
