import { OPENMRS_FHIR_R4 } from '../constants/app';

export const PATIENT_VISITS_URL = (patientUUID: string) =>
  OPENMRS_FHIR_R4 +
  `/Encounter?subject:Patient=${patientUUID}&_tag=visit&_sort=-_lastUpdated`;

export const FHIR_OBSERVATIONS_BY_ENCOUNTER_URL = (encounterUUID: string) =>
  `${OPENMRS_FHIR_R4}/Observation/$fetch-all?encounter=${encounterUUID}`;
