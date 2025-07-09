import { PATIENT_RESOURCE_URL } from '@constants/app';
import {
  FhirPatient,
  FhirAddress,
  FhirTelecom,
  FormattedPatientData,
} from '@types/patient';
import { calculateAge } from '@utils/date';
import { get } from './api';

export const getPatientById = async (
  patientUUID: string,
): Promise<FhirPatient> => {
  return get<FhirPatient>(PATIENT_RESOURCE_URL(patientUUID));
};

/**
 * Extract address extensions from FHIR address
 * @param address - The FHIR address to extract from
 * @returns An array of address extensions
 * @returns An empty array if no extensions are found
 */
const extractAddressExtensions = (address: FhirAddress): string[] => {
  if (!address.extension || !Array.isArray(address.extension)) return [];

  return address.extension.flatMap((ext) => {
    if (ext.extension && Array.isArray(ext.extension)) {
      return ext.extension
        .filter((nestedExt) => nestedExt.valueString)
        .map((nestedExt) => nestedExt.valueString as string);
    }
    return [];
  });
};

/**
 * Format patient's full name from FHIR patient data
 * @param patient - The FHIR patient to format
 * @returns A formatted name string
 * @returns null if no name is provided
 */
export const formatPatientName = (patient: FhirPatient): string | null => {
  if (!patient.name || patient.name.length === 0) {
    return null;
  }

  const name = patient.name[0];
  const given = name.given?.join(' ') || '';
  const family = name.family || '';

  if (!given && !family) {
    return null;
  }

  return `${given} ${family}`.trim();
};

/**
 * Format patient's address from FHIR patient data
 * @param address - The FHIR address to format
 * @returns A formatted address string
 * @returns null if no address is provided
 */
export const formatPatientAddress = (address?: FhirAddress): string | null => {
  if (!address) return null;

  const addressLines = [
    ...(address.line || []), // Standard address lines
    ...extractAddressExtensions(address), // Extracted address extensions
  ];
  const city = address.city || '';
  const state = address.state || '';
  const postalCode = address.postalCode || '';

  const parts = addressLines.filter(Boolean);
  if (city) parts.push(city);
  if (state && postalCode) parts.push(`${state} ${postalCode}`);
  else if (state) parts.push(state);
  else if (postalCode) parts.push(postalCode);

  return parts.length > 0 ? parts.join(', ').trim() : null;
};

/**
 * Format patient's contact information from FHIR telecom data
 * @param telecom - The FHIR telecom to format
 * @returns A formatted contact string
 * @returns null if no telecom is provided
 */
export const formatPatientContact = (telecom?: FhirTelecom): string | null => {
  if (!telecom || !telecom.system || !telecom.value) {
    return null;
  }

  return `${telecom.system}: ${telecom.value}`;
};

/**
 * Format patient data for display
 * @param patient - The FHIR patient to format
 * @returns A formatted patient data object
 */
export const formatPatientData = (
  patient: FhirPatient,
): FormattedPatientData => {
  const address =
    patient.address && patient.address.length > 0
      ? formatPatientAddress(patient.address[0])
      : null;

  const contact =
    patient.telecom && patient.telecom.length > 0
      ? formatPatientContact(patient.telecom[0])
      : null;

  const identifiers = patient.identifier || [];

  const identifierMap = new Map<string, string>();
  if (identifiers.length > 0) {
    identifiers.forEach((identifier) => {
      if (!identifier.type || !identifier.type.text || !identifier.value) {
        return;
      }
      identifierMap.set(identifier.type.text, identifier.value);
    });
  }

  const age = patient.birthDate ? calculateAge(patient.birthDate) : null;

  return {
    id: patient.id || '',
    fullName: formatPatientName(patient),
    gender: patient.gender || null,
    birthDate: patient.birthDate || null,
    formattedAddress: address,
    formattedContact: contact,
    identifiers: identifierMap,
    age,
  };
};
