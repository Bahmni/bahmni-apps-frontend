import { useState, useCallback, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { getPatientRadiologyInvestigations } from '@services/radiologyInvestigationService';
import { RadiologyInvestigation } from '@types/radiologyInvestigation';
import { getFormattedError } from '@utils/common';
import { usePatientUUID } from './usePatientUUID';

interface UseRadiologyInvestigationResult {
  radiologyInvestigations: RadiologyInvestigation[];
  loading: boolean;
  error: Error | null;
  refetch: () => void;
}

/**
 * Custom hook to fetch and manage radiology investigations for the current patient
 * @returns Object containing radiology investigations, loading state, error state, and refetch function
 */
export const useRadiologyInvestigation =
  (): UseRadiologyInvestigationResult => {
    const [radiologyInvestigations, setRadiologyInvestigations] = useState<
      RadiologyInvestigation[]
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
          await getPatientRadiologyInvestigations(patientUUID);
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
      radiologyInvestigations,
      loading,
      error,
      refetch: fetchRadiologyInvestigations,
    };
  };

export default useRadiologyInvestigation;
