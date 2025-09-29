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

export const PATIENT_CUSTOM_ATTRIBUTE_SEARCH_URL = (
  searchTerm: string,
  searchFields: string[],
  resultFields: string[],
  loginLocationUuid: string,
) => {
  const trimmedSearchTerm = searchTerm.trim();

  const params = new URLSearchParams({
    customAttribute: trimmedSearchTerm,
    loginLocationUuid,
    startIndex: '0',
  });

  searchFields.forEach((field) => {
    params.append('patientAttributes', field);
  });
  resultFields.forEach((field) => {
    params.append('patientSearchResultsConfig', field);
  });

  return OPENMRS_REST_V1 + `/bahmni/search/patient?${params.toString()}`;
};
