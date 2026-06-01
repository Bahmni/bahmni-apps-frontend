import { get } from '../api';
import { type Location } from '../locationService/models';
import { ALL_PROVIDERS_URL, PROVIDER_RESOURCE_URL } from './constants';
import { Provider, ProviderResponse } from './models';

/**
 * Fetches the provider record for the given user UUID
 * @returns Promise resolving to the Provider or null if not found
 */
export async function getCurrentProvider(
  userUUID: string,
): Promise<Provider | null> {
  const providerResponse: ProviderResponse = await get<ProviderResponse>(
    PROVIDER_RESOURCE_URL(userUUID),
  );
  if (!providerResponse.results || providerResponse.results.length === 0) {
    return null;
  }

  return providerResponse.results[0];
}

/**
 * Fetches all providers from OpenMRS with pagination support
 * Iterates through all pages until no "next" link is found
 * @returns Promise resolving to an array of all Provider objects
 */
export async function fetchAllProviders(): Promise<Provider[]> {
  const allProviders: Provider[] = [];
  let nextUrl: string | null = ALL_PROVIDERS_URL;

  while (nextUrl) {
    const response: ProviderResponse = await get<ProviderResponse>(nextUrl);
    allProviders.push(...(response.results ?? []));

    const nextLink = response.links?.find((link) => link.rel === 'next');
    nextUrl = nextLink?.uri ?? null;
  }

  return allProviders;
}

/**
 * Fetches login locations from user's provider attributes
 * @param userUuid - The UUID of the user whose provider login locations to fetch
 * @returns Promise resolving to an array of Location objects from provider's Login Locations attributes
 */
export async function getProviderLoginLocations(
  userUuid: string,
): Promise<Location[]> {
  const response = await get<ProviderResponse>(PROVIDER_RESOURCE_URL(userUuid));

  if (!response.results || response.results.length === 0) {
    return [];
  }

  const provider = response.results[0];
  if (!provider.attributes) {
    return [];
  }

  return provider.attributes
    .filter(
      (attr) =>
        !attr.voided && attr.attributeType.display === 'Login Locations',
    )
    .map((attr) => attr.value as Location);
}
