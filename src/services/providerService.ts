import { get } from './api';
import {
  USER_RESOURCE_URL,
  PROVIDER_RESOURCE_URL,
  BAHMNI_USER_COOKIE_NAME,
} from '@constants/app';
import { UserResponse } from '@types/user';
import { Provider, ProviderResponse } from '@types/provider';
import { getCookieByName } from '@utils/common';

/**
 * Fetches the current user's username from cookies and provider uuid fromREST endpoint
 * @returns Promise resolving to provider UUID or null if not found
 */
export async function getCurrentProvider(): Promise<Provider | null> {
  // Get username from cookie
  const encodedUsername = getCookieByName(BAHMNI_USER_COOKIE_NAME);
  if (!encodedUsername) {
    return null;
  }

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

  // Get Provider from REST API
  const providerResponse: ProviderResponse = await get<ProviderResponse>(
    PROVIDER_RESOURCE_URL(userResponse.results[0].uuid),
  );
  if (!providerResponse.results || providerResponse.results.length === 0) {
    return null;
  }

  return providerResponse.results[0];
}
