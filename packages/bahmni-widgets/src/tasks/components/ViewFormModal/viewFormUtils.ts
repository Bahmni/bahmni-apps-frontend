import type { Bundle, Encounter, Observation } from 'fhir/r4';

export interface EncounterGroup {
  encounterUuid: string;
  encounterDateTime: number;
  providerName: string;
  observations: Observation[];
}

/**
 * Extract UUID from FHIR reference string
 * @param ref - FHIR reference string (e.g., "Encounter/uuid" or "ServiceRequest/uuid")
 * @returns UUID string
 */
export const extractUuidFromReference = (ref: string): string => {
  return ref.split('/').pop() ?? '';
};

/**
 * Extract form field path from observation extension
 * @param observation - FHIR Observation resource
 * @returns Form field path string or null
 */
export const extractFormFieldPath = (observation: Observation): string | null => {
  const formFieldPathExtension = observation.extension?.find(
    (ext) =>
      ext.url === 'http://fhir.bahmni.org/ext/observation/form-namespace-path',
  );

  return formFieldPathExtension?.valueString ?? null;
};

/**
 * Group observations by encounter
 * @param observations - Array of FHIR Observation resources
 * @param bundle - FHIR Bundle containing encounter resources
 * @returns Array of encounter groups with observations, sorted by date (most recent first)
 */
export const groupObservationsByEncounter = (
  observations: Observation[],
  bundle: Bundle<Encounter>,
): EncounterGroup[] => {
  const encounterMap = new Map<string, EncounterGroup>();

  const encounters = bundle.entry
    ?.filter((entry) => entry.resource?.resourceType === 'Encounter')
    .map((entry) => entry.resource as Encounter) ?? [];

  const encounterDataMap = new Map<string, Encounter>();
  encounters.forEach((enc) => {
    if (enc.id) {
      encounterDataMap.set(enc.id, enc);
    }
  });

  observations.forEach((obs) => {
    const encounterRef = obs.encounter?.reference;
    if (!encounterRef) return;

    const encounterUuid = extractUuidFromReference(encounterRef);
    const encounterData = encounterDataMap.get(encounterUuid);

    if (!encounterData) return;

    if (!encounterMap.has(encounterUuid)) {
      const encounterDateTime = encounterData.period?.start
        ? new Date(encounterData.period.start).getTime()
        : 0;

      const providerName =
        encounterData.participant?.[0]?.individual?.display ?? 'Unknown';

      encounterMap.set(encounterUuid, {
        encounterUuid,
        encounterDateTime,
        providerName,
        observations: [],
      });
    }

    encounterMap.get(encounterUuid)!.observations.push(obs);
  });

  return Array.from(encounterMap.values()).sort(
    (a, b) => b.encounterDateTime - a.encounterDateTime,
  );
};
