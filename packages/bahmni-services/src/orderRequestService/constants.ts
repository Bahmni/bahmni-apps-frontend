import { OPENMRS_FHIR_R4 } from '../constants/app';

// Higher count than other FHIR resources (100) because patients
// can accumulate a large volume of orders across visits.
export const SERVICE_REQUEST_COUNT = 200;

export const SERVICE_REQUESTS_URL = (
  category: string,
  patientUuid: string,
  encounterUuids?: string,
  numberOfVisits?: number,
  revinclude?: string,
) => {
  const baseUrl =
    OPENMRS_FHIR_R4 +
    `/ServiceRequest?_count=${SERVICE_REQUEST_COUNT}&_sort=-_lastUpdated`;
  let url = `${baseUrl}&category=${category}&patient=${patientUuid}`;

  if (revinclude) {
    url += `&_revinclude=${revinclude}`;
  }

  if (encounterUuids) {
    url += `&encounter=${encounterUuids}`;
  } else if (numberOfVisits) {
    url += `&numberOfVisits=${numberOfVisits}`;
  }

  return url;
};
