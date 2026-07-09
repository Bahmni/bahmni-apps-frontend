import {
  ObservationForm,
  getObservationsBundleByEncounterUuid,
  useEncounterSessionStore,
  useSubscribeConsultationSaved,
} from '@bahmni/services';
import { usePatientUUID, extractFormName } from '@bahmni/widgets';
import { useQuery } from '@tanstack/react-query';
import type { Observation } from 'fhir/r4';
import { useEffect, useMemo } from 'react';

/**
 * Returns the set of form UUIDs that have already been submitted in the active encounter.
 *
 * - Returns an empty set when there is no MATCHED encounter session (new encounter → all forms selectable).
 * - Automatically refetches after any consultation save for the current patient (handles the
 *   "Continue Consultation" multi-bundle flow).
 */
export function useSubmittedEncounterForms(
  allForms: ObservationForm[],
): Set<string> {
  const patientUUID = usePatientUUID();
  const { activeEncounter, matchReasons } = useEncounterSessionStore();

  const activeEncounterUuid = matchReasons.includes('MATCHED')
    ? activeEncounter?.id
    : undefined;

  const {
    data: bundle,
    refetch,
    error,
  } = useQuery({
    queryKey: ['submittedEncounterForms', patientUUID, activeEncounterUuid],
    enabled: !!activeEncounterUuid && !!patientUUID,
    staleTime: 30_000,
    queryFn: () => getObservationsBundleByEncounterUuid(activeEncounterUuid!),
  });

  useEffect(() => {
    if (error) {
      // eslint-disable-next-line no-console
      console.error('Failed to fetch submitted encounter forms', error);
    }
  }, [error]);

  useSubscribeConsultationSaved(
    (payload) => {
      if (payload.patientUUID === patientUUID) {
        refetch();
      }
    },
    [patientUUID],
  );

  return useMemo(() => {
    const observations: Observation[] =
      bundle?.entry
        ?.map((e) => e.resource)
        .filter((r): r is Observation => r?.resourceType === 'Observation') ??
      [];

    const submittedUuids = new Set<string>();

    for (const obs of observations) {
      const formName = extractFormName(obs);
      if (!formName) continue;

      const matched = allForms.find((f) => f.name === formName);
      if (matched) {
        submittedUuids.add(matched.uuid);
      }
    }

    return submittedUuids;
  }, [bundle, allForms]);
}
