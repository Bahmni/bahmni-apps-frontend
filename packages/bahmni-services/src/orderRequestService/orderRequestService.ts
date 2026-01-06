import type { Bundle, ServiceRequest, Resource } from 'fhir/r4';
import { get } from '../api';
import { SERVICE_REQUESTS_URL } from './constants';

/**
 * Fetches service requests from the FHIR R4 endpoint
 * @param category - Optional category UUID to filter by
 * @param patientUuid - Patient UUID to filter by
 * @param encounterUuids - Optional encounter UUIDs to filter by
 * @param numberOfVisits
 * @param revinclude - Optional _revinclude parameter for related resources
 * @returns Promise resolving to ServiceRequest Bundle
 */
export async function getServiceRequests<T extends Resource = ServiceRequest>(
  category: string,
  patientUuid: string,
  encounterUuids?: string[],
  numberOfVisits?: number,
  revinclude?: string,
): Promise<Bundle<T>> {
  let encounterUuidsString: string | undefined;

  if (encounterUuids && encounterUuids.length > 0) {
    encounterUuidsString = encounterUuids.join(',');
  }

  return await get<Bundle<T>>(
    SERVICE_REQUESTS_URL(
      category,
      patientUuid,
      encounterUuidsString,
      numberOfVisits,
      revinclude,
    ),
  );
}
