import { OPENMRS_FHIR_R4 } from '../constants/app';

const RADIOLOGY_ORDER_TYPE_UUID = 'd3561dc0-5e07-11ef-8f7c-0242ac120002';
export const PATIENT_RADIOLOGY_RESOURCE_URL = (patientUUID: string) =>
  OPENMRS_FHIR_R4 +
  `/ServiceRequest?category=${RADIOLOGY_ORDER_TYPE_UUID}&patient=${patientUUID}&_count=100&_sort=-_lastUpdated&numberOfVisits=5`;
