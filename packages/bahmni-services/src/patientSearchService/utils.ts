import { formatDate } from '../date';
import { PatientSearchResult, FormattedPatientSearchResult } from './models';

/**
 * Formats a patient's full name from search result
 * @param patient - The patient search result
 * @returns A formatted name string
 */
export const formatPatientName = (patient: PatientSearchResult): string => {
  const parts = [
    patient.givenName,
    patient.middleName,
    patient.familyName,
  ].filter(Boolean);

  return parts.join(' ');
};

/**
 * Formats a timestamp to a readable date string
 * @param timestamp - The timestamp in milliseconds
 * @param t - Translation function
 * @returns A formatted date string
 */
export const formatRegistrationDate = (
  timestamp: number,
  t: (key: string) => string,
): string => {
  try {
    const date = new Date(timestamp);
    const result = formatDate(date.toISOString(), t);
    return result.formattedResult || 'Invalid Date';
  } catch (error) {
    return 'Invalid Date';
  }
};

/**
 * Formats a single patient search result for display
 * @param patient - The raw patient search result
 * @param t - Translation function
 * @returns A formatted patient result
 */
export const formatPatientSearchResult = (
  patient: PatientSearchResult,
  t: (key: string) => string,
): FormattedPatientSearchResult => {
  return {
    id: patient.uuid,
    patientId: patient.identifier,
    fullName: formatPatientName(patient),
    phoneNumber: null, // Will be populated from API response if available
    alternatePhoneNumber: null, // Will be populated from API response if available
    gender: patient.gender,
    age: patient.age,
    registrationDate: formatRegistrationDate(patient.dateCreated, t),
    uuid: patient.uuid,
  };
};

/**
 * Formats an array of patient search results
 * @param patients - Array of raw patient search results
 * @param t - Translation function
 * @returns Array of formatted patient results
 */
export const formatPatientSearchResults = (
  patients: PatientSearchResult[],
  t: (key: string) => string,
): FormattedPatientSearchResult[] => {
  return patients.map((patient) => formatPatientSearchResult(patient, t));
};

/**
 * Gets the login location UUID from localStorage
 * @returns The login location UUID or null if not found
 */
export const getLoginLocationUuid = (): string | null => {
  // try {
  //   return localStorage.getItem('loginLocationUuid');
  // } catch (error) {
  //   return null;
  // }
  return '';
};

/**
 * Validates if a search term is valid (not empty after trimming)
 * @param searchTerm - The search term to validate
 * @returns True if valid, false otherwise
 */
export const isValidSearchTerm = (searchTerm: string): boolean => {
  return searchTerm.trim().length > 0;
};
