import i18next from 'i18next';
import { get, del, post } from '../api';
import { BAHMNI_USER_COOKIE_NAME } from '../constants/app';
import { getCookieByName, deleteCookie } from '../utils';
import {
  USER_RESOURCE_URL,
  BAHMNI_USER_LOCATION_COOKIE,
  APP_SETTINGS_URL,
  DEFAULT_DATE_FORMAT_PROPERTY,
  LOGOUT_URL,
  LOGOUT_COOKIES,
  ERROR_MESSAGES,
  AVAILABLE_LOCATIONS_URL,
  SAVE_USER_LOCATION_URL,
  UPDATE_SESSION_LOCATION_URL,
} from './constants';
import {
  UserResponse,
  User,
  UserLocation,
  AppSettingsResponse,
  LocationsResponse,
} from './models';

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
  if (!userLocation.uuid)
    throw new Error(i18next.t('ERROR_FETCHING_USER_LOCATION_DETAILS'));
  return userLocation;
};

/**
 * Get default date format from Bahmni app settings (commons module)
 * @returns Promise<string | null> - The default date format string (e.g., 'dd/MM/yyyy') or null if not found
 */
export const getDefaultDateFormat = async (): Promise<string | null> => {
  const settings = await get<AppSettingsResponse>(APP_SETTINGS_URL('commons'));
  const dateFormatSetting = settings.find(
    (setting) => setting.property === DEFAULT_DATE_FORMAT_PROPERTY,
  );
  return dateFormatSetting?.value ?? null;
};

/**
 * Fetches available locations with Login Location tag
 * @returns Promise<UserLocation[]> - Array of available locations
 * @throws Error when API call fails
 */
export const getAvailableLocations = async (): Promise<UserLocation[]> => {
  const response = await get<LocationsResponse>(AVAILABLE_LOCATIONS_URL);
  return response.results ?? [];
};

/**
 * Logs out the current user by clearing session and cookies
 * @throws Error with i18n key if logout fails
 */
export const logout = async (): Promise<void> => {
  try {
    await del(LOGOUT_URL);
    LOGOUT_COOKIES.forEach((cookieName) => {
      deleteCookie(cookieName);
    });
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Logout failed:', error);
    throw new Error(i18next.t(ERROR_MESSAGES.LOGOUT_FAILED));
  }
};

/**
 * Saves the user's location preference to the server
 * @param userUuid - The UUID of the user
 * @param location - The location object to save
 * @throws Error when the API call fails
 */
export const saveUserLocation = async (
  userUuid: string,
  location: UserLocation,
): Promise<void> => {
  await post(SAVE_USER_LOCATION_URL(userUuid), {
    userProperties: { loginLocation: location.uuid },
  });
};

/**
 * Updates the OpenMRS server-side session with the selected location.
 * This ensures encounters and observations are attributed to the correct location.
 * @param locationUuid - The UUID of the location to set on the session
 * @throws Error when the API call fails
 */
export const updateSessionLocation = async (
  locationUuid: string,
): Promise<void> => {
  await post(UPDATE_SESSION_LOCATION_URL, { sessionLocation: locationUuid });
};
