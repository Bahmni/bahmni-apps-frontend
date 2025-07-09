import { PatientConfig } from '@/types/registration';
import { httpClient } from '@/services/httpClient';

const BASE_URL = '/bahmni/openmrs/ws/rest/v1/bahmni/registration/config';

export const ConfigurationService = {
  async getPatientConfig(): Promise<PatientConfig> {
    const response = await httpClient.get(BASE_URL);
    return response.data;
  },
};
