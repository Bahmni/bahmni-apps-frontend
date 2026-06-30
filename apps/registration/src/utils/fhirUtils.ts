export const PATIENT_ATTRIBUTE_PREFIX = 'http://fhir.bahmni.org/ext/patient/'; // NOSONAR
export const ADDRESS_EXT_URL = 'http://fhir.openmrs.org/ext/address'; // NOSONAR
export { BIRTH_TIME_EXT_URL } from '@bahmni/services';
export const IDENTIFIER_LOCATION_EXT_URL =
  'http://fhir.openmrs.org/ext/patient/identifier#location'; // NOSONAR
export const DATE_CREATED_EXT_URL =
  'http://fhir.bahmni.org/ext/patient-record/date-created'; // NOSONAR
export function toSlugCase(str: string): string {
  return str
    .replace(/\s+/g, '-')
    .replace(/[^a-zA-Z0-9-]/g, '')
    .replace(/-{2,}/g, '-')
    .toLowerCase();
}

export function mapGenderToFhir(
  gender: string,
): 'male' | 'female' | 'other' | 'unknown' {
  const char = (gender ?? '').charAt(0).toUpperCase();
  if (char === 'M') return 'male';
  if (char === 'F') return 'female';
  if (char === 'O') return 'other';
  return 'unknown';
}

export function mapGenderFromFhir(fhirGender: string): string {
  if (fhirGender === 'male') return 'M';
  if (fhirGender === 'female') return 'F';
  if (fhirGender === 'other') return 'O';
  return 'U';
}
