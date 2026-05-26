import { get } from '../api';
import { LOCATION_BY_TAG_URL, FHIR_LOCATION_BY_TAG_URL } from './constants';
import { Location, LocationResponse, FHIRBundle } from './models';

/**
 * Fetches locations from OpenMRS filtered by a given tag
 * @param tag - The location tag to filter by (e.g. "Login Location")
 * @returns Promise resolving to an array of Location objects
 */
export async function getLocationByTag(tag: string): Promise<Location[]> {
  const response = await get<LocationResponse>(LOCATION_BY_TAG_URL(tag));
  return response.results ?? [];
}

/**
 * Fetches locations from FHIR API filtered by a given tag
 * @param tag - The location tag to filter by (e.g. "Appointment Location")
 * @returns Promise resolving to an array of Location objects
 */
export async function getFHIRLocationsByTag(tag: string): Promise<Location[]> {
  const response = await get<FHIRBundle>(FHIR_LOCATION_BY_TAG_URL(tag));

  if (!response.entry || response.entry.length === 0) {
    return [];
  }

  return response.entry.map((entry) => ({
    uuid: entry.resource.id,
    display: entry.resource.name,
    childLocations: [],
  }));
}
