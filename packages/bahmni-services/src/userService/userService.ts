import i18next from 'i18next';
import { get } from '../api';
import { BAHMNI_USER_COOKIE_NAME } from '../constants/app';
import { getCookieByName } from '../utils';
import { USER_RESOURCE_URL } from './constants';
import { UserResponse, User } from './models';

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
