import { OPENMRS_FHIR_R4, OPENMRS_REST_V1 } from '../constants/app';

export const FHIR_EXPORT_URL = OPENMRS_REST_V1 + '/fhirexport';

export const FHIR_EXPORT_TASKS_URL =
  OPENMRS_FHIR_R4 + '/Task?_sort:desc=_lastUpdated&_count=50';

/** Name of the concept that marks a Task as a bulk FHIR export task. */
export const FHIR_EXPORT_ANONYMISE_CONCEPT_NAME = 'FHIR Export Anonymise Flag';

export const FHIR_EXPORT_INPUT_USER_NAME = 'FHIR Export User Name';
export const FHIR_EXPORT_INPUT_START_DATE = 'FHIR Export Start Date';
export const FHIR_EXPORT_INPUT_END_DATE = 'FHIR Export End Date';
export const FHIR_EXPORT_INPUT_ANONYMISE = 'FHIR Export Anonymise Flag';
