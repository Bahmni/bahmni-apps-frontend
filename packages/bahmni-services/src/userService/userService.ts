import i18next from 'i18next';
import { get } from '../api';
import { BAHMNI_USER_COOKIE_NAME } from '../constants/app';
import { getCookieByName } from '../utils';
import { USER_RESOURCE_URL, BAHMNI_USER_LOCATION_COOKIE } from './constants';
import { UserResponse, User, UserLocation } from './models';

export async function getCurrentUser(): Promise<User | null> {
  // Get username from cookie
  const encodedUsername = getCookieByName(BAHMNI_USER_COOKIE_NAME);
  if (!encodedUsername) {
    return null;
  }
  try {
    // Decode username from cookie value (handles URL encoding and quotes)
    const username = decodeURIComponent(encodedUsername).replace(
      /^"(.*)"$/,
      '$1',
    );
    // Get User from REST API
    const userResponse = await get<UserResponse>(USER_RESOURCE_URL(username));
    if (!userResponse.results || userResponse.results.length === 0) {
      return null;
    }

    return userResponse.results[0];
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
  } catch (_) {
    throw new Error(i18next.t('ERROR_FETCHING_USER_DETAILS'));
  }
}

/**
 * Fetches user's log in location details from the cache.
 * @returns The user's log in location if valid
 * @returns null if user location cookie not found or invalid
 * @throws Error when the user login location is null / invalid
 */
export const getUserLoginLocation = (): UserLocation => {
  const encodedUserLocation =
    getCookieByName(BAHMNI_USER_LOCATION_COOKIE) ?? null;
  if (!encodedUserLocation)
    throw new Error(i18next.t('ERROR_FETCHING_USER_LOCATION_DETAILS'));
  const userLocation: UserLocation = JSON.parse(
    decodeURIComponent(encodedUserLocation).replace(/^"(.*)"$/, '$1'),
  );
  if (!userLocation.name || !userLocation.uuid)
    throw new Error(i18next.t('ERROR_FETCHING_USER_LOCATION_DETAILS'));
  return userLocation;
};
