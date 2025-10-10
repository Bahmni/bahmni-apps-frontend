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

export const PATIENT_SEARCH_CONFIG = {
  PHONE_NUMBER: 'phoneNumber',
  ALTERNATE_PHONE_NUMBER: 'alternatePhoneNumber',
} as const;

export const PATIENT_PHONE_NUMBER_SEARCH_URL = (
  searchTerm: string,
  loginLocationUuid: string,
) => {
  const trimmedSearchTerm = searchTerm.trim();

  const params = new URLSearchParams({
    customAttribute: trimmedSearchTerm,
    loginLocationUuid,
    startIndex: '0',
  });
  params.append('patientAttributes', PATIENT_SEARCH_CONFIG.PHONE_NUMBER);
  params.append(
    'patientAttributes',
    PATIENT_SEARCH_CONFIG.ALTERNATE_PHONE_NUMBER,
  );
  params.append(
    'patientSearchResultsConfig',
    PATIENT_SEARCH_CONFIG.PHONE_NUMBER,
  );
  params.append(
    'patientSearchResultsConfig',
    PATIENT_SEARCH_CONFIG.ALTERNATE_PHONE_NUMBER,
  );
  return OPENMRS_REST_V1 + `/bahmni/search/patient?${params.toString()}`;
};

export const IDENTIFIER_TYPES_URL = OPENMRS_REST_V1 + '/idgen/identifiertype';

export const APP_SETTINGS_URL = (module: string) =>
  OPENMRS_REST_V1 + `/bahmni/app/setting?module=${module}`;

export const PRIMARY_IDENTIFIER_TYPE_PROPERTY = 'bahmni.primaryIdentifierType';

export const CREATE_PATIENT_URL =
  OPENMRS_REST_V1 + '/bahmnicore/patientprofile';

export const ADDRESS_HIERARCHY_URL = (
  addressField: string,
  searchString: string,
  limit: number = 20,
) =>
  `/openmrs/module/addresshierarchy/ajax/getPossibleAddressHierarchyEntriesWithParents.form?addressField=${addressField}&limit=${limit}&searchString=${encodeURIComponent(searchString)}`;
