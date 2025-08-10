import { PROVIDER_RESOURCE_URL } from './constants';
import { Provider, ProviderResponse } from './models';
import { get } from '../api';

/**
 * Fetches the current user's username from cookies and provider uuid fromREST endpoint
 * @returns Promise resolving to provider UUID or null if not found
 */
export async function getCurrentProvider(
  userUUID: string,
): Promise<Provider | null> {
  // Get Provider from REST API
  const providerResponse: ProviderResponse = await get<ProviderResponse>(
    PROVIDER_RESOURCE_URL(userUUID),
  );
  if (!providerResponse.results || providerResponse.results.length === 0) {
    return null;
  }

  return providerResponse.results[0];
}
