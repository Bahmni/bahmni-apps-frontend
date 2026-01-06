import { Bundle, ServiceRequest, ImagingStudy } from 'fhir/r4';
import { getServiceRequests } from '../orderRequestService';

/**
 * Fetches radiology investigations for a given patient UUID from the FHIR R4 endpoint
 * @param patientUUID - The UUID of the patient
 * @param category - The category of the investigations
 * @param encounterUuids - Optional array of encounter UUIDs to filter the investigations
 * @param numberOfVisits - Optional number of visits to consider
 * @returns Promise resolving to a Bundle containing radiology investigations
 */
export async function getPatientRadiologyInvestigationBundle(
  patientUUID: string,
  category: string,
  encounterUuids?: string[],
  numberOfVisits?: number,
): Promise<Bundle<ServiceRequest>> {
  return await getServiceRequests(
    category,
    patientUUID,
    encounterUuids,
    numberOfVisits,
  );
}

/**
 * Fetches radiology investigations bundle with ImagingStudy resources included
 * @param patientUUID - The UUID of the patient
 * @param category - The category of the investigations
 * @param encounterUuids - Optional array of encounter UUIDs to filter the investigations
 * @param numberOfVisits - Optional number of visits to consider
 * @returns Promise resolving to a Bundle containing both ServiceRequest and ImagingStudy resources
 */
export async function getPatientRadiologyInvestigationBundleWithImagingStudy(
  patientUUID: string,
  category: string,
  encounterUuids?: string[],
  numberOfVisits?: number,
): Promise<Bundle<ServiceRequest | ImagingStudy>> {
  return await getServiceRequests<ServiceRequest | ImagingStudy>(
    category,
    patientUUID,
    encounterUuids,
    numberOfVisits,
    'ImagingStudy:basedon',
  );
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
  category: string,
  encounterUuids?: string[],
  numberOfVisits?: number,
): Promise<ServiceRequest[]> {
  const bundle = await getServiceRequests(
    category,
    patientUUID,
    encounterUuids,
    numberOfVisits,
  );
  const radiologyInvestigations =
    bundle.entry
      ?.filter((entry) => entry.resource?.resourceType === 'ServiceRequest')
      .map((entry) => entry.resource as ServiceRequest) ?? [];
  return radiologyInvestigations;
}
