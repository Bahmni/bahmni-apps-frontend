import { OPENMRS_FHIR_R4 } from '../constants/app';

export const SERVICE_REQUESTS_URL = (
  category: string,
  patientUuid: string,
  encounterUuids?: string,
  numberOfVisits?: number,
) => {
  const baseUrl = OPENMRS_FHIR_R4 + '/ServiceRequest?_sort=-_lastUpdated';
  let url = `${baseUrl}&category=${category}&patient=${patientUuid}`;

  if (encounterUuids) {
    url += `&encounter=${encounterUuids}`;
  } else if (numberOfVisits) {
    url += `&numberOfVisits=${numberOfVisits}`;
  }

  return url;
};
