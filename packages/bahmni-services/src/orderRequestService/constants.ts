import { OPENMRS_FHIR_R4 } from '../constants/app';

export const SERVICE_REQUESTS_URL = (category: string, patientUuid: string) => {
  const baseUrl = OPENMRS_FHIR_R4 + '/ServiceRequest?_sort=-_lastUpdated';
  return `${baseUrl}&category=${category}&patient=${patientUuid}`;
};
