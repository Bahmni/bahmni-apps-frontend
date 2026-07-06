import {
  ObservationForm,
  getObservationsBundleByEncounterUuid,
  useEncounterSessionStore,
  useSubscribeConsultationSaved,
} from '@bahmni/services';
import { usePatientUUID, extractFormFieldPath } from '@bahmni/widgets';
import { useQuery } from '@tanstack/react-query';
import type { Observation } from 'fhir/r4';
import { useMemo } from 'react';

function parseFormName(valueString: string | undefined): string | undefined {
  if (!valueString) return undefined;
  const beforeSlash = valueString.split('/')[0];
  const name = beforeSlash
    .split('^')
    .pop()
    ?.replace(/(\.\d+)+$/, '');
  return name ?? undefined;
}

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

  if (error) {
    // eslint-disable-next-line no-console
    console.error('Failed to fetch submitted encounter forms', error);
  }

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
      const valueString = extractFormFieldPath(obs);
      const formName = parseFormName(valueString);
      if (!formName) continue;

      const matched = allForms.find((f) => f.name === formName);
      if (matched) {
        submittedUuids.add(matched.uuid);
      }
    }

    return submittedUuids;
  }, [bundle, allForms]);
}
