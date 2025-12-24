/**
 * Utility functions for encounter filtering logic
 */

/**
 * Determines if the encounter filter should show empty state based on episode of care and encounter UUIDs
 *
 * @param episodeOfCareUuids - Array of episode of care UUIDs
 * @param encounterUuids - Array of encounter UUIDs
 * @returns boolean - true if should show empty state, false otherwise
 *
 * Logic:
 * - If episodeOfCareUuids is empty array, return false (don't show empty state)
 * - Otherwise, if encounterUuids is empty array, return true (show empty state)
 * - If both have values or are undefined/null, return false (don't show empty state)
 */
export const shouldEnableEncounterFilter = (
  episodeOfCareUuids?: string[],
  encounterUuids?: string[],
): boolean => {
  return episodeOfCareUuids?.length === 0
    ? false
    : encounterUuids?.length === 0;
};
