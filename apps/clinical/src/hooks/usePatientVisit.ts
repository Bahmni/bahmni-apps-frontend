import { getVisits, getFormattedError, useTranslation } from '@bahmni/services';
import { useState, useCallback, useEffect } from 'react';
import { FhirEncounter } from '../models/encounter';

interface UsePatientVisitResult {
  activeVisit: FhirEncounter | null;
  lastVisit: FhirEncounter | null;
  loading: boolean;
  error: Error | null;
  refetch: () => void;
}

/**
 * Fetches all visits once and derives:
 * - activeVisit: the ongoing visit (no period.end)
 * - lastVisit: most recently ended visit (only when no active visit)
 */
export const usePatientVisit = (
  patientUUID: string | null,
): UsePatientVisitResult => {
  const [activeVisit, setActiveVisit] = useState<FhirEncounter | null>(null);
  const [lastVisit, setLastVisit] = useState<FhirEncounter | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);
  const { t } = useTranslation();

  const fetchVisits = useCallback(async () => {
    if (!patientUUID) {
      setError(new Error(t('ERROR_INVALID_PATIENT_UUID')));
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const visits = (await getVisits(patientUUID)) as FhirEncounter[];

      const active = visits.find((v) => !v.period?.end) ?? null;
      setActiveVisit(active);

      if (active) {
        setLastVisit(null);
        setError(null);
      } else {
        const ended = visits
          .filter((v) => v.period?.end && v.period?.start)
          .sort(
            (a, b) =>
              new Date(b.period!.start!).getTime() -
              new Date(a.period!.start!).getTime(),
          );
        setLastVisit(ended[0] ?? null);
        setError(new Error(t('ERROR_NO_ACTIVE_VISIT_FOUND')));
      }
    } catch (err) {
      const { message } = getFormattedError(err);
      setError(err instanceof Error ? err : new Error(message));
      setActiveVisit(null);
      setLastVisit(null);
    } finally {
      setLoading(false);
    }
  }, [patientUUID]);

  useEffect(() => {
    fetchVisits();
  }, [fetchVisits]);

  return {
    activeVisit,
    lastVisit,
    loading,
    error,
    refetch: fetchVisits,
  };
};
