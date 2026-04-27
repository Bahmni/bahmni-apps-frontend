import { Bundle, Immunization } from 'fhir/r4';
import { get } from '../api';
import { PATIENT_IMMUNIZATION_URL } from './constants';
import { ImmunizationStatus } from './models';

export async function getPatientImmunizations(
  patientUuid: string,
  status?: ImmunizationStatus,
): Promise<Immunization[]> {
  const bundle = await getPatientImmunizationsBundle(patientUuid, status);

  return (
    bundle.entry
      ?.filter((entry) => entry.resource?.resourceType === 'Immunization')
      .map((entry) => entry.resource as Immunization) ?? []
  );
}

export async function getPatientImmunizationsBundle(
  patientUuid: string,
  status?: ImmunizationStatus,
): Promise<Bundle<Immunization>> {
  return get<Bundle<Immunization>>(
    PATIENT_IMMUNIZATION_URL(patientUuid, status),
  );
}
