import { Encounter, Bundle } from 'fhir/r4';
import { get } from '../api';
import { PATIENT_VISITS_URL, EOC_ENCOUNTERS_URL } from './constants';

/**
 * Fetches visits for a given patient UUID from the FHIR R4 endpoint
 * @param patientUUID - The UUID of the patient
 * @returns Promise resolving to a FhirEncounterBundle
 */
export async function getPatientVisits(
  patientUUID: string,
): Promise<Bundle<Encounter>> {
  return await get<Bundle<Encounter>>(PATIENT_VISITS_URL(patientUUID));
}

/**
 * Fetches and transforms visits for a given patient UUID
 * @param patientUUID - The UUID of the patient
 * @returns Promise resolving to an array of FhirEncounter
 */
export async function getVisits(patientUUID: string): Promise<Encounter[]> {
  const fhirEncounterBundle = await getPatientVisits(patientUUID);
  return (
    fhirEncounterBundle.entry
      ?.map((entry) => entry.resource)
      .filter((resource): resource is Encounter => resource !== undefined) ?? []
  );
}

/**
 * Gets the active visit for a patient (encounter with no end date)
 * @param patientUUID - The UUID of the patient
 * @returns Promise resolving to the current FhirEncounter or null if not found
 */
export async function getActiveVisit(
  patientUUID: string,
): Promise<Encounter | null> {
  const encounters = await getVisits(patientUUID);
  return encounters.find((encounter) => !encounter.period?.end) ?? null;
}

/**
 * Fetches encounters for Episode-of-Care IDs and extracts visit and encounter IDs
 * @param eocIds - Array of EOC IDs or single EOC ID
 * @returns Promise resolving to object with visit IDs and encounter IDs
 */
export async function getEncountersForEOC(
  eocIds: string[] | string,
): Promise<{ visitIds: string[]; encounterIds: string[] }> {
  const ids = Array.isArray(eocIds) ? eocIds.join(',') : eocIds;
  const bundle = await get<Bundle>(EOC_ENCOUNTERS_URL(ids));

  const encounters =
    bundle.entry
      ?.filter((entry) => entry.resource?.resourceType === 'Encounter')
      ?.map((entry) => entry.resource as Encounter) ?? [];

  const visitIds: string[] = [];
  const encounterIds: string[] = [];

  encounters.forEach((encounter) => {
    if (encounter.id) {
      encounterIds.push(encounter.id);
    }

    let visitId = encounter.partOf?.reference?.split('/')[1];

    if (!visitId && encounter.meta?.tag?.some((tag) => tag.code === 'visit')) {
      visitId = encounter.id;
    }

    if (visitId && !visitIds.includes(visitId)) {
      visitIds.push(visitId);
    }
  });

  return { visitIds, encounterIds };
}
