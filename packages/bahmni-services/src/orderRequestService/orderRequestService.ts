import { get } from '../api';
import { SERVICE_REQUESTS_URL } from './constants';
import type { ServiceRequestBundle } from './models';

/**
 * Fetches service requests from the FHIR R4 endpoint
 * @param category - Optional category UUID to filter by
 * @param patientUuid
 * @returns Promise resolving to ServiceRequest Bundle
 */
export async function getServiceRequests(
  category: string,
  patientUuid: string,
): Promise<ServiceRequestBundle> {
  return await get<ServiceRequestBundle>(
    SERVICE_REQUESTS_URL(category, patientUuid),
  );
}
