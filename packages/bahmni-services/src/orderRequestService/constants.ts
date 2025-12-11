import { OPENMRS_FHIR_R4 } from '../constants/app';

export const SERVICE_REQUESTS_URL = (
  category: string,
  patientUuid: string,
  encounterUuids?: string[],
) => {
  const baseUrl = OPENMRS_FHIR_R4 + '/ServiceRequest?_sort=-_lastUpdated';
  let url = `${baseUrl}&category=${category}&patient=${patientUuid}`;

  if (encounterUuids && encounterUuids.length > 0) {
    url += `&encounter=${encounterUuids.join(',')}`;
  }

  return url;
};
