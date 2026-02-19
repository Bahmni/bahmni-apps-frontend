import { get } from '../api';
import {
  ORDERS_BASE_URL,
  PROVIDER_ENDPOINT_PATTERN,
  TAB_PRACTITIONER_TYPE_MAP,
} from './constants';

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
): Promise<Provider[]> => {
  const practitionerType = TAB_PRACTITIONER_TYPE_MAP[tabLabel];

  if (!practitionerType) {
    return [];
  }

  try {
    const url = `${ORDERS_BASE_URL}${PROVIDER_ENDPOINT_PATTERN}${practitionerType}`;
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
