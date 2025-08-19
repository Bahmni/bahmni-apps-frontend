import {
  getActiveVisit,
  getFormattedError,
  useTranslation,
} from '@bahmni-frontend/bahmni-services';
import { useState, useCallback, useEffect } from 'react';
import { FhirEncounter } from '../models/encounter';

interface UseActiveVisitResult {
  activeVisit: FhirEncounter | null;
  loading: boolean;
  error: Error | null;
  refetch: () => void;
}

/**
 * Custom hook to fetch and manage the current active visit for a patient
 * @param patientUUID - The UUID of the patient
 * @returns Object containing active visit, loading state, error state, and refetch function
 */
export const useActiveVisit = (
  patientUUID: string | null,
): UseActiveVisitResult => {
  const [activeVisit, setActiveVisit] = useState<FhirEncounter | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);
  const { t } = useTranslation();

  const fetchActiveVisit = useCallback(async () => {
    if (!patientUUID) {
      setError(new Error(t('ERROR_INVALID_PATIENT_UUID')));
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const encounter = await getActiveVisit(patientUUID);
      if (!encounter) {
        setError(new Error(t('ERROR_NO_ACTIVE_VISIT_FOUND')));
        return;
      }
      setActiveVisit(encounter);
      setError(null);
    } catch (err) {
      const { message } = getFormattedError(err);
      setError(err instanceof Error ? err : new Error(message));
      setActiveVisit(null);
    } finally {
      setLoading(false);
    }
  }, [patientUUID]);

  useEffect(() => {
    fetchActiveVisit();
  }, [fetchActiveVisit]);

  return {
    activeVisit,
    loading,
    error,
    refetch: fetchActiveVisit,
  };
};
