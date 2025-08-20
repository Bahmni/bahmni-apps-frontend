import { OPENMRS_FHIR_R4 } from '../constants/app';
import { HL7_CONDITION_CATEGORY_CONDITION_CODE } from '../constants/fhir';

export const PATIENT_CONDITION_RESOURCE_URL = (patientUUID: string) =>
  OPENMRS_FHIR_R4 +
  `/Condition?category=${HL7_CONDITION_CATEGORY_CONDITION_CODE}&patient=${patientUUID}&_count=100&_sort=-_lastUpdated`;
