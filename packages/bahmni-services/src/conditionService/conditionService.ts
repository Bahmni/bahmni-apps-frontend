import { Condition, Bundle } from 'fhir/r4';
import { get } from '../api';
import { PATIENT_CONDITION_RESOURCE_URL } from './constants';

// TODO: Add Optional parameters for pagination and filtering
/**
 * Fetches conditions for a given patient UUID from the FHIR R4 endpoint
 * @param patientUUID - The UUID of the patient
 * @returns Promise resolving to a Bundle containing conditions
 */
export async function getConditionsBundle(
  patientUUID: string,
): Promise<Bundle> {
  return await get<Bundle>(`${PATIENT_CONDITION_RESOURCE_URL(patientUUID)}`);
}

/**
 * Fetches and extracts conditions for a given patient UUID
 * @param patientUUID - The UUID of the patient
 * @returns Promise resolving to an array of conditions
 */
export async function getConditions(patientUUID: string): Promise<Condition[]> {
  const bundle = await getConditionsBundle(patientUUID);
  const conditions =
    bundle.entry
      ?.filter((entry) => entry.resource?.resourceType === 'Condition')
      .map((entry) => entry.resource as Condition) ?? [];

  return conditions;
}
