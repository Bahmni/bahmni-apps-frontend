import { get } from '../api';
import { ORDERS_BASE_URL, PROVIDER_ENDPOINT_PATTERN } from './constants';

export interface Provider {
  id: string;
  name: string;
  uuid?: string;
}

export interface ProviderResponse {
  results: Array<{
    id: string;
    name: string;
    uuid: string;
  }>;
}

export const fetchProvidersByTab = async (
  tabLabel: string,
  tabPractitionerTypeMap?: Record<string, string>,
): Promise<Provider[]> => {
  if (!tabPractitionerTypeMap) {
    return [];
  }

  const practitionerType = tabPractitionerTypeMap[tabLabel];

  if (!practitionerType) {
    return [];
  }

  try {
    const encodedPractitionerType = encodeURIComponent(practitionerType);
    const url = `${ORDERS_BASE_URL}${PROVIDER_ENDPOINT_PATTERN}${encodedPractitionerType}`;
    const response = await get<ProviderResponse>(url);

    if (response?.results && Array.isArray(response.results)) {
      return response.results.map((provider) => ({
        id: provider.uuid || provider.id,
        name: provider.name,
        uuid: provider.uuid,
      }));
    }

    return [];
  } catch {
    return [];
  }
};
