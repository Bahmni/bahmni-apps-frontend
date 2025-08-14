const OPENMRS_REST_V1 = '/openmrs/ws/rest/v1';
const OPENMRS_FHIR_R4 = '/openmrs/ws/fhir2/R4';

export const BAHMNI_HOME_PATH = '/bahmni/home/index.html';
export const BAHMNI_CLINICAL_PATH = '/bahmni/clinical/index.html';
export const ENCOUNTER_CONCEPTS_URL =
  OPENMRS_REST_V1 +
  '/bahmnicore/config/bahmniencounter?callerContext=REGISTRATION_CONCEPTS';

export const BAHMNI_USER_LOCATION_COOKIE_NAME = 'bahmni.user.location';

export const PROVIDER_RESOURCE_URL = (userUUID: string) =>
  OPENMRS_REST_V1 + `/provider?user=${userUUID}&v=custom:(uuid,display,person)`;

export const USER_RESOURCE_URL = (username: string) =>
  OPENMRS_REST_V1 + `/user?username=${username}&v=custom:(username,uuid)`;

export const ORDER_TYPE_URL =
  '/openmrs/ws/rest/v1/ordertype?v=custom:(uuid,display,conceptClasses:(uuid,name))';

export const ALL_ORDERABLES_CONCEPT_NAME = 'All Orderables';

export const MEDICATION_ORDERS_METADATA_URL =
  OPENMRS_REST_V1 + '/bahmnicore/config/drugOrders';

export const MEDICATIONS_SEARCH_URL = (searchTerm: string, count: number) =>
  OPENMRS_FHIR_R4 +
  `/Medication?name=${encodeURIComponent(searchTerm)}&_count=${count}`;
