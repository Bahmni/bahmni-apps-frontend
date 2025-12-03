import { OPENMRS_FHIR_R4 } from '../constants/app';

export const PATIENT_VISITS_URL = (patientUUID: string) =>
  OPENMRS_FHIR_R4 + `/Encounter?subject:Patient=${patientUUID}&_tag=visit`;

export const EOC_ENCOUNTERS_URL = (eocIds: string) =>
  OPENMRS_FHIR_R4 +
  `/EpisodeOfCare?_revincludes=Encounter:episode-of-care&_id=${eocIds}`;
