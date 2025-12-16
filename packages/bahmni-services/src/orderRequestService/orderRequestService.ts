import type { Bundle, ServiceRequest } from 'fhir/r4';
import { get } from '../api';
import { SERVICE_REQUESTS_URL } from './constants';

/**
 * Fetches service requests from the FHIR R4 endpoint
 * @param category - Optional category UUID to filter by
 * @param patientUuid - Patient UUID to filter by
 * @param encounterUuids - Optional encounter UUIDs to filter by
 * @param visitUuids - Optional visit UUIDs to filter by
 * @returns Promise resolving to ServiceRequest Bundle
 */
export async function getServiceRequests(
  category: string,
  patientUuid: string,
  encounterUuids?: string[],
): Promise<Bundle<ServiceRequest>> {
  let encounterUuidsString: string | undefined;

  if (encounterUuids && encounterUuids.length > 0) {
    encounterUuidsString = encounterUuids.join(',');
  }

  return await get<Bundle<ServiceRequest>>(
    SERVICE_REQUESTS_URL(category, patientUuid, encounterUuidsString),
  );
}
