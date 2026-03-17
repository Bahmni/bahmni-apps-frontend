import { OPENMRS_FHIR_R4 } from '../constants/app';

export const PATIENT_VISITS_URL = (patientUUID: string) =>
  OPENMRS_FHIR_R4 + `/Encounter?subject:Patient=${patientUUID}&_tag=visit`;

// Fetches all observations for an encounter using custom Bahmni FHIR operation
// (not standard R4). Requires bahmni-module-fhir2-addl-extension.
export const FHIR_OBSERVATIONS_BY_ENCOUNTER_URL = (encounterUUID: string) =>
  `${OPENMRS_FHIR_R4}/Observation/$everything-by-encounter?encounter=${encounterUUID}`;
