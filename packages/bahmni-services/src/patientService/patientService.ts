import { Patient } from 'fhir/r4';
import { get } from '../api';
import { BAHMNI_USER_LOCATION_COOKIE_NAME } from '../constants/app';
import { DATE_FORMAT, formatDate, calculateAge } from '../date';
import { getCookieByName } from '../utils';
import {
  PATIENT_RESOURCE_URL,
  PATIENT_SEARCH_BASE_URL,
  PATIENT_SEARCH_CONFIG
} from './constants';
import {
  FormattedPatientData,
  PatientSearchResult,
  PatientSearchApiResult,
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

const isNonEmpty = (s: string) => s.trim().length > 0;

const getLoginLocationUuid = (): string | null => {
  try {
    const cookieValue = getCookieByName(BAHMNI_USER_LOCATION_COOKIE_NAME);
    if (!cookieValue) return null;
    const locationData = JSON.parse(decodeURIComponent(cookieValue));
    return locationData?.uuid ?? null;
  } catch (error) {
    return null;
  }
};

const formatTimestamp = (ts: number, t: (k: string) => string): string => {
  try {
    const date = new Date(ts);
    const result = formatDate(date, t, DATE_FORMAT);
    return result.formattedResult || 'Invalid Date';
  } catch {
    return 'Invalid Date';
  }
};

const sortBy = <T>(items: T[], pick: (x: T) => string): T[] => {
  if (!items?.length) return items;
  return [...items].sort((a, b) =>
    pick(a).localeCompare(pick(b), undefined, {
      numeric: true,
      sensitivity: 'base',
    }),
  );
};

const joinNameParts = (...parts: Array<string | null | undefined>) =>
  parts.filter(Boolean).join(' ');

const extractFromJsonAttr = (
  raw: string | null,
  key: string,
): string | null => {
  try {
    const obj = raw ? JSON.parse(raw) : {};
    return obj?.[key] ?? null;
  } catch {
    return null;
  }
};

async function searchPatientsInternal(
  searchTerm: string,
): Promise<{ totalCount: number; pageOfResults: PatientSearchApiResult[] }> {
  const loginLocationUuid = getLoginLocationUuid();
  if (!loginLocationUuid)
    throw new Error('Login location UUID not found in cookie');
  if (!isNonEmpty(searchTerm)) throw new Error('Search term cannot be empty');

  const q = searchTerm.trim();
  const params = new URLSearchParams({
    filterOnAllIdentifiers: 'true',
    q,
    identifier: q,
    loginLocationUuid,
    patientSearchResultsConfig: PATIENT_SEARCH_CONFIG.PHONE_NUMBER,
  });
  params.append(
    'patientSearchResultsConfig',
    PATIENT_SEARCH_CONFIG.ALTERNATE_PHONE_NUMBER,
  );

  const url = `${PATIENT_SEARCH_BASE_URL}?${params.toString()}`;
  return get<{ totalCount: number; pageOfResults: PatientSearchApiResult[] }>(url);
}

function convertToPatientSearchResult(
  apiResult: PatientSearchApiResult,
  t: (key: string) => string,
): PatientSearchResult {
  return {
    id: apiResult.uuid,
    patientId: apiResult.identifier,
    fullName: joinNameParts(apiResult.givenName, apiResult.middleName, apiResult.familyName),
    gender: apiResult.gender,
    age: apiResult.age,
    phoneNumber: extractFromJsonAttr(apiResult.customAttribute, 'phoneNumber'),
    alternatePhoneNumber: extractFromJsonAttr(apiResult.customAttribute, 'alternatePhoneNumber'),
    registrationDate: formatTimestamp(apiResult.dateCreated, t),
  };
}

/**
 * Search for patients based on search term
 * @param searchTerm - The term to search for patients
 * @param t - Translation function
 * @returns Patient search results with total count
 */
export async function getPatientSearchResults(
  searchTerm: string,
  t: (key: string) => string,
): Promise<{ results: PatientSearchResult[]; totalCount: number }> {
  const response = await searchPatientsInternal(searchTerm);
  const sorted = sortBy(response.pageOfResults, (p) => p.identifier);
  const formattedResults = sorted.map((p) => convertToPatientSearchResult(p, t));
  
  return {
    results: formattedResults,
    totalCount: response.totalCount,
  };
}
