import { getPriorityByOrder, filterReplacementEntries } from '@bahmni/services';
import type { Bundle, BundleEntry, ServiceRequest } from 'fhir/r4';

import { ServiceRequestViewModel } from './models';

/**
 * Priority order for service request priorities (case insensitive)
 * Index 0 = highest priority, higher index = lower priority
 * Used for sorting service requests by priority: stat → routine
 */
export const PRIORITY_ORDER = ['stat', 'routine'];

/**
 * Maps service request priority to numeric priority for sorting
 * Uses generic getPriorityByOrder function with PRIORITY_ORDER
 * @param priority - The priority of the service request
 * @returns Numeric priority (lower = higher priority)
 */
export const getServiceRequestPriority = (priority: string): number => {
  return getPriorityByOrder(priority, PRIORITY_ORDER);
};

/**
 * Sorts service requests by priority: stat → routine
 * Maintains stable sorting (preserves original order for same priority)
 * @param requests - Array of service requests to sort
 * @returns New sorted array (does not mutate original)
 */
export const sortServiceRequestsByPriority = (
  requests: ServiceRequestViewModel[],
): ServiceRequestViewModel[] => {
  return [...requests].sort((a, b) => {
    return (
      getServiceRequestPriority(a.priority) -
      getServiceRequestPriority(b.priority)
    );
  });
};

/**
 * Filters out service requests that have replacement relationships
 * Removes both the replacing entry (has replaces field) and the replaced entries (referenced in replaces)
 * This prevents duplicate entries from showing in the UI where one request replaces another
 * @param requests - Array of formatted service requests
 * @returns Filtered array without replacement-related entries
 */
export const filterServiceRequestReplacementEntries = (
  requests: ServiceRequestViewModel[],
): ServiceRequestViewModel[] => {
  return filterReplacementEntries(
    requests,
    (request) => request.id,
    (request) => request.replaces,
  );
};

/**
 * Formats FHIR service requests into a more user-friendly format
 * @param bundle - The FHIR bundle to format
 * @returns An array of formatted service request view model objects
 */
export function mapServiceRequest(
  bundle: Bundle<ServiceRequest>,
): ServiceRequestViewModel[] {
  const orders =
    bundle.entry?.map(
      (entry: BundleEntry<ServiceRequest>) => entry.resource as ServiceRequest,
    ) ?? [];

  return orders.map((order: ServiceRequest) => {
    const orderedDate = order.occurrencePeriod?.start as string;

    const replaces = order.replaces
      ?.map((replace: { reference?: string }) => {
        const reference = replace.reference ?? '';
        return reference.split('/').pop() ?? '';
      })
      .filter((id: string) => id.length > 0);

    const note = order.note?.[0]?.text;

    return {
      id: order.id as string,
      testName: order.code!.text!,
      priority: order.priority!,
      orderedBy: order.requester!.display!,
      orderedDate: orderedDate,
      status: order.status!,
      ...(replaces && replaces.length > 0 && { replaces }),
      ...(note && { note }),
    };
  });
}
