import { OPENMRS_FHIR_R4 } from '../constants/app';
import { ImmunizationStatus } from './models';

export const IMMUNIZATION_FHIR_URL = OPENMRS_FHIR_R4 + '/Immunization';

export const PATIENT_IMMUNIZATION_URL = (
  patientUuid: string,
  status?: ImmunizationStatus,
) => {
  let url = `${IMMUNIZATION_FHIR_URL}?patient=${patientUuid}&_sort=-_lastUpdated&_count=100`;

  if (status) {
    url += `&status=${status}`;
  }
  return url;
};
