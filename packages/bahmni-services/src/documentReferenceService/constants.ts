import { OPENMRS_FHIR_R4 } from '../constants/app';

export const PATIENT_DOCUMENT_REFERENCES_URL = (
  patientUuid: string,
  encounterUuids?: string[],
): string => {
  const baseUrl = `${OPENMRS_FHIR_R4}/DocumentReference?patient=${patientUuid}&_sort=-date&_count=100`;
  if (encounterUuids && encounterUuids.length > 0) {
    const encounterParam = encounterUuids.join(',');
    return `${baseUrl}&encounter=${encounterParam}`;
  }
  return baseUrl;
};
