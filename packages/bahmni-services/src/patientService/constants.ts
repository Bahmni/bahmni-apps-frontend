import { OPENMRS_FHIR_R4, OPENMRS_REST_V1 } from '../constants/app';

export const PATIENT_RESOURCE_URL = (patientUUID: string) =>
  OPENMRS_FHIR_R4 + `/Patient/${patientUUID}`;
// TODO: update get api client to pass path params
export const PATIENT_LUCENE_SEARCH_URL = (
  searchTerm: string,
  loginLocationUuid: string,
) =>
  OPENMRS_REST_V1 +
  `/bahmni/search/patient/lucene?filterOnAllIdentifiers=false&identifier=${searchTerm}&q=${searchTerm}&loginLocationUuid=${loginLocationUuid}&patientSearchResultsConfig=phoneNumber&patientSearchResultsConfig=alternatePhoneNumber&s=byIdOrName`;
