const BASE_PATH = process.env.PUBLIC_URL || '/';
const OPENMRS_FHIR_R4 = '/openmrs/ws/fhir2/R4';
const OPENMRS_REST_V1 = '/openmrs/ws/rest/v1';

export const CONFIG_TRANSLATIONS_URL_TEMPLATE = (lang: string) =>
  `/bahmni_config/openmrs/i18n/clinical/locale_${lang}.json`;
export const BUNDLED_TRANSLATIONS_URL_TEMPLATE = (lang: string) =>
  `${BASE_PATH}locales/locale_${lang}.json`;
export const PATIENT_RESOURCE_URL = (patientUUID: string) =>
  OPENMRS_FHIR_R4 + `/Patient/${patientUUID}?_summary=data`;
export const PATIENT_CONDITION_RESOURCE_URL = (patientUUID: string) =>
  OPENMRS_FHIR_R4 + `/Condition?patient=${patientUUID}`;
export const PATIENT_ALLERGY_RESOURCE_URL = (patientUUID: string) =>
  OPENMRS_FHIR_R4 + `/AllergyIntolerance?patient=${patientUUID}`;
export const DASHBOARD_CONFIG_URL = (dashboardURL: string) =>
  `/bahmni_config/openmrs/apps/clinical/v2/dashboards/${dashboardURL}`;
export const CLINICAL_CONFIG_URL =
  '/bahmni_config/openmrs/apps/clinical/v2/app.json';
export const LOCATION_RESOURCE_URL = OPENMRS_REST_V1 + '/location';
export const LOGIN_PATH = '/bahmni/home/index.html#/login';
export const DEFAULT_LOCALE = 'en';
export const LOCALE_STORAGE_KEY = 'NG_TRANSLATE_LANG_KEY';
export const CLINICAL_NAMESPACE = 'clinical';
export const BAHMNI_HOME_PATH = '/bahmni/home/index.html';
export const BAHMNI_CLINICAL_PATH = '/bahmni/clinical/index.html';
