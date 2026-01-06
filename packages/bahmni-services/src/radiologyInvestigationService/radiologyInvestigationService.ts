import { Bundle, ServiceRequest } from 'fhir/r4';
import { get } from '../api';
import { PATIENT_RADIOLOGY_RESOURCE_URL } from './constants';

/**
 * Fetches radiology investigations for a given patient UUID from the FHIR R4 endpoint
 * @param patientUUID - The UUID of the patient
 * @returns Promise resolving to a Bundle containing radiology investigations
 */
export async function getPatientRadiologyInvestigationBundle(
  patientUUID: string,
): Promise<Bundle> {
  const url = PATIENT_RADIOLOGY_RESOURCE_URL(patientUUID);
  return await get<Bundle>(url);
}

/**
 * Fetches and formats radiology investigations for a given patient UUID
 * @param patientUUID - The UUID of the patient
 * @param category
 * @param encounterUuids
 * @param numberOfVisits
 * @returns Promise resolving to an array of radiology investigations
 */
export async function getPatientRadiologyInvestigations(
  patientUUID: string,
): Promise<ServiceRequest[]> {
  const bundle = await getPatientRadiologyInvestigationBundle(patientUUID);
  const radiologyInvestigations =
    bundle.entry
      ?.filter((entry) => entry.resource?.resourceType === 'ServiceRequest')
      .map((entry) => entry.resource as ServiceRequest) ?? [];
  return radiologyInvestigations;
}
