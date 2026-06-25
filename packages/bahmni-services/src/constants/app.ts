export const BASE_PATH = process.env.PUBLIC_URL ?? '/';
export const OPENMRS_FHIR_R4 = '/openmrs/ws/fhir2/R4';
export const OPENMRS_REST_V1 = '/openmrs/ws/rest/v1';
export const OPENMRS_REST_V2 = '/openmrs/ws/rest/v2';
export const BAHMNI_USER_COOKIE_NAME = 'bahmni.user';
export const BAHMNI_USER_LOCATION_COOKIE = 'bahmni.user.location';
export const LOGOUT_COOKIES = [
  BAHMNI_USER_COOKIE_NAME,
  BAHMNI_USER_LOCATION_COOKIE,
];
export const BAHMNI_APP_BASE_PATH = '/bahmni-v2';
export const BAHMNI_HOME_PATH = BAHMNI_APP_BASE_PATH + '/home';
export const SESSION_URL = OPENMRS_REST_V1 + '/session';
export const VISIT_LOCATION_UUID =
  OPENMRS_REST_V1 + '/bahmnicore/visitLocation/';
export const BAHMNI_SQL_URL = OPENMRS_REST_V1 + '/bahmnicore/sql';
