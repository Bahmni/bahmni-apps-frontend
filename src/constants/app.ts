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

export const LOGIN_PATH = '/bahmni/home/index.html#/login';
export const DEFAULT_LOCALE = 'en';
export const LOCALE_STORAGE_KEY = 'NG_TRANSLATE_LANG_KEY';
export const CLINICAL_NAMESPACE = 'clinical';
