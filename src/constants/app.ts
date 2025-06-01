import { HL7_CONDITION_CATEGORY_CONDITION_CODE, HL7_CONDITION_CATEGORY_DIAGNOSIS_CODE } from './fhir';

const BASE_PATH = process.env.PUBLIC_URL || '/';
const OPENMRS_FHIR_R4 = '/openmrs/ws/fhir2/R4';
const OPENMRS_REST_V1 = '/openmrs/ws/rest/v1';

// Cookie name constants
export const BAHMNI_USER_COOKIE_NAME = 'bahmni.user';
export const BAHMNI_USER_LOCATION_COOKIE_NAME = 'bahmni.user.location';

export const CONFIG_TRANSLATIONS_URL_TEMPLATE = (lang: string) =>
  `/bahmni_config/openmrs/i18n/clinical/locale_${lang}.json`;
export const BUNDLED_TRANSLATIONS_URL_TEMPLATE = (lang: string) =>
  BASE_PATH + `locales/locale_${lang}.json`;
export const PATIENT_RESOURCE_URL = (patientUUID: string) =>
  OPENMRS_FHIR_R4 + `/Patient/${patientUUID}?_summary=data`;
export const PATIENT_CONDITION_RESOURCE_URL = (patientUUID: string) =>
  OPENMRS_FHIR_R4 +
  `/Condition?category=${HL7_CONDITION_CATEGORY_CONDITION_CODE}&patient=${patientUUID}`;
export const PATIENT_ALLERGY_RESOURCE_URL = (patientUUID: string) =>
  OPENMRS_FHIR_R4 + `/AllergyIntolerance?patient=${patientUUID}`;
export const PATIENT_ENCOUNTER_RESOURCE_URL = (patientUUID: string) =>
  OPENMRS_FHIR_R4 + `/Encounter?subject:Patient=${patientUUID}&_tag=visit`;
export const PATIENT_LAB_INVESTIGATION_RESOURCE_URL = (patientUUID: string) =>
  OPENMRS_FHIR_R4 +
  `/ServiceRequest?category=${LAB_ORDER_TYPE_UUID}&patient=${patientUUID}&numberOfVisits=5`;
export const PATIENT_DIAGNOSIS_RESOURCE_URL = (patientUUID: string) =>
  OPENMRS_FHIR_R4 +
  `/Condition?category=${HL7_CONDITION_CATEGORY_DIAGNOSIS_CODE}&patient=${patientUUID}`;
export const DASHBOARD_CONFIG_URL = (dashboardURL: string) =>
  `/bahmni_config/openmrs/apps/clinical/v2/dashboards/${dashboardURL}`;
export const CLINICAL_CONFIG_URL =
  '/bahmni_config/openmrs/apps/clinical/v2/app.json';
export const LOCATION_RESOURCE_URL = OPENMRS_REST_V1 + '/location';
export const ENCOUNTER_CONCEPTS_URL =
  OPENMRS_REST_V1 +
  '/bahmnicore/config/bahmniencounter?callerContext=REGISTRATION_CONCEPTS';
export const USER_RESOURCE_URL = (username: string) =>
  OPENMRS_REST_V1 + `/user?username=${username}&v=custom:(username,uuid)`;
export const PROVIDER_RESOURCE_URL = (userUUID: string) =>
  OPENMRS_REST_V1 + `/provider?user=${userUUID}&v=custom:(uuid,display,person)`;
export const PRACTITIONER_RESOURCE_URL = (uuid?: string) =>
  OPENMRS_FHIR_R4 + `/Practitioner${uuid ? `/${uuid}` : ''}`;
export const CONSULTATION_BUNDLE_URL = OPENMRS_FHIR_R4 + '/ConsultationBundle';
export const CONCEPT_SEARCH_URL = (
  term: string,
  limit: number,
  locale: string,
) =>
  OPENMRS_REST_V1 +
  `/bahmni/terminologies/concepts?limit=${limit}&locale=${locale}&term=${term}`;
export const LOGIN_PATH = '/bahmni/home/index.html#/login';
export const DEFAULT_LOCALE = 'en';
export const LOCALE_STORAGE_KEY = 'NG_TRANSLATE_LANG_KEY';
export const CLINICAL_NAMESPACE = 'clinical';
export const BAHMNI_HOME_PATH = '/bahmni/home/index.html';
export const BAHMNI_CLINICAL_PATH = '/bahmni/clinical/index.html';
//TODO: When we work on taking values dynamically, we need to remove the hardcoded value of LAB_ORDER_TYPE_UUID */
export const LAB_ORDER_TYPE_UUID = 'd3560b17-5e07-11ef-8f7c-0242ac120002';
