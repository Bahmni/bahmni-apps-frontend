import { COMMON_ERROR_MESSAGES } from '@/constants/errors';
import { OpenMRSLocation } from '@/types/location';
import { getCookieByName } from '@/utils/common';

/**
 * Fetches just the current location from bahmni.user.location cookie
 * @returns Promise resolving to an array of OpenMRSLocation objects
 * @throws Error if cookie is not found
 */
export async function getLocations(): Promise<OpenMRSLocation[]> {
  try {
    // Get the cookie value
    const cookieValue = getCookieByName('bahmni.user.location');

    if (!cookieValue) {
      return [];
    }

    // Decode URL-encoded JSON
    const decodedCookie = decodeURIComponent(cookieValue);
    // Parse the JSON string to object
    const locationData = JSON.parse(decodedCookie);

    // Transform to required format
    const location: OpenMRSLocation = {
      uuid: locationData.uuid,
      display: locationData.name,
      links: [], // Empty links array as it's not provided in the cookie
    };

    return [location];
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
  } catch (error) {
    throw new Error(COMMON_ERROR_MESSAGES.UNEXPECTED_ERROR);
  }
}
