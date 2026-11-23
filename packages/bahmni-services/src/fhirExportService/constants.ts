import { OPENMRS_FHIR_R4, OPENMRS_REST_V1 } from '../constants/app';

export const FHIR_EXPORT_URL = OPENMRS_REST_V1 + '/fhirexport';

/** Number of most-recent FHIR Tasks read when listing export tasks. */
export const FHIR_EXPORT_TASKS_COUNT = 50;

/** FHIR resource type the backend uses in the export task's `basedOn` reference. */
export const FHIR_EXPORT_BASED_ON_TYPE = 'ServiceRequest';

/** FHIR Task search endpoint used to list export tasks. */
export const FHIR_EXPORT_TASKS_ENDPOINT = OPENMRS_FHIR_R4 + '/Task';

/**
 * Names of the task inputs written by the backend export task
 * (openmrs-module-fhir2Extension `ExportTask`).
 */
export const FHIR_EXPORT_USER_NAME_INPUT = 'FHIR Export User Name';
export const FHIR_EXPORT_START_DATE_INPUT = 'FHIR Export Start Date';
export const FHIR_EXPORT_END_DATE_INPUT = 'FHIR Export End Date';
export const FHIR_EXPORT_ANONYMISE_INPUT = 'FHIR Export Anonymise Flag';

export const FHIR_EXPORT_DOWNLOAD_OUTPUT = 'Download URL';

/** Task statuses after which the backend will never update the task again. */
export const FHIR_EXPORT_TERMINAL_STATUSES = [
  'completed',
  'failed',
  'rejected',
  'cancelled',
  'entered-in-error',
];
