import { FhirPatient as Patient } from '@/types/patient';
import { httpClient } from '@/services/httpClient';

const BASE_URL = '/bahmni/openmrs/ws/rest/v1/bahmnicore/patientprofile';

export const PatientService = {
  async getPatient(uuid: string): Promise<Patient> {
    const response = await httpClient.get(`${BASE_URL}/${uuid}`, { params: { v: 'full' } });
    return response.data;
  },

  async createPatient(patient: Patient, jumpAccepted: boolean): Promise<any> {
    const response = await httpClient.post(BASE_URL, patient, {
      headers: { 'Jump-Accepted': jumpAccepted },
    });
    return response.data;
  },

  async updatePatient(uuid: string, patient: Patient): Promise<any> {
    const response = await httpClient.post(`${BASE_URL}/${uuid}`, patient);
    return response.data;
  },

  async updatePatientImage(uuid: string, image: string): Promise<any> {
    const url = '/bahmni/openmrs/ws/rest/v1/personimage/';
    const data = {
      person: { uuid },
      base64EncodedImage: image,
    };
    const response = await httpClient.post(url, data);
    return response.data;
  },
};
