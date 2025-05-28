import { get } from './api';
import { USER_RESOURCE_URL, BAHMNI_USER_COOKIE_NAME } from '@constants/app';
import { UserResponse, User } from '@types/user';
import { getCookieByName, getFormattedError } from '@utils/common';
import notificationService from '@services/notificationService';

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
  } catch (error) {
    const { title, message } = getFormattedError(error);
    notificationService.showError(title, message);
    return null;
  }
}
