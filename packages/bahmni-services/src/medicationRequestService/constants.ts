import { OPENMRS_FHIR_R4 } from '../constants/app';

export const PATIENT_MEDICATION_RESOURCE_URL = (patientUUID: string) =>
  OPENMRS_FHIR_R4 +
  `/MedicationRequest?patient=${patientUUID}&_count=100&_sort=-_lastUpdated`;
