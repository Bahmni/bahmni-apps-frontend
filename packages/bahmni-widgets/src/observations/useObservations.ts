import {
  getPatientObservations,
  formatObservations,
  getConceptUuidsByNames,
  type FormattedObservation,
} from '@bahmni/services';
import { useState, useCallback, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { usePatientUUID } from '../hooks/usePatientUUID';
import { useNotification } from '../notification';
import { type ObservationConfig } from './models';

interface UseObservationsResult {
  observations: FormattedObservation[];
  loading: boolean;
  error: Error | null;
}

/**
 * Custom hook to fetch and manage patient observations
 * @param config - Configuration with concept codes (UUIDs) or concept names
 * @returns Object containing observations, loading state, error state
 */
export const useObservations = (
  config: ObservationConfig,
): UseObservationsResult => {
  const [observations, setObservations] = useState<FormattedObservation[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<Error | null>(null);
  const { addNotification } = useNotification();
  const patientUUID = usePatientUUID();
  const { t } = useTranslation();

  const fetchObservations = useCallback(async () => {
    if (!patientUUID) {
      setError(new Error('Invalid patient UUID'));
      addNotification({
        type: 'error',
        title: t('ERROR'),
        message: t('INVALID_PATIENT_UUID'),
      });
      return;
    }

    if (!config.conceptNames?.length && !config.conceptCodes?.length) {
      setObservations([]);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Get concept UUIDs from concept names if provided
      let conceptCodes = config.conceptCodes ?? [];
      if (config.conceptNames?.length) {
        const uuids = await getConceptUuidsByNames(config.conceptNames);
        conceptCodes = [...conceptCodes, ...uuids];
      }

      if (conceptCodes.length === 0) {
        setObservations([]);
        return;
      }

      // Fetch observations
      const bundle = await getPatientObservations(patientUUID, conceptCodes);
      const formattedObs = formatObservations(bundle);
      setObservations(formattedObs);
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'Failed to fetch observations';
      addNotification({
        type: 'error',
        title: t('ERROR'),
        message: errorMessage,
      });
      setError(err instanceof Error ? err : new Error(errorMessage));
    } finally {
      setLoading(false);
    }
  }, [patientUUID, config, addNotification, t]);

  useEffect(() => {
    fetchObservations();
  }, [fetchObservations]);

  return {
    observations,
    loading,
    error,
  };
};
