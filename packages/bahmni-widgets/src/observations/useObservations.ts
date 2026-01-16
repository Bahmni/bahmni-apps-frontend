import {
  getPatientObservations,
  formatObservations,
  fetchFormNameTranslations,
  type ObsGroup,
} from '@bahmni/services';
import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useConcept } from '../hooks/useConcept';
import { usePatientUUID } from '../hooks/usePatientUUID';
import { useNotification } from '../notification';
import { type ObservationConfig } from './models';

interface UseObservationsResult {
  observations: ObsGroup[];
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
  const { conceptNames = [], conceptCodes = [] } = config;
  const [observations, setObservations] = useState<ObsGroup[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const { addNotification } = useNotification();
  const patientUUID = usePatientUUID();
  const { t } = useTranslation();
  const { getConceptUuids } = useConcept();

  useEffect(() => {
    // no patient → treat as empty state
    if (!patientUUID) {
      setObservations([]);
      setError(null);
      setLoading(false);
      return;
    }

    // no concepts → nothing to fetch
    if (!conceptNames.length && !conceptCodes.length) {
      setObservations([]);
      setError(null);
      setLoading(false);
      return;
    }

    let cancelled = false;

    const fetchObservations = async () => {
      try {
        setLoading(true);
        setError(null);

        let allConceptCodes = [...conceptCodes];

        if (conceptNames.length) {
          const uuids = await getConceptUuids(conceptNames);
          allConceptCodes = [...allConceptCodes, ...uuids];
        }

        if (!allConceptCodes.length) {
          if (!cancelled) {
            setObservations([]);
          }
          return;
        }

        const bundle = await getPatientObservations(
          patientUUID,
          allConceptCodes,
        );

        // Fetch form name translations
        const formTranslations = await fetchFormNameTranslations();

        // Format observations with translations
        const formattedObs = formatObservations(bundle, t, formTranslations);

        if (!cancelled) {
          setObservations(formattedObs);
        }
      } catch (err) {
        const message =
          err instanceof Error ? err.message : 'Failed to fetch observations';

        if (!cancelled) {
          setError(err instanceof Error ? err : new Error(message));
        }

        addNotification({
          type: 'error',
          title: t('ERROR'),
          message: message,
        });
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    fetchObservations();

    return () => {
      cancelled = true;
    };
  }, [patientUUID, addNotification, t, getConceptUuids]);

  return { observations, loading, error };
};
