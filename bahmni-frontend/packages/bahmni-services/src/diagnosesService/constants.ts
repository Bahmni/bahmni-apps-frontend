import { Coding } from 'fhir/r4';
import { OPENMRS_FHIR_R4 } from '../constants/app';
import { HL7_CONDITION_CATEGORY_DIAGNOSIS_CODE } from '../constants/fhir';

export const PATIENT_DIAGNOSIS_RESOURCE_URL = (patientUUID: string) =>
  OPENMRS_FHIR_R4 +
  `/Condition?category=${HL7_CONDITION_CATEGORY_DIAGNOSIS_CODE}&patient=${patientUUID}&_count=100&_sort=-_lastUpdated`;

export const CERTAINITY_CONCEPTS: Coding[] = [
  {
    code: 'confirmed',
    display: 'CERTAINITY_CONFIRMED',
    system: 'http://terminology.hl7.org/CodeSystem/condition-ver-status',
  },
  {
    code: 'provisional',
    display: 'CERTAINITY_PROVISIONAL',
    system: 'http://terminology.hl7.org/CodeSystem/condition-ver-status',
  },
];
