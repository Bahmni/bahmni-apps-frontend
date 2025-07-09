import { PATIENT_VISITS_URL } from '@constants/app';
import { FhirEncounter, FhirEncounterBundle } from '@types/encounter';
import { get } from './api';

/**
 * Fetches visits for a given patient UUID from the FHIR R4 endpoint
 * @param patientUUID - The UUID of the patient
 * @returns Promise resolving to a FhirEncounterBundle
 */
export async function getPatientVisits(
  patientUUID: string,
): Promise<FhirEncounterBundle> {
  return await get<FhirEncounterBundle>(PATIENT_VISITS_URL(patientUUID));
}

/**
 * Fetches and transforms visits for a given patient UUID
 * @param patientUUID - The UUID of the patient
 * @returns Promise resolving to an array of FhirEncounter
 */
export async function getVisits(patientUUID: string): Promise<FhirEncounter[]> {
  const fhirEncounterBundle = await getPatientVisits(patientUUID);
  return fhirEncounterBundle.entry?.map((entry) => entry.resource) || [];
}

/**
 * Gets the active visit for a patient (encounter with no end date)
 * @param patientUUID - The UUID of the patient
 * @returns Promise resolving to the current FhirEncounter or null if not found
 */
export async function getActiveVisit(
  patientUUID: string,
): Promise<FhirEncounter | null> {
  const encounters = await getVisits(patientUUID);
  return encounters.find((encounter) => !encounter.period.end) || null;
}
