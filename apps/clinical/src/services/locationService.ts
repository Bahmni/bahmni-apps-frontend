import { getCookieByName } from '@bahmni/services';
import { BAHMNI_USER_LOCATION_COOKIE_NAME } from '../constants/app';
import { COMMON_ERROR_MESSAGES } from '../constants/errors';
import { OpenMRSLocation } from '../models/location';

/**
 * Fetches just the current location from bahmni.user.location cookie
 * @returns Promise resolving to an array of OpenMRSLocation objects
 * @throws Error if cookie is not found
 */
export async function getLocations(): Promise<OpenMRSLocation[]> {
  try {
    // Get the cookie value
    const cookieValue = getCookieByName(BAHMNI_USER_LOCATION_COOKIE_NAME);

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
  } catch (_) {
    throw new Error(COMMON_ERROR_MESSAGES.UNEXPECTED_ERROR);
  }
}
