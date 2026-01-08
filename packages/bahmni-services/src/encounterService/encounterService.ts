import { Encounter, Bundle } from 'fhir/r4';
import { get } from '../api';
import { PATIENT_VISITS_URL, BAHMNI_ENCOUNTER_URL } from './constants';
import { FormsEncounter } from './models';

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
 * Fetches Bahmni encounter details by encounter UUID
 * @param encounterUUID - The UUID of the encounter
 * @param includeAll - Whether to include all details (default: false)
 * @returns Promise resolving to FormsEncounter
 */
export async function getFormsDataByEncounterUuid(
  encounterUUID: string,
  includeAll: boolean = false,
): Promise<FormsEncounter> {
  return await get<FormsEncounter>(
    BAHMNI_ENCOUNTER_URL(encounterUUID, includeAll),
  );
}
