import { useState, useEffect } from 'react';
import { getFormattedConditions, type FormattedCondition } from '@bahmni-frontend/bahmni-services';

interface UseConditionsReturn {
  conditions: FormattedCondition[];
  loading: boolean;
  error: Error | null;
}

/**
 * Hook to fetch and manage patient conditions
 * @param patientUuid - The UUID of the patient
 * @returns Object containing conditions, loading state, and error state
 */
const useConditions = (patientUuid?: string): UseConditionsReturn => {
  const [conditions, setConditions] = useState<FormattedCondition[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!patientUuid) {
      setConditions([]);
      return;
    }

    const fetchConditions = async () => {
      try {
        setLoading(true);
        setError(null);
        const fetchedConditions = await getFormattedConditions(patientUuid);
        setConditions(fetchedConditions);
      } catch (err) {
        setError(
          err instanceof Error
            ? err
            : new Error('Failed to fetch conditions'),
        );
      } finally {
        setLoading(false);
      }
    };

    fetchConditions();
  }, [patientUuid]);

  return { conditions, loading, error };
};

export default useConditions;