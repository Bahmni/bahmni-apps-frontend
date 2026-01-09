import { Patient } from 'fhir/r4';
import { get, post } from '../api';
import { APP_PROPERTY_URL } from '../applicationConfigService/constants';
import { PatientSearchField } from '../configService/models/registrationConfig';
import { calculateAge } from '../date';
import { getUserLoginLocation } from '../userService';
import { blobToDataUrl } from '../utils';
import {
  PATIENT_CUSTOM_ATTRIBUTE_SEARCH_URL,
  PATIENT_LUCENE_SEARCH_URL,
  PATIENT_RESOURCE_URL,
  IDENTIFIER_TYPES_URL,
  APP_SETTINGS_URL,
  PRIMARY_IDENTIFIER_TYPE_PROPERTY,
  CREATE_PATIENT_URL,
  UPDATE_PATIENT_URL,
  ADDRESS_HIERARCHY_URL,
  ADDRESS_HIERARCHY_DEFAULT_LIMIT,
  ADDRESS_HIERARCHY_MIN_SEARCH_LENGTH,
  UUID_PATTERN,
  ORDERED_ADDRESS_HIERARCHY_URL,
  PATIENT_IMAGE_URL,
  GET_PATIENT_PROFILE_URL,
  PERSON_ATTRIBUTE_TYPES_URL,
  RELATIONSHIP_TYPES_URL,
} from './constants';
import {
  FormattedPatientData,
  PatientSearchResultBundle,
  IdentifierTypesResponse,
  AppSettingsResponse,
  CreatePatientRequest,
  CreatePatientResponse,
  AddressHierarchyEntry,
  OrderedAddressHierarchyLevels,
  PatientProfileResponse,
  PersonAttributeTypesResponse,
  RelationshipTypesResponse,
} from './models';

export const getPatientById = async (patientUUID: string): Promise<Patient> => {
  if (!patientUUID || patientUUID.trim() === '') {
    throw new Error('Invalid patient UUID: UUID cannot be empty');
  }

  if (!UUID_PATTERN.test(patientUUID)) {
    throw new Error(`Invalid patient UUID format: ${patientUUID}`);
  }

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
 * Fetch patient image and convert to data URL
 * @param patientUUID - The UUID of the patient
 * @returns Promise<string | null> - The image data URL or null
 */
export const getPatientImageAsDataUrl = async (
  patientUUID: string,
): Promise<string | null> => {
  const response = await fetch(PATIENT_IMAGE_URL(patientUUID));
  if (!response.ok) return null;

  const blob = await response.blob();
  return await blobToDataUrl(blob);
};

/**
 * Search patient by Name / Identifier
 * @param searchTerm - The Name / Identifier of the patient
 * @param allSearchFields - Optional array of PatientSearchField objects to dynamically configure search fields
 * @returns A formatted patient search bundle object
 */
export const searchPatientByNameOrId = async (
  searchTerm: string,
  allSearchFields?: PatientSearchField[],
): Promise<PatientSearchResultBundle> => {
  const loginLocation = getUserLoginLocation();
  const searchResultsBundle = await get<PatientSearchResultBundle>(
    PATIENT_LUCENE_SEARCH_URL(searchTerm, loginLocation.uuid, allSearchFields),
  );

  return searchResultsBundle;
};
/**
 * Search patient by Custom Attributes (phone, address, program fields)
 * @param searchTerm - The search value entered by user
 * @param searchFields - Array of field names to search in (from PatientSearchField.fields)
 * @param patientSearchFields - Array of PatientSearchField objects to extract result fields from
 * @param t - Translation function
 * @returns A formatted patient search bundle object
 */
export const searchPatientByCustomAttribute = async (
  searchTerm: string,
  fieldType: string,
  fieldsToSearch: string[],
  allSearchFields: PatientSearchField[],
  t: (key: string) => string,
): Promise<PatientSearchResultBundle> => {
  const loginLocation = getUserLoginLocation();
  const searchResultsBundle = await get<PatientSearchResultBundle>(
    PATIENT_CUSTOM_ATTRIBUTE_SEARCH_URL(
      searchTerm,
      fieldType,
      fieldsToSearch,
      allSearchFields,
      loginLocation.uuid,
    ),
  );
  return searchResultsBundle;
};

/**
 * Get all identifier types from idgen
 * @returns Promise<IdentifierTypesResponse> - Array of all identifier types with their sources
 */
export const getIdentifierTypes =
  async (): Promise<IdentifierTypesResponse> => {
    return get<IdentifierTypesResponse>(IDENTIFIER_TYPES_URL);
  };

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
 * Update an existing patient
 * @param patientUuid - The UUID of the patient to update
 * @param patientData - The patient data to update
 * @returns Promise<CreatePatientResponse> - The updated patient response
 */
export const updatePatient = async (
  patientUuid: string,
  patientData: CreatePatientRequest,
): Promise<CreatePatientResponse> => {
  return post<CreatePatientResponse>(
    UPDATE_PATIENT_URL(patientUuid),
    patientData,
  );
};

/**
 * Get genders from global property
 * @returns Promise<Record<string, string>> - Object mapping gender codes to display names (e.g., {"M": "Male"})
 */
export const getGenders = async (): Promise<Record<string, string>> => {
  return get<Record<string, string>>(APP_PROPERTY_URL('mrs.genders'));
};

/**
 * Get address hierarchy entries based on search string
 * @param addressField - The address field type (e.g., 'countyDistrict', 'stateProvince', 'postalCode')
 * @param searchString - The search term
 * @param limit - Maximum number of results (default: 20)
 * @param parentUuid - Optional parent UUID to filter results hierarchically (for top-down mode)
 * @returns Promise<AddressHierarchyEntry[]> - Array of address hierarchy entries with parent information
 */
export const getAddressHierarchyEntries = async (
  addressField: string,
  searchString: string,
  limit: number = ADDRESS_HIERARCHY_DEFAULT_LIMIT,
  parentUuid?: string,
): Promise<AddressHierarchyEntry[]> => {
  if (
    !searchString ||
    searchString.length < ADDRESS_HIERARCHY_MIN_SEARCH_LENGTH
  ) {
    return [];
  }

  try {
    return await get<AddressHierarchyEntry[]>(
      ADDRESS_HIERARCHY_URL(addressField, searchString, limit, parentUuid),
    );
  } catch (error) {
    throw new Error(
      `Failed to fetch address hierarchy for field "${addressField}": ${
        error instanceof Error ? error.message : 'Unknown error'
      }`,
    );
  }
};

/**
 * Get ordered address hierarchy levels from OpenMRS
 * Returns the configured order of address fields as defined in the system
 * @returns Promise<OrderedAddressHierarchyLevels> - Array of address hierarchy levels with their display names and field names
 */
export const getOrderedAddressHierarchyLevels =
  async (): Promise<OrderedAddressHierarchyLevels> => {
    return get<OrderedAddressHierarchyLevels>(ORDERED_ADDRESS_HIERARCHY_URL);
  };

export const getPatientProfile = async (
  patientUuid: string,
): Promise<PatientProfileResponse> => {
  return get<PatientProfileResponse>(GET_PATIENT_PROFILE_URL(patientUuid));
};

/**
 * Get relationship types from OpenMRS
 * @returns Promise<Array<{uuid: string, aIsToB: string, bIsToA: string}>> - Array of relationship type objects
 */
export const getRelationshipTypes = async (): Promise<
  Array<{ uuid: string; aIsToB: string; bIsToA: string }>
> => {
  try {
    const response = await get<RelationshipTypesResponse>(
      RELATIONSHIP_TYPES_URL,
    );
    return response.results.map((type) => ({
      uuid: type.uuid,
      aIsToB: type.aIsToB,
      bIsToA: type.bIsToA,
    }));
  } catch (error) {
    throw new Error(
      `Failed to fetch relationship types: ${
        error instanceof Error ? error.message : 'Unknown error'
      }`,
    );
  }
};

/**
 * Get all person attribute types from OpenMRS
 * Returns person attributes configured in the system with their metadata
 * @returns Promise<PersonAttributeTypesResponse> - Array of person attribute type configurations
 */
export const getPersonAttributeTypes =
  async (): Promise<PersonAttributeTypesResponse> => {
    return get<PersonAttributeTypesResponse>(PERSON_ATTRIBUTE_TYPES_URL);
  };
