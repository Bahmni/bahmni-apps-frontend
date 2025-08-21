import { getCookieByName } from '../utils';
import { BAHMNI_USER_LOCATION_COOKIE } from './constants';

interface UserLocation {
  name: string;
  uuid: string;
}

/**
 * Fetches user's log in location details from the cache.
 * @returns The user's log in location if valid
 * @returns null if user location cookie not found or invalid
 */
export const getUserLoginLocation = (): UserLocation | null => {
  const encodedUserLocation =
    getCookieByName(BAHMNI_USER_LOCATION_COOKIE) ?? null;
  if (!encodedUserLocation) return null;
  const userLocation = decodeURIComponent(encodedUserLocation).replace(
    /^"(.*)"$/,
    '$1',
  );
  return JSON.parse(userLocation);
};
