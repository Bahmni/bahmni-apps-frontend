//TODO: Move Display Control URLs to a separate file
import {
  HL7_CONDITION_CATEGORY_CONDITION_CODE,
  HL7_CONDITION_CATEGORY_DIAGNOSIS_CODE,
} from './fhir';

const BASE_PATH = process.env.PUBLIC_URL ?? '/';
const OPENMRS_FHIR_R4 = '/openmrs/ws/fhir2/R4';
const OPENMRS_REST_V1 = '/openmrs/ws/rest/v1';

// Cookie name constants
export const BAHMNI_USER_LOCATION_COOKIE_NAME = 'bahmni.user.location';

//TODO: When we work on taking values dynamically, we need to remove the hardcoded value of LAB_ORDER_TYPE_UUID */
export const LAB_ORDER_TYPE_UUID = 'd3560b17-5e07-11ef-8f7c-0242ac120002';
export const RADIOLOGY_ORDER_TYPE_UUID = 'd3561dc0-5e07-11ef-8f7c-0242ac120002';
export const CONSULTATION_ENCOUNTER_TYPE_UUID =
  'd34fe3ab-5e07-11ef-8f7c-0242ac120002';

export const BUNDLED_TRANSLATIONS_URL_TEMPLATE = (lang: string) =>
  BASE_PATH + `locales/locale_${lang}.json`;
export const PATIENT_RESOURCE_URL = (patientUUID: string) =>
  OPENMRS_FHIR_R4 + `/Patient/${patientUUID}?_summary=data`;
export const PATIENT_CONDITION_RESOURCE_URL = (patientUUID: string) =>
  OPENMRS_FHIR_R4 +
  `/Condition?category=${HL7_CONDITION_CATEGORY_CONDITION_CODE}&patient=${patientUUID}&_count=100&_sort=-_lastUpdated`;
export const PATIENT_ALLERGY_RESOURCE_URL = (patientUUID: string) =>
  OPENMRS_FHIR_R4 +
  `/AllergyIntolerance?patient=${patientUUID}&_count=100&_sort=-_lastUpdated`;
export const PATIENT_VISITS_URL = (patientUUID: string) =>
  OPENMRS_FHIR_R4 + `/Encounter?subject:Patient=${patientUUID}&_tag=visit`;
export const PATIENT_LAB_INVESTIGATION_RESOURCE_URL = (patientUUID: string) =>
  OPENMRS_FHIR_R4 +
  `/ServiceRequest?category=${LAB_ORDER_TYPE_UUID}&patient=${patientUUID}&numberOfVisits=5&_count=100&_sort=-_lastUpdated`;

export const PATIENT_DIAGNOSIS_RESOURCE_URL = (patientUUID: string) =>
  OPENMRS_FHIR_R4 +
  `/Condition?category=${HL7_CONDITION_CATEGORY_DIAGNOSIS_CODE}&patient=${patientUUID}&_count=100&_sort=-_lastUpdated`;
export const LOCATION_RESOURCE_URL = OPENMRS_REST_V1 + '/location';
export const PATIENT_RADIOLOGY_RESOURCE_URL = (patientUUID: string) =>
  OPENMRS_FHIR_R4 +
  `/ServiceRequest?category=${RADIOLOGY_ORDER_TYPE_UUID}&patient=${patientUUID}&_count=100&_sort=-_lastUpdated&numberOfVisits=5`;
export const ENCOUNTER_CONCEPTS_URL =
  OPENMRS_REST_V1 +
  '/bahmnicore/config/bahmniencounter?callerContext=REGISTRATION_CONCEPTS';
export const PATIENT_MEDICATION_RESOURCE_URL = (patientUUID: string) =>
  OPENMRS_FHIR_R4 +
  `/MedicationRequest?patient=${patientUUID}&_count=100&_sort=-_lastUpdated`;

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
export const CONCEPT_DETAIL_URL = (uuid: string, locale: string): string =>
  OPENMRS_REST_V1 +
  `/concept/${uuid}?v=custom:(uuid,setMembers:(uuid,display,retired))&locale=${locale}`;
export const ENCOUNTER_SEARCH_URL = OPENMRS_FHIR_R4 + '/Encounter';
//TODO: chnage URL to use bahmni config api
export const ENCOUNTER_SESSION_DURATION_GP_URL =
  OPENMRS_REST_V1 + '/systemsetting/bahmni.encountersession.duration';
export const FHIR_VALUESET_URL = (uuid: string) =>
  OPENMRS_FHIR_R4 + `/ValueSet/${uuid}/$expand`;
export const FHIR_VALUESET_FILTER_EXPAND_URL = (filter: string) =>
  OPENMRS_FHIR_R4 + `/ValueSet/$expand?filter=${encodeURIComponent(filter)}`;
export const ORDER_TYPE_URL =
  OPENMRS_REST_V1 +
  '/ordertype?v=custom:(uuid,display,conceptClasses:(uuid,name))';
export const MEDICATION_ORDERS_METADATA_URL =
  OPENMRS_REST_V1 + '/bahmnicore/config/drugOrders';
export const MEDICATIONS_SEARCH_URL = (searchTerm: string, count: number) =>
  OPENMRS_FHIR_R4 +
  `/Medication?name=${encodeURIComponent(searchTerm)}&_count=${count}`;

export const ALL_ORDERABLES_CONCEPT_NAME = 'All Orderables';
export const LOGIN_PATH = '/bahmni/home/index.html#/login';
export const DEFAULT_LOCALE = 'en';
export const LOCALE_STORAGE_KEY = 'NG_TRANSLATE_LANG_KEY';
export const CLINICAL_NAMESPACE = 'clinical';
export const BAHMNI_HOME_PATH = '/bahmni/home/index.html';
export const BAHMNI_CLINICAL_PATH = '/bahmni/clinical/index.html';
export const PANEL_CONCEPT_CLASS_NAME = 'LabSet';

// Audit logging URLs
export const AUDIT_LOG_URL = OPENMRS_REST_V1 + '/auditlog';
export const APP_PROPERTY_URL = (property: string) =>
  `${OPENMRS_REST_V1}/bahmnicore/sql/globalproperty?property=${property}`;
