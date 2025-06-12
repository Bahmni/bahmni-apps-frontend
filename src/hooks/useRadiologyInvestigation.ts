import { useState, useCallback, useEffect } from 'react';
import { RadiologyInvestigationByDate } from '@types/radiologyInvestigation';
import { getPatientRadiologyInvestigationsByDate } from '@services/radiologyInvestigationService';
import { usePatientUUID } from './usePatientUUID';
import { getFormattedError } from '@utils/common';
import { useTranslation } from 'react-i18next';

interface UseRadiologyInvestigationResult {
  radiologyInvestigations: RadiologyInvestigationByDate[];
  loading: boolean;
  error: Error | null;
  refetch: () => void;
}

/**
 * Custom hook to fetch and manage radiology orders for the current patient
 * @returns Object containing radiology orders, loading state, error state, and refetch function
 */
export const useRadiologyInvestigation =
  (): UseRadiologyInvestigationResult => {
    const [radiologyInvestigations, setRadiologyInvestigations] = useState<
      RadiologyInvestigationByDate[]
    >([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<Error | null>(null);
    const patientUUID = usePatientUUID();
    const { t } = useTranslation();

    const fetchRadiologyInvestigations = useCallback(async () => {
      try {
        setLoading(true);
        if (!patientUUID) {
          setError(new Error(t('ERROR_INVALID_PATIENT_UUID')));
          return;
        }
        const radiologyInvestigationsData =
          await getPatientRadiologyInvestigationsByDate(patientUUID);
        setRadiologyInvestigations(radiologyInvestigationsData);
        setError(null);
      } catch (err) {
        const { message } = getFormattedError(err);
        setError(err instanceof Error ? err : new Error(message));
        setRadiologyInvestigations([]);
      } finally {
        setLoading(false);
      }
    }, [patientUUID, t]);

    useEffect(() => {
      fetchRadiologyInvestigations();
    }, [fetchRadiologyInvestigations]);

    return {
      radiologyInvestigations: radiologyInvestigations,
      loading,
      error,
      refetch: fetchRadiologyInvestigations,
    };
  };

export default useRadiologyInvestigation;
