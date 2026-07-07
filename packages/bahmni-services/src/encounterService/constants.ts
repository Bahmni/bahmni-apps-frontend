import { OPENMRS_FHIR_R4, OPENMRS_REST_V1 } from '../constants/app';

export const ENCOUNTER_TYPE_BY_NAME_URL = (name: string) =>
  `${OPENMRS_REST_V1}/encountertype?q=${encodeURIComponent(name)}&v=custom:(uuid,name)`;

export const PATIENT_VISITS_URL = (patientUUID: string) =>
  OPENMRS_FHIR_R4 +
  `/Encounter?subject:Patient=${patientUUID}&_tag=visit&_sort=-_lastUpdated`;

export const PATIENT_ENCOUNTERS_URL = (
  patientUUID: string,
  count: number = 100,
  offset: number = 0,
) =>
  OPENMRS_FHIR_R4 +
  `/Encounter?subject:Patient=${patientUUID}&_sort=-_lastUpdated&_count=${count}&_getpagesoffset=${offset}`;

export const FHIR_OBSERVATIONS_BY_ENCOUNTER_URL = (encounterUUID: string) =>
  `${OPENMRS_FHIR_R4}/Observation/$fetch-all?encounter=${encounterUUID}`;

export const FHIR_ENCOUNTER_URL = OPENMRS_FHIR_R4 + '/Encounter';
