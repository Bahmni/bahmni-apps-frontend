const BASE_PATH = process.env.PUBLIC_URL || '/';
const OPENMRS_FHIR_R4 = '/openmrs/ws/fhir2/R4';

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
export const PATIENT_LAB_INVESTIGATION_RESOURCE_URL = (patientUUID: string) =>
  OPENMRS_FHIR_R4 + `/ServiceRequest?category=${LAB_ORDER_TYPE_UUID}&patient=${patientUUID}&numberOfVisits=5`;
export const DASHBOARD_CONFIG_URL = (dashboardURL: string) =>
  `/bahmni_config/openmrs/apps/clinical/v2/dashboards/${dashboardURL}`;
export const CLINICAL_CONFIG_URL =
  '/bahmni_config/openmrs/apps/clinical/v2/app.json';
export const LOGIN_PATH = '/bahmni/home/index.html#/login';
export const DEFAULT_LOCALE = 'en';
export const LOCALE_STORAGE_KEY = 'NG_TRANSLATE_LANG_KEY';
export const CLINICAL_NAMESPACE = 'clinical';
export const LAB_ORDER_TYPE_UUID= 'd3560b17-5e07-11ef-8f7c-0242ac120002';
