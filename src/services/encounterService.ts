import { get } from './api';
import { PATIENT_ENCOUNTER_RESOURCE_URL } from '@constants/app';
import { FhirEncounter, FhirEncounterBundle } from '@types/encounter';

/**
 * Fetches encounter bundle for a given patient UUID from the FHIR R4 endpoint
 * @param patientUUID - The UUID of the patient
 * @returns Promise resolving to a FhirEncounterBundle
 */
export async function getPatientEncountersBundle(
  patientUUID: string,
): Promise<FhirEncounterBundle> {
  return await get<FhirEncounterBundle>(
    PATIENT_ENCOUNTER_RESOURCE_URL(patientUUID),
  );
}

/**
 * Fetches and transforms encounters for a given patient UUID
 * @param patientUUID - The UUID of the patient
 * @returns Promise resolving to an array of FhirEncounter
 */
export async function getEncounters(
  patientUUID: string,
): Promise<FhirEncounter[]> {
  const fhirEncounterBundle = await getPatientEncountersBundle(patientUUID);
  return fhirEncounterBundle.entry?.map((entry) => entry.resource) || [];
}

/**
 * Gets the current active encounter for a patient (encounter with no end date)
 * @param patientUUID - The UUID of the patient
 * @returns Promise resolving to the current FhirEncounter or null if not found
 */
export async function getCurrentEncounter(
  patientUUID: string,
): Promise<FhirEncounter | null> {
  const encounters = await getEncounters(patientUUID);
  return encounters.find((encounter) => !encounter.period.end) || null;
}
