import { FhirPatient as Patient } from '@/types/patient';
import { httpClient } from '@/services/httpClient';

const BASE_URL = '/bahmni/openmrs/ws/rest/v1/bahmnicore/search/patient';

export const SearchService = {
  async search(params: any): Promise<Patient[]> {
    const response = await httpClient.get(BASE_URL, { params });
    return response.data;
  },

  async searchByIdentifier(identifier: string): Promise<Patient | null> {
    const response = await httpClient.get(BASE_URL, {
      params: { identifier, v: 'full' },
    });
    return response.data.results.length > 0 ? response.data.results[0] : null;
  },
};
