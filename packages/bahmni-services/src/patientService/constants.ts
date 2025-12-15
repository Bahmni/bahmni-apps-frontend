import { PatientSearchField } from '../configService/models/registrationConfig';
import {
  OPENMRS_FHIR_R4,
  OPENMRS_REST_V1,
  OPENMRS_REST_V2,
  VISIT_LOCATION_UUID,
} from '../constants/app';

/**
 * Configuration mapping for different field types used in patient search.
 * Each type uses different query parameter names for search and results.
 */
const FIELD_TYPE_CONFIG = {
  person: {
    searchParam: 'customAttribute',
    searchFieldParam: 'patientAttributes',
    resultParam: 'patientSearchResultsConfig',
  },
  address: {
    searchParam: 'addressFieldValue',
    searchFieldParam: 'addressFieldName',
    resultParam: 'addressSearchResultsConfig',
  },
};

/**
 * Helper function to append search result fields to URL params based on field type configuration.
 * This is used to dynamically add fields from config to search result parameters.
 *
 * @param params - URLSearchParams object to append to
 * @param allSearchFields - Array of patient search field configurations from backend
 */
const appendSearchResultFields = (
  params: URLSearchParams,
  allSearchFields: PatientSearchField[],
): void => {
  allSearchFields.forEach((field) => {
    const typeConfig =
      FIELD_TYPE_CONFIG[field.type as keyof typeof FIELD_TYPE_CONFIG];
    if (typeConfig) {
      field.fields.forEach((fieldName) => {
        params.append(typeConfig.resultParam, fieldName);
      });
    }
  });
};

export const PATIENT_RESOURCE_URL = (patientUUID: string) =>
  OPENMRS_FHIR_R4 + `/Patient/${patientUUID}`;
// TODO: update get api client to pass path params
export const PATIENT_LUCENE_SEARCH_URL = (
  searchTerm: string,
  loginLocationUuid: string,
  allSearchFields?: PatientSearchField[],
) => {
  const params = new URLSearchParams({
    filterOnAllIdentifiers: 'false',
    identifier: searchTerm,
    q: searchTerm,
    loginLocationUuid,
    s: 'byIdOrNameOrVillage',
    startIndex: '0',
  });

  if (allSearchFields && allSearchFields.length > 0) {
    allSearchFields.forEach((field) => {
      const typeConfig =
        FIELD_TYPE_CONFIG[field.type as keyof typeof FIELD_TYPE_CONFIG];
      if (typeConfig) {
        field.fields.forEach((fieldName) => {
          params.append(typeConfig.searchFieldParam, fieldName);
          params.append(typeConfig.resultParam, fieldName);
        });
      }
    });
  }

  return `${OPENMRS_REST_V1}/bahmni/search/patient/lucene?${params.toString()}`;
};

export const PATIENT_CUSTOM_ATTRIBUTE_SEARCH_URL = (
  searchTerm: string,
  fieldType: string,
  fieldsToSearch: string[],
  allSearchFields: PatientSearchField[],
  loginLocationUuid: string,
) => {
  const trimmedSearchTerm = searchTerm.trim();

  const params = new URLSearchParams({
    loginLocationUuid,
    startIndex: '0',
    s: 'byIdOrNameOrVillage',
    filterOnAllIdentifiers: 'false',
  });

  // Use shared config for field type mapping
  const config = FIELD_TYPE_CONFIG[fieldType as keyof typeof FIELD_TYPE_CONFIG];
  if (config) {
    params.set(config.searchParam, trimmedSearchTerm);
    fieldsToSearch.forEach((field) => {
      params.append(config.searchFieldParam, field);
    });
  }

  appendSearchResultFields(params, allSearchFields);

  return OPENMRS_REST_V1 + `/bahmni/search/patient?${params.toString()}`;
};

export const IDENTIFIER_TYPES_URL = OPENMRS_REST_V1 + '/idgen/identifiertype';

export const APP_SETTINGS_URL = (module: string) =>
  OPENMRS_REST_V1 + `/bahmni/app/setting?module=${module}`;

export const PRIMARY_IDENTIFIER_TYPE_PROPERTY = 'bahmni.primaryIdentifierType';

export const CREATE_PATIENT_URL =
  OPENMRS_REST_V1 + '/bahmnicore/patientprofile';

export const UPDATE_PATIENT_URL = (patientUuid: string) =>
  OPENMRS_REST_V1 + `/bahmnicore/patientprofile/${patientUuid}`;

export const GET_PATIENT_PROFILE_URL = (patientUuid: string) =>
  OPENMRS_REST_V1 + `/patientprofile/${patientUuid}?v=full`;

export const ADDRESS_HIERARCHY_URL = (
  addressField: string,
  searchString: string,
  limit: number = 20,
  parentUuid?: string,
) => {
  let url = `/openmrs/module/addresshierarchy/ajax/getPossibleAddressHierarchyEntriesWithParents.form?addressField=${addressField}&limit=${limit}&searchString=${encodeURIComponent(searchString)}`;
  if (parentUuid) {
    url += `&parent=${parentUuid}`;
  }
  return url;
};

export const ORDERED_ADDRESS_HIERARCHY_URL = `/openmrs/module/addresshierarchy/ajax/getOrderedAddressHierarchyLevels.form`;

export const RELATIONSHIP_TYPES_URL =
  OPENMRS_REST_V1 + '/relationshiptype?v=custom:(aIsToB,bIsToA,uuid)';

// Search and pagination constants
export const ADDRESS_HIERARCHY_DEFAULT_LIMIT = 20;
export const ADDRESS_HIERARCHY_MIN_SEARCH_LENGTH = 2;
export const PATIENT_SEARCH_MIN_LENGTH = 2;
export const DEFAULT_PAGE_SIZE = 20;
export const MAX_PAGE_SIZE = 100;
export const APPOINTMENTS_SEARCH_URL = OPENMRS_REST_V1 + '/appointments/search';

// Validation constants
export const MAX_PATIENT_AGE_YEARS = 120;
export const MAX_NAME_LENGTH = 50;
export const MAX_PHONE_NUMBER_LENGTH = 15;
export const UUID_PATTERN = /^[a-f0-9-]{36}$/i;

export const PATIENT_IMAGE_URL = (patientUuid: string) =>
  OPENMRS_REST_V2 + `/patientImage?patientUuid=${patientUuid}`;

export const PERSON_ATTRIBUTE_TYPES_URL =
  OPENMRS_REST_V1 +
  '/personattributetype?v=custom:(uuid,name,sortWeight,description,format,concept:(uuid,display,answers:(uuid,name)))';
