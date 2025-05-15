import { get } from './api';
import { OpenMRSLocation, OpenMRSLocationResponse } from '@/types/location';
import { LOCATION_RESOURCE_URL } from '@constants/app';

/**
 * Fetches all available locations from the OpenMRS API
 * @returns Promise resolving to an array of OpenMRSLocation objects
 */
export async function getLocations(): Promise<OpenMRSLocation[]> {
  const response = await get<OpenMRSLocationResponse>(LOCATION_RESOURCE_URL);
  return response.results || [];
}
