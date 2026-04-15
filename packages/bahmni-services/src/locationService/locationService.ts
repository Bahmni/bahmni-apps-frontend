import { get } from '../api';
import { LOCATION_BY_TAG_URL } from './constants';
import { Location, LocationResponse } from './models';

/**
 * Fetches locations from OpenMRS filtered by a given tag
 * @param tag - The location tag to filter by (e.g. "Login Location")
 * @returns Promise resolving to an array of Location objects
 */
export async function getLocationByTag(tag: string): Promise<Location[]> {
  const response = await get<LocationResponse>(LOCATION_BY_TAG_URL(tag));
  return response.results ?? [];
}
