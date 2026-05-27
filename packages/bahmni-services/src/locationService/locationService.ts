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
 * @returns Promise resolving to the raw FHIR Bundle response
 */
export async function getFHIRLocationsByTag(tag: string): Promise<FHIRBundle> {
  return await get<FHIRBundle>(FHIR_LOCATION_BY_TAG_URL(tag));
}
