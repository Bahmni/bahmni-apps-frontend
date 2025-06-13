import { RadiologyInvestigation } from '@types/radiologyInvestigation';
import { getPriorityByOrder } from './common';

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
  investigations: RadiologyInvestigation[],
): RadiologyInvestigation[] => {
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
export const filterReplacementEntries = (
  investigations: RadiologyInvestigation[],
): RadiologyInvestigation[] => {
  const replacingIds = new Set<string>();
  const replacedIds = new Set<string>();

  investigations.forEach((investigation) => {
    if (investigation.replaces && investigation.replaces.length > 0) {
      replacingIds.add(investigation.id);
      investigation.replaces.forEach((replacedId) => {
        replacedIds.add(replacedId);
      });
    }
  });

  return investigations.filter((investigation) => {
    const isReplacing = replacingIds.has(investigation.id);
    const isReplaced = replacedIds.has(investigation.id);
    return !isReplacing && !isReplaced;
  });
};
