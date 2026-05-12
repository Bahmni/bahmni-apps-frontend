import { OPENMRS_FHIR_R4 } from '../constants/app';

export const MEDICATION_URL = (uuid: string) =>
  `${OPENMRS_FHIR_R4}/Medication/${uuid}`;
