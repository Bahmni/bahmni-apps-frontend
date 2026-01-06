import { getPriorityByOrder, filterReplacementEntries } from '@bahmni/services';
import { ServiceRequest } from 'fhir/r4';
import { RadiologyInvestigationViewModel } from './models';

/**
 * Priority order for radiology investigation priorities (case insensitive)
 * Index 0 = highest priority, higher index = lower priority
 * Used for sorting radiology investigations by priority: stat → routine
 */
export const PRIORITY_ORDER = ['stat', 'routine'];

/**
 * Maps radiology investigation priority to numeric priority for sorting
 * Uses generic getPriorityByOrder function with PRIORITY_ORDER
 * @param priority - The priority of the radiology investigation
 * @returns Numeric priority (lower = higher priority)
 */
export const getRadiologyPriority = (priority: string): number => {
  return getPriorityByOrder(priority, PRIORITY_ORDER);
};

/**
 * Sorts radiology investigations by priority: stat → routine
 * Maintains stable sorting (preserves original order for same priority)
 * @param investigations - Array of radiology investigations to sort
 * @returns New sorted array (does not mutate original)
 */
export const sortRadiologyInvestigationsByPriority = (
  investigations: RadiologyInvestigationViewModel[],
): RadiologyInvestigationViewModel[] => {
  return [...investigations].sort((a, b) => {
    return getRadiologyPriority(a.priority) - getRadiologyPriority(b.priority);
  });
};

/**
 * Filters out radiology investigations that have replacement relationships
 * Removes both the replacing entry (has replaces field) and the replaced entries (referenced in replaces)
 * This prevents duplicate entries from showing in the UI where one investigation replaces another
 * @param investigations - Array of formatted radiology investigations
 * @returns Filtered array without replacement-related entries
 */
export const filterRadiologyInvestionsReplacementEntries = (
  investigations: RadiologyInvestigationViewModel[],
): RadiologyInvestigationViewModel[] => {
  return filterReplacementEntries(
    investigations,
    (investigation) => investigation.id,
    (investigation) => investigation.replaces,
  );
};

/**
 * Transforms FHIR ServiceRequest resources into radiology investigation view models
 * @param serviceRequests - Array of FHIR ServiceRequest resources
 * @returns Array of RadiologyInvestigationViewModel view models ready for table rendering
 */
export function createRadiologyInvestigationViewModels(
  serviceRequests: ServiceRequest[],
): RadiologyInvestigationViewModel[] {
  return serviceRequests.map((order) => {
    const orderedDate = order.occurrencePeriod?.start as string;

    const replaces = order.replaces
      ?.map((replace) => {
        const reference = replace.reference ?? '';
        return reference.split('/').pop() ?? '';
      })
      .filter((id) => id.length > 0);

    const note = order.note?.[0]?.text;

    return {
      id: order.id as string,
      testName: order.code!.text!,
      priority: order.priority!,
      orderedBy: order.requester!.display!,
      orderedDate: orderedDate,
      ...(replaces && replaces.length > 0 && { replaces }),
      ...(note && { note }),
    };
  });
}
