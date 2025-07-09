import { Visit, VisitFormData, EncounterFormData, VisitType } from '@/types/registration';
import { Provider } from '@/types/provider';
import { FhirEncounter as Encounter } from '@/types/encounter';
import { httpClient } from '../httpClient';

const BASE_URL = '/bahmni/openmrs/ws/rest/v1/visit';

export const VisitService = {
  async searchVisits(params: any): Promise<{ results: Visit[] }> {
    const response = await httpClient.get(BASE_URL, { params });
    return response.data;
  },

  async getActiveVisitsForPatient(patientUuid: string, locationUuid?: string): Promise<Visit[]> {
    const response = await this.searchVisits({
      patient: patientUuid,
      includeInactive: false,
      v: 'custom:(uuid,location:(uuid))',
    });

    let visits = response.results || [];

    if (locationUuid) {
      visits = visits.filter((visit) => visit.location.uuid === locationUuid);
    }

    return visits;
  },

  async createVisit(visitData: VisitFormData, patientUuid: string): Promise<Visit> {
    const response = await httpClient.post(BASE_URL, visitData);
    return response.data;
  },

  async updateVisit(visitUuid: string, visitData: VisitFormData): Promise<Visit> {
    const response = await httpClient.post(`${BASE_URL}/${visitUuid}`, visitData);
    return response.data;
  },

  async closeVisit(visitUuid: string, stopDatetime?: string): Promise<Visit> {
    const updateData = {
      stopDatetime: stopDatetime || new Date().toISOString(),
    };
    const response = await httpClient.post(`${BASE_URL}/${visitUuid}`, updateData);
    return response.data;
  },

  async createEncounter(encounterData: EncounterFormData): Promise<Encounter> {
    const response = await httpClient.post('/bahmni/openmrs/ws/rest/v1/encounter', encounterData);
    return response.data;
  },

  async getVisitTypes(): Promise<VisitType[]> {
    const response = await httpClient.get('/bahmni/openmrs/ws/rest/v1/visittype');
    return response.data.results || [];
  },

  async getProviders(): Promise<Provider[]> {
    const response = await httpClient.get('/bahmni/openmrs/ws/rest/v1/provider');
    return response.data.results || [];
  },
};
