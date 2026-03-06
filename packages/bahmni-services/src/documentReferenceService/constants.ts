import { OPENMRS_FHIR_R4 } from '../constants/app';

export const DOCUMENT_REFERENCE_URL = OPENMRS_FHIR_R4 + `/DocumentReference`;
export const DOCUMENT_REFERENCE_BY_PATIENT_URL = (patientUuid: string) =>
  DOCUMENT_REFERENCE_URL + `?patient=${patientUuid}`;
