import { OPENMRS_FHIR_R4 } from '../constants/app';

export const LAB_ORDER_TYPE_UUID = 'd3560b17-5e07-11ef-8f7c-0242ac120002';
export const FHIR_LAB_ORDER_CONCEPT_TYPE_EXTENSION_URL =
  'http://fhir.bahmni.org/ext/lab-order-concept-type';
export const PATIENT_LAB_INVESTIGATION_RESOURCE_URL = (patientUUID: string) =>
  OPENMRS_FHIR_R4 +
  `/ServiceRequest?category=${LAB_ORDER_TYPE_UUID}&patient=${patientUUID}&numberOfVisits=5&_count=100&_sort=-_lastUpdated`;
