import { get } from '../api';
import { type Location } from '../locationService/models';
import { ALL_PROVIDERS_URL, PROVIDER_RESOURCE_URL } from './constants';
import { Provider, ProviderResponse, LocationAttributeValue } from './models';

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
 * Fetches all providers from OpenMRS
 * @returns Promise resolving to an array of Provider objects
 */
export async function getAllProviders(): Promise<Provider[]> {
  const response = await get<ProviderResponse>(ALL_PROVIDERS_URL);
  return response.results ?? [];
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
        !attr.voided &&
        attr.attributeType?.display === 'Login Locations' &&
        (attr.value as LocationAttributeValue).tags?.some(
          (tag) => tag.display === 'Appointment Location',
        ),
    )
    .map((attr) => {
      const locationValue = attr.value as LocationAttributeValue;
      return {
        uuid: locationValue.uuid,
        display: locationValue.display,
        childLocations: [],
      };
    });
}
