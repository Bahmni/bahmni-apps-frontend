import { useState, useCallback, useEffect } from 'react';
import { FhirCondition } from '@types/condition';
import { useNotification } from './useNotification';
import { getConditions } from '@services/conditionService';
import { getFormattedError } from '@utils/common';

interface UseConditionsResult {
  conditions: FhirCondition[];
  loading: boolean;
  error: Error | null;
  refetch: () => void;
}

/**
 * Custom hook to fetch and manage patient conditions
 * @param patientUUID - The UUID of the patient
 * @param options - Optional parameters for pagination and filtering
 * @returns Object containing conditions, loading state, error state, and refetch function
 */
export const useConditions = (
  patientUUID: string | null,
): UseConditionsResult => {
  const [conditions, setConditions] = useState<FhirCondition[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<Error | null>(null);
  const { addNotification } = useNotification();

  const fetchConditions = useCallback(async () => {
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
      const conditions = await getConditions(patientUUID);
      setConditions(conditions);
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
    fetchConditions();
  }, [patientUUID, fetchConditions]);

  return {
    conditions: conditions,
    loading: loading,
    error: error,
    refetch: fetchConditions,
  };
};
