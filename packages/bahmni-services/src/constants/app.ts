export const BASE_PATH = process.env.PUBLIC_URL ?? '/';
export const OPENMRS_FHIR_R4 = '/openmrs/ws/fhir2/R4';
export const OPENMRS_REST_V1 = '/openmrs/ws/rest/v1';
export const BAHMNI_USER_COOKIE_NAME = 'bahmni.user';
export const BAHMNI_HOME_PATH = '/bahmni/home/index.html';
export const BAHMNI_REGISTRATION_SEARCH = '/registration/search';
export const USER_PRIVILEGES_URL = OPENMRS_REST_V1 + '/bahmnicore/whoami';
export const OBSERVATION_FORMS_URL =
  OPENMRS_REST_V1 + '/bahmniie/form/latestPublishedForms';
export const USER_PINNED_PREFERENCE_URL = (userUuid: string) =>
  OPENMRS_REST_V1 + `/user/${userUuid}?v=full`;
export const VISIT_LOCATION_UUID =
  OPENMRS_REST_V1 + '/bahmnicore/visitLocation/';
