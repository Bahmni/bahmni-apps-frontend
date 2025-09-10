import { BAHMNI_USER_LOCATION_COOKIE_NAME } from '../constants/app';
import { DATE_FORMAT, formatDate } from '../date';
import { getCookieByName } from '../utils';
import { PatientSearchResult, FormattedPatientSearchResult } from './models';

export const formatPatientName = (patient: PatientSearchResult): string => {
  const parts = [
    patient.givenName,
    patient.middleName,
    patient.familyName,
  ].filter(Boolean);

  return parts.join(' ');
};

export const formatRegistrationDate = (
  timestamp: number,
  t: (key: string) => string,
): string => {
  try {
    const date = new Date(timestamp);
    const result = formatDate(date, t, DATE_FORMAT);
    return result.formattedResult || 'Invalid Date';
  } catch (error) {
    return 'Invalid Date';
  }
};

export const extractCustomAttribute = (
  patient: PatientSearchResult,
  attributeName: string,
): string | null => {
  try {
    const attrs = patient.customAttribute
      ? JSON.parse(patient.customAttribute)
      : {};
    const value = attrs[attributeName];
    return value && value.trim() !== '' ? value : null;
  } catch {
    return null;
  }
};

export const formatGender = (gender: string): string => {
  const genderMap: { [key: string]: string } = {
    'M': 'Male',
    'F': 'Female',
    'O': 'Other'
  };
  return genderMap[gender] ?? gender;
};

export const formatPatientSearchResult = (
  patient: PatientSearchResult,
  t: (key: string) => string,
): FormattedPatientSearchResult => {
  return {
    id: patient.uuid,
    patientId: patient.identifier,
    fullName: formatPatientName(patient),
    phoneNumber: extractCustomAttribute(patient, 'phoneNumber'),
    alternatePhoneNumber: extractCustomAttribute(
      patient,
      'alternatePhoneNumber',
    ),
    gender: formatGender(patient.gender),
    age: patient.age,
    registrationDate: formatRegistrationDate(patient.dateCreated, t),
    uuid: patient.uuid,
  };
};

export const formatPatientSearchResults = (
  patients: PatientSearchResult[],
  t: (key: string) => string,
): FormattedPatientSearchResult[] => {
  return patients.map((patient) => formatPatientSearchResult(patient, t));
};

export const getUuidFromUserLocationCookie = (): string | null => {
  try {
    const cookieValue = getCookieByName(BAHMNI_USER_LOCATION_COOKIE_NAME);
    if (!cookieValue) {
      return null;
    }

    // Parse the location cookie as JSON to extract the UUID
    const locationData = JSON.parse(decodeURIComponent(cookieValue));
    return locationData?.uuid ?? null;
  } catch (error) {
    // eslint-disable-next-line no-console
    console.warn('Failed to get login location UUID from cookie:', error);
    return null;
  }
};

export const isValidSearchTerm = (searchTerm: string): boolean => {
  return searchTerm.trim().length > 0;
};

export const sortPatientsByIdentifierAscending = (
  patients: PatientSearchResult[],
): PatientSearchResult[] => {
  if (!patients?.length) return patients;

  return [...patients].sort((a, b) => {
    return a.identifier.localeCompare(b.identifier, undefined, {
      numeric: true,
      sensitivity: 'base',
    });
  });
};
