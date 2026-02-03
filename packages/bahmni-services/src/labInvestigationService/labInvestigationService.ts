import { Bundle, ServiceRequest } from 'fhir/r4';
import { getServiceRequests } from '../orderRequestService';

/**
 * Fetches lab investigation bundle from the FHIR R4 endpoint
 * @param category - The category UUID to filter by (order type)
 * @param patientUuid - Patient UUID to filter by
 * @param encounterUuids - Optional encounter UUIDs to filter by
 * @param numberOfVisits - Optional number of visits to filter by
 * @returns Promise resolving to ServiceRequest Bundle
 */
export async function getLabInvestigationsBundle(
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
