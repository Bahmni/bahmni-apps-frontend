import type { Bundle, ServiceRequest, Resource } from 'fhir/r4';
import { get } from '../api';
import {
  SERVICE_REQUESTS_URL,
  SERVICE_REQUESTS_WORKLIST_URL,
} from './constants';

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

  const bundle = await get<Bundle<T>>(
    SERVICE_REQUESTS_URL(
      category,
      patientUuid,
      encounterUuidsString,
      numberOfVisits,
      revinclude,
    ),
  );

  return bundle;
}

/**
 * Fetches all pending service requests of a given category (across patients) for the orders
 * worklist, scoped to a location. taskStatus/owner/notes are read straight off the returned
 * ServiceRequest's extensions (populated server-side from the linked FHIR Task) — no separate
 * Task fetch is needed for these order types.
 */
export async function getServiceRequestsForWorklist<
  T extends Resource = ServiceRequest,
>(category: string, locationUuid: string): Promise<Bundle<T>> {
  return await get<Bundle<T>>(
    SERVICE_REQUESTS_WORKLIST_URL(category, locationUuid),
  );
}
