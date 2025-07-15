/**
 * Patient Registration Service
 *
 * Handles API calls for patient registration including creating, updating,
 * and validating patients. Based on the AngularJS implementation API patterns.
 */

import {
  PatientFormData,
  CreatePatientRequest,
  CreatePatientResponse,
  IdentifierType,
  RegistrationConfig,
} from '../types/registration';
import { get, post, put } from './api';
import { parseLongDateToServerFormat } from '@utils/date';
import { getMrsAttributes } from '@utils/attributeFormatter';

// API endpoints based on AngularJS implementation
const ENDPOINTS = {
  PATIENT_PROFILE: '/openmrs/ws/rest/v1/bahmnicore/patientprofile',
  IDENTIFIER_GENERATION: '/openmrs/ws/rest/v1/idgen',
  PATIENT_SEARCH: '/openmrs/ws/rest/v1/bahmnicore/search/patient',
  PATIENT_CONFIG: '/openmrs/ws/rest/v1/bahmnicore/config/patient',
  IDENTIFIER_TYPES: '/openmrs/ws/rest/v1/patientidentifiertype',
  PERSON_ATTRIBUTE_TYPES: '/openmrs/ws/rest/v1/personattributetype',
  RELATIONSHIP_TYPES: '/openmrs/ws/rest/v1/relationshiptype',
  ADDRESS_HIERARCHY: '/openmrs/ws/rest/v1/addresshierarchy',
} as const;

/**
 * Generate a new patient identifier
 */
export const generatePatientIdentifier = async (
  identifierSourceName?: string,
): Promise<string> => {
  const data = {
    identifierSourceName: identifierSourceName || '',
  };

  const response = await post<string>(ENDPOINTS.IDENTIFIER_GENERATION, data);

  return response;
};

/**
 * Search for existing patients by identifier
 */
export const searchPatientByIdentifier = async (
  identifier: string,
): Promise<any[]> => {
  const params = {
    identifier,
    loginLocationUuid: '', // TODO: Get from session
  };

  return get<any[]>(
    `${ENDPOINTS.PATIENT_SEARCH}?identifier=${identifier}&loginLocationUuid=`,
  );
};

/**
 * Search for patients by name or identifier
 */
export const searchPatientByNameOrIdentifier = async (
  query: string,
  limit: number = 10,
): Promise<any[]> => {
  const params = {
    q: query,
    identifier: query,
    filterOnAllIdentifiers: true,
    s: 'byIdOrName',
    limit,
    loginLocationUuid: '', // TODO: Get from session
  };

  return get<any[]>(
    `${ENDPOINTS.PATIENT_SEARCH}/lucene?q=${query}&identifier=${query}&filterOnAllIdentifiers=true&s=byIdOrName&limit=${limit}&loginLocationUuid=`,
  );
};

/**
 * Get patient registration configuration
 */
export const getRegistrationConfig = async (): Promise<RegistrationConfig> => {
  // This would typically come from multiple API calls
  // For now, return a basic configuration
  const [identifierTypes, attributeTypes, relationshipTypes] =
    await Promise.all([
      getIdentifierTypes(),
      getPersonAttributeTypes(),
      getRelationshipTypes(),
    ]);

  return {
    identifierTypes,
    attributeTypes: attributeTypes || [],
    relationshipTypes: relationshipTypes || [],
    addressLevels: [], // TODO: Get from address hierarchy API
    genderOptions: [
      { code: 'M', display: 'Male' },
      { code: 'F', display: 'Female' },
      { code: 'O', display: 'Other' },
    ],
    showEnterID: true,
    disablePhotoCapture: false,
    dobMandatory: false,
    showMiddleName: true,
    showLastName: true,
    showBirthTime: false,
    addressHierarchyConfigs: {
      showAddressFieldsTopDown: false,
      strictAutocompleteFromLevel: undefined,
    },
  };
};

/**
 * Get identifier types
 */
export const getIdentifierTypes = async (): Promise<IdentifierType[]> => {
  const response = await get<{ results: any[] }>(
    `${ENDPOINTS.IDENTIFIER_TYPES}?v=full`,
  );

  return response.results.map((item: any) => ({
    uuid: item.uuid,
    name: item.name,
    description: item.description,
    primary: item.primary || false,
    required: item.required || false,
    identifierSources: item.identifierSources || [],
  }));
};

/**
 * Get person attribute types
 */
export const getPersonAttributeTypes = async (): Promise<any[]> => {
  try {
    const response = await get<{ results: any[] }>(
      `${ENDPOINTS.PERSON_ATTRIBUTE_TYPES}?v=full`,
    );
    return response.results;
  } catch (error) {
    console.warn('Failed to fetch person attribute types:', error);
    return [];
  }
};

/**
 * Get relationship types
 */
export const getRelationshipTypes = async (): Promise<any[]> => {
  try {
    const response = await get<{ results: any[] }>(
      `${ENDPOINTS.RELATIONSHIP_TYPES}?v=full`,
    );
    return response.results;
  } catch (error) {
    console.warn('Failed to fetch relationship types:', error);
    return [];
  }
};

/**
 * Transform PatientFormData to CreatePatientRequest
 */
export const transformToCreateRequest = (
  formData: PatientFormData,
  config: RegistrationConfig,
): CreatePatientRequest => {
  const identifiers = [
    {
      identifier: formData.primaryIdentifier.identifier,
      identifierType: formData.primaryIdentifier.identifierType.uuid,
      preferred: true,
    },
    ...(formData.extraIdentifiers || []).map((id) => ({
      identifier: id.identifier,
      identifierType: id.identifierType.uuid,
      preferred: false,
    })),
  ];

  const attributes = getMrsAttributes(formData, config.attributeTypes || []);

  if (formData.otherInfo?.phoneNumber) {
    attributes.push({
      attributeType: 'phoneNumber',
      value: formData.otherInfo.phoneNumber,
    });
  }

  const request: CreatePatientRequest = {
    patient: {
      identifiers: identifiers,
      person: {
        names: [
          {
            givenName: formData.name.givenName,
            middleName: formData.name.middleName,
            familyName: formData.name.familyName,
            preferred: true,
          },
        ],
        gender: formData.demographics.gender,
        birthdate: formData.demographics.birthdate,
        birthdateEstimated: formData.demographics.birthdateEstimated,
        // birthtime: parseLongDateToServerFormat(formData.demographics.birthtime),
        personDateCreated: new Date().toISOString(),
        addresses: formData.address
          ? [
              {
                // address1: formData.address.address1,
                // address2: formData.address.address2,
                // cityVillage: formData.address.cityVillage,
                // stateProvince: formData.address.stateProvince,
                // postalCode: formData.address.postalCode,
                // country: formData.address.country,
                // preferred: true,
              },
            ]
          : undefined,
        attributes: attributes,
      },
      relationships: (formData.relationships || []).map((rel) => ({
        relationshipType: rel.relationshipType.uuid,
        personA: rel.personA?.uuid || '',
        personB: rel.personB?.uuid || '',
      })),
    },
  };

  // Add photo if present
  if (formData.photo?.image) {
    request.image = formData.photo.image;
  }

  return request;
};

/**
 * Create a new patient
 */
export const createPatient = async (
  formData: PatientFormData,
  config: RegistrationConfig,
  jumpAccepted: boolean = false,
): Promise<CreatePatientResponse> => {
  const requestData = transformToCreateRequest(formData, config);

  return post<CreatePatientResponse>(ENDPOINTS.PATIENT_PROFILE, requestData);
};

/**
 * Update an existing patient
 */
export const updatePatient = async (
  patientUuid: string,
  formData: PatientFormData,
  config: RegistrationConfig,
): Promise<CreatePatientResponse> => {
  const requestData = transformToCreateRequest(formData, config);

  return put<CreatePatientResponse>(
    `${ENDPOINTS.PATIENT_PROFILE}/${patientUuid}`,
    requestData,
  );
};

/**
 * Get patient by UUID
 */
export const getPatientByUuid = async (patientUuid: string): Promise<any> => {
  return get<any>(`${ENDPOINTS.PATIENT_PROFILE}/${patientUuid}?v=full`);
};

/**
 * Validate patient identifier uniqueness
 */
export const validateIdentifierUniqueness = async (
  identifier: string,
  identifierTypeUuid: string,
): Promise<boolean> => {
  try {
    const results = await searchPatientByIdentifier(identifier);
    return results.length === 0;
  } catch (error) {
    console.error('Error validating identifier uniqueness:', error);
    return false;
  }
};

/**
 * Get address hierarchy levels
 */
export const getAddressHierarchy = async (): Promise<any[]> => {
  try {
    const response = await get<{ results: any[] }>(ENDPOINTS.ADDRESS_HIERARCHY);
    return response.results;
  } catch (error) {
    console.warn('Failed to fetch address hierarchy:', error);
    return [];
  }
};
