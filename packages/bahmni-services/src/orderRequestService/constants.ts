import { OPENMRS_FHIR_R4 } from '../constants/app';

// Higher count than other FHIR resources (100) because patients
// can accumulate a large volume of orders across visits.
export const SERVICE_REQUEST_QUERY_PARAMS = {
  // Base parameters for all medication request queries
  SORT: '_sort=-_lastUpdated',
  COUNT: '_count=100',
  // Include parameter to fetch related Medication resource in single call
  // Trade-off: Larger payload but avoids redundant API calls
  // Use only when medication details are needed immediately
  INCLUDE_PATIENT: '_include=ServiceRequest:patient',
  INCLUDE_REQUESTER: '_include=ServiceRequest:requester',
} as const;

export const SERVICE_REQUESTS_WORKLIST_URL = (
  category: string,
  locationUuid: string,
) =>
  `${OPENMRS_FHIR_R4}/ServiceRequest?${SERVICE_REQUEST_QUERY_PARAMS.SORT}&category=${category}&location=${locationUuid}&${SERVICE_REQUEST_QUERY_PARAMS.INCLUDE_PATIENT}&${SERVICE_REQUEST_QUERY_PARAMS.INCLUDE_REQUESTER}&${SERVICE_REQUEST_QUERY_PARAMS.COUNT}`;

export const SERVICE_REQUESTS_URL = (
  category: string,
  patientUuid: string,
  encounterUuids?: string,
  numberOfVisits?: number,
  revinclude?: string,
) => {
  const baseUrl =
    OPENMRS_FHIR_R4 + `/ServiceRequest?${SERVICE_REQUEST_QUERY_PARAMS.SORT}`;
  let url = `${baseUrl}&category=${category}&patient=${patientUuid}&${SERVICE_REQUEST_QUERY_PARAMS.COUNT}`;

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
