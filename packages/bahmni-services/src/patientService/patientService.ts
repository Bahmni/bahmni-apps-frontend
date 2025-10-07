import { Patient } from 'fhir/r4';
import { get, post } from '../api';
import { APP_PROPERTY_URL } from '../applicationConfigService/constants';
import { calculateAge } from '../date';
import { getUserLoginLocation } from '../userService';
import {
  PATIENT_LUCENE_SEARCH_URL,
  PATIENT_RESOURCE_URL,
  PATIENT_PHONE_NUMBER_SEARCH_URL,
  IDENTIFIER_TYPES_URL,
  APP_SETTINGS_URL,
  PRIMARY_IDENTIFIER_TYPE_PROPERTY,
  CREATE_PATIENT_URL,
} from './constants';
import {
  FormattedPatientData,
  PatientSearchResultBundle,
  IdentifierTypesResponse,
  AppSettingsResponse,
  CreatePatientRequest,
  CreatePatientResponse,
} from './models';

export const getPatientById = async (patientUUID: string): Promise<Patient> => {
  return get<Patient>(PATIENT_RESOURCE_URL(patientUUID));
};

/**
 * Extract address extensions from FHIR address
 * @param address - The FHIR address to extract from
 * @returns An array of address extensions
 * @returns An empty array if no extensions are found
 */
const extractAddressExtensions = (
  address: NonNullable<Patient['address']>[0],
): string[] => {
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
export const formatPatientName = (patient: Patient): string | null => {
  if (!patient.name || patient.name.length === 0) {
    return null;
  }

  const name = patient.name[0];
  const given = name.given?.join(' ') ?? '';
  const family = name.family ?? '';

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
export const formatPatientAddress = (
  address?: NonNullable<Patient['address']>[0],
): string | null => {
  if (!address) return null;

  const addressLines = [
    ...(address.line ?? []), // Standard address lines
    ...extractAddressExtensions(address), // Extracted address extensions
  ];
  const city = address.city ?? '';
  const state = address.state ?? '';
  const postalCode = address.postalCode ?? '';

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
export const formatPatientContact = (
  telecom?: NonNullable<Patient['telecom']>[0],
): string | null => {
  if (!telecom?.system || !telecom.value) {
    return null;
  }

  return `${telecom.system}: ${telecom.value}`;
};

/**
 * Format patient data for display
 * @param patient - The FHIR patient to format
 * @returns A formatted patient data object
 */
export const formatPatientData = (patient: Patient): FormattedPatientData => {
  const address =
    patient.address && patient.address.length > 0
      ? formatPatientAddress(patient.address[0])
      : null;

  const contact =
    patient.telecom && patient.telecom.length > 0
      ? formatPatientContact(patient.telecom[0])
      : null;

  const identifiers = patient.identifier ?? [];

  const identifierMap = new Map<string, string>();
  if (identifiers.length > 0) {
    identifiers.forEach((identifier) => {
      if (!identifier.type?.text || !identifier.value) {
        return;
      }
      identifierMap.set(identifier.type.text, identifier.value);
    });
  }

  const age = patient.birthDate ? calculateAge(patient.birthDate) : null;

  return {
    id: patient.id ?? '',
    fullName: formatPatientName(patient),
    gender: patient.gender ?? null,
    birthDate: patient.birthDate ?? null,
    formattedAddress: address,
    formattedContact: contact,
    identifiers: identifierMap,
    age,
  };
};

/**
 * Get formatted patient data by UUID
 * @param patientUUID - The UUID of the patient to retrieve
 * @returns A formatted patient data object
 */
export const getFormattedPatientById = async (
  patientUUID: string,
): Promise<FormattedPatientData> => {
  const patient = await getPatientById(patientUUID);
  return formatPatientData(patient);
};

/**
 * Search patient by Name / Identifier
 * @param searchTerm - The Name / Identifier of the patient
 * @returns A formatted patient search bundle object
 */
export const searchPatientByNameOrId = async (
  searchTerm: string,
): Promise<PatientSearchResultBundle> => {
  const loginLocation = getUserLoginLocation();
  const searchResultsBundle = await get<PatientSearchResultBundle>(
    PATIENT_LUCENE_SEARCH_URL(searchTerm, loginLocation.uuid),
  );
  return searchResultsBundle;
};

/**
 * Search patient by PhoneNumber
 * @param phoneNumber - The Phone Number of the patient
 * @returns A formatted patient search bundle object
 */
export async function searchPatientByCustomAttribute(
  phoneNumber: string,
  t: (key: string) => string,
): Promise<PatientSearchResultBundle> {
  const loginLocation = getUserLoginLocation();
  const searchResultsBundle = await get<PatientSearchResultBundle>(
    PATIENT_PHONE_NUMBER_SEARCH_URL(phoneNumber, loginLocation.uuid),
  );
  return searchResultsBundle;
}

/**
 * Get primary identifier type from Bahmni app settings
 * @returns Promise<string | null> - The primary identifier type UUID or null if not found
 */
export const getPrimaryIdentifierType = async (): Promise<string | null> => {
  const settings = await get<AppSettingsResponse>(APP_SETTINGS_URL('core'));
  const primaryIdentifierTypes = settings.find(
    (setting) => setting.property === PRIMARY_IDENTIFIER_TYPE_PROPERTY,
  );
  return primaryIdentifierTypes?.value ?? null;
};

/**
 * Get all identifier data in a single call (prefixes, sources, and primary type)
 * @returns Promise with prefixes array, sources map, and primary identifier type UUID
 */
export const getIdentifierData = async (): Promise<{
  prefixes: string[];
  sourcesByPrefix: Map<string, string>;
  primaryIdentifierTypeUuid: string | null;
}> => {
  const [identifierTypes, primaryIdentifierTypeUuid] = await Promise.all([
    get<IdentifierTypesResponse>(IDENTIFIER_TYPES_URL),
    getPrimaryIdentifierType(),
  ]);

  const prefixes: string[] = [];
  const sourcesByPrefix = new Map<string, string>();

  if (!primaryIdentifierTypeUuid) {
    return { prefixes, sourcesByPrefix, primaryIdentifierTypeUuid: null };
  }

  const primaryIdentifierType = identifierTypes.find(
    (identifierType) => identifierType.uuid === primaryIdentifierTypeUuid,
  );

  if (!primaryIdentifierType) {
    return { prefixes, sourcesByPrefix, primaryIdentifierTypeUuid };
  }

  // Extract prefixes and map sources
  primaryIdentifierType.identifierSources.forEach((source) => {
    if (source.prefix) {
      prefixes.push(source.prefix);
      if (source.uuid) {
        sourcesByPrefix.set(source.prefix, source.uuid);
      }
    }
  });

  return {
    prefixes: prefixes.sort(),
    sourcesByPrefix,
    primaryIdentifierTypeUuid,
  };
};

/**
 * Create a new patient
 * @param patientData - The patient data to create
 * @returns Promise<CreatePatientResponse> - The created patient response
 */
export const createPatient = async (
  patientData: CreatePatientRequest,
): Promise<CreatePatientResponse> => {
  return post<CreatePatientResponse>(CREATE_PATIENT_URL, patientData);
};

/**
 * Get genders from global property
 * @returns Promise<string[]> - Array of gender display names
 */
export const getGenders = async (): Promise<string[]> => {
  const genders = await get<Record<string, string>>(
    APP_PROPERTY_URL('mrs.genders'),
  );
  return Object.values(genders);
};
