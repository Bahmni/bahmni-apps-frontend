import { Observation, Encounter, Bundle } from 'fhir/r4';
import { get } from '../api';
import { PATIENT_VISITS_URL, BAHMNI_ENCOUNTER_URL } from './constants';

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
 * Fetch observations by encounter UUID from FHIR API
 * @param encounterUUID - Encounter UUID
 * @returns Promise resolving to FHIR observation bundle
 */
export async function getObservationsBundleByEncounterUuid(
  encounterUUID: string,
): Promise<Bundle<Observation>> {
  return await get<Bundle<Observation>>(BAHMNI_ENCOUNTER_URL(encounterUUID));
}
