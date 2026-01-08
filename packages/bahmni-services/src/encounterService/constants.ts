import { OPENMRS_FHIR_R4, OPENMRS_REST_V1 } from '../constants/app';

export const PATIENT_VISITS_URL = (patientUUID: string) =>
  OPENMRS_FHIR_R4 + `/Encounter?subject:Patient=${patientUUID}&_tag=visit`;

export const BAHMNI_ENCOUNTER_URL = (
  encounterUUID: string,
  includeAll: boolean = false,
) =>
  `${OPENMRS_REST_V1}/bahmnicore/bahmniencounter/${encounterUUID}?includeAll=${includeAll}`;
