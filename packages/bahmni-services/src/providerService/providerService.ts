import { get } from '../api';
import { type Location } from '../locationService/models';
import { ALL_PROVIDERS_URL, PROVIDER_RESOURCE_URL } from './constants';
import { Link, Provider, ProviderResponse } from './models';

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

/**
 * Fetches providers from OpenMRS (single page)
 * @param url - Optional URL to fetch (defaults to ALL_PROVIDERS_URL)
 * @returns Promise resolving to an array of Provider objects
 */
export async function getPaginatedProviders(
  url: string = ALL_PROVIDERS_URL,
): Promise<Provider[]> {
  const response = await get<ProviderResponse>(url);
  return response.results ?? [];
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
    const currentUrl = nextUrl;
    const response: ProviderResponse = await get<ProviderResponse>(currentUrl);
    allProviders.push(...(response.results ?? []));

    const nextLink: Link | undefined = response.links?.find(
      (link: Link) => link.rel === 'next',
    );
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
        !attr.voided && attr.attributeType?.display === 'Login Locations',
    )
    .map((attr) => {
      const locationValue = attr.value as Location;
      return {
        uuid: locationValue.uuid,
        display: locationValue.display,
        childLocations: [],
        tags: locationValue.tags,
      };
    });
}
