import { Bundle, Immunization } from 'fhir/r4';
import { get } from '../api';
import { PATIENT_IMMUNIZATION_URL } from './constants';
import { ImmunizationStatus } from './models';

export async function getPatientImmunizations(
  patientUuid: string,
  status?: ImmunizationStatus,
): Promise<Bundle<Immunization>> {
  return get<Bundle<Immunization>>(
    PATIENT_IMMUNIZATION_URL(patientUuid, status),
  );
}
