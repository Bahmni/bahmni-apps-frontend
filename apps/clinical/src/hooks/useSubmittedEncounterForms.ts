import {
  FHIR_OBSERVATION_FORM_NAMESPACE_PATH_URL,
  ObservationForm,
  getObservationsBundleByEncounterUuid,
  useEncounterSessionStore,
  useSubscribeConsultationSaved,
} from '@bahmni/services';
import { usePatientUUID } from '@bahmni/widgets';
import { useQuery } from '@tanstack/react-query';
import type { Observation } from 'fhir/r4';
import { useMemo } from 'react';

/**
 * Parse the form name from an observation's form-namespace-path valueString.
 *
 * The valueString format is either:
 *   - `{namespace}^{formName}.{version}/{fieldPath}`  e.g. `Bahmni^Vitals.1/10-0`
 *   - `{formName}.{version}/{fieldPath}`              e.g. `Vitals.1/1-0`
 *
 * Returns the bare form name (e.g. `Vitals`), or undefined if the value is absent/malformed.
 */
function parseFormName(valueString: string | undefined): string | undefined {
  if (!valueString) return undefined;
  const beforeSlash = valueString.split('/')[0];
  // Strip optional `{namespace}^` prefix, then strip trailing `.{version}`
  const name = beforeSlash
    .split('^')
    .pop()
    ?.replace(/\.\d+$/, '');
  return name ?? undefined;
}

/**
 * Extract the form-namespace-path valueString from a FHIR Observation extension.
 * Uses the canonical URL constant from @bahmni/services to avoid hardcoding.
 * This inlines the same logic as `extractFormFieldPath` from @bahmni/widgets/src/forms/utils
 * to avoid a cross-package deep import.
 */
function getFormNamespacePath(obs: Observation): string | undefined {
  return obs.extension?.find(
    (ext) => ext.url === FHIR_OBSERVATION_FORM_NAMESPACE_PATH_URL,
  )?.valueString;
}

/**
 * Returns the set of form UUIDs that have already been submitted in the active encounter.
 *
 * - Returns an empty set when there is no MATCHED encounter session (new encounter → all forms selectable).
 * - Automatically refetches after any consultation save for the current patient (handles the
 *   "Continue Consultation" multi-bundle flow).
 *
 * Mirrors the pattern in InvestigationsForm.tsx lines 43-92.
 */
export function useSubmittedEncounterForms(
  allForms: ObservationForm[],
): Set<string> {
  const patientUUID = usePatientUUID();
  const { activeEncounter, matchReasons } = useEncounterSessionStore();

  // Only consider an encounter if the session is actively MATCHED
  const activeEncounterUuid = matchReasons.includes('MATCHED')
    ? activeEncounter?.id
    : undefined;

  const { data: bundle, refetch } = useQuery({
    queryKey: ['submittedEncounterForms', activeEncounterUuid],
    enabled: !!activeEncounterUuid && !!patientUUID,
    staleTime: 30_000,
    queryFn: () => getObservationsBundleByEncounterUuid(activeEncounterUuid!),
  });

  useSubscribeConsultationSaved(
    (payload) => {
      if (payload.patientUUID === patientUUID) {
        refetch();
      }
    },
    [patientUUID, refetch],
  );

  return useMemo(() => {
    const observations: Observation[] =
      bundle?.entry
        ?.map((e) => e.resource)
        .filter((r): r is Observation => r?.resourceType === 'Observation') ??
      [];

    const submittedUuids = new Set<string>();

    for (const obs of observations) {
      const valueString = getFormNamespacePath(obs);
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
