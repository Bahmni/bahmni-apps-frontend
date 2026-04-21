import { OPENMRS_FHIR_R4 } from '../constants/app';
import { HL7_CONDITION_CATEGORY_CONDITION_CODE } from '../constants/fhir';

// Used by getConditions() — fetches all records for consultation forms
export const PATIENT_CONDITION_RESOURCE_URL = (patientUUID: string) =>
  OPENMRS_FHIR_R4 +
  `/Condition?category=${HL7_CONDITION_CATEGORY_CONDITION_CODE}&patient=${patientUUID}&_count=100&_sort=-_lastUpdated`;

// Used by getConditionPage() — fetches one page for the paginated widget
export const PATIENT_CONDITION_PAGE_URL = (
  patientUUID: string,
  count: number = 10,
  offset: number = 0,
) =>
  OPENMRS_FHIR_R4 +
  `/Condition?category=${HL7_CONDITION_CATEGORY_CONDITION_CODE}&patient=${patientUUID}&_count=${count}&_getpagesoffset=${offset}&_sort=-_lastUpdated`;
