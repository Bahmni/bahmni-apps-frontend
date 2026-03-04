import { Bundle, Observation } from 'fhir/r4';

/**
 * Extracts concept UUID and name mappings from a FHIR Bundle's Observation resources.
 *
 * @param bundle - The FHIR Bundle containing Observation resources
 * @returns A Map of concept UUIDs to concept names
 */
export const extractConceptsFromResponseBundle = (
  bundle: Bundle,
): Map<string, string> => {
  const conceptMap = new Map<string, string>();
  bundle?.entry?.forEach((entry) => {
    if (entry.resource?.resourceType === 'Observation') {
      const obs = entry.resource as Observation;
      const coding = obs.code?.coding?.[0];
      const uuid = coding?.code;
      const name = coding?.display ?? obs.code?.text;
      if (uuid && name) {
        conceptMap.set(uuid, name);
      }
    }
  });
  return conceptMap;
};
