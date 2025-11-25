import { PatientSearchField } from '../configService/models/registrationConfig';
import {
  OPENMRS_FHIR_R4,
  OPENMRS_REST_V1,
  VISIT_LOCATION_UUID,
} from '../constants/app';

export const PATIENT_RESOURCE_URL = (patientUUID: string) =>
  OPENMRS_FHIR_R4 + `/Patient/${patientUUID}`;
// TODO: update get api client to pass path params
export const PATIENT_LUCENE_SEARCH_URL = (
  searchTerm: string,
  loginLocationUuid: string,
) =>
  OPENMRS_REST_V1 +
  `/bahmni/search/patient/lucene?filterOnAllIdentifiers=false&identifier=${searchTerm}&q=${searchTerm}&loginLocationUuid=${loginLocationUuid}&patientSearchResultsConfig=phoneNumber&patientSearchResultsConfig=alternatePhoneNumber&s=byIdOrName`;

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

  /**
   * Configuration mapping for different field types.
   * Each type uses different query parameter names:
   * - searchParam: Parameter for the search value (e.g., customAttribute=searchTerm)
   * - searchFieldParam: Parameter for field names to search (e.g., patientAttributes=phoneNumber)
   * - resultParam: Parameter for fields to include in results other than searchFieldParams (e.g., patientSearchResultsConfig=email)
   */
  const fieldTypeConfig = {
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
    program: {
      searchParam: 'programAttributeFieldValue',
      searchFieldParam: 'programAttributeFieldName',
      resultParam: 'programAttributeFieldName',
    },
  };

  const config = fieldTypeConfig[fieldType as keyof typeof fieldTypeConfig];
  if (config) {
    params.set(config.searchParam, trimmedSearchTerm);
    fieldsToSearch.forEach((field) => {
      params.append(config.searchFieldParam, field);
    });
  }

  allSearchFields.forEach((field) => {
    const typeConfig =
      fieldTypeConfig[field.type as keyof typeof fieldTypeConfig];
    if (typeConfig) {
      field.fields.forEach((fieldName) => {
        params.append(typeConfig.resultParam, fieldName);
      });
    }
  });

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

export const CREATE_VISIT_URL = OPENMRS_REST_V1 + '/visit';

export const GET_ACTIVE_VISIT_URL = (patientUuid: string) =>
  OPENMRS_REST_V1 +
  `/visit?includeInactive=false&patient=${patientUuid}&v=custom:(uuid,visitType,location:(uuid))`;

export const GET_VISIT_LOCATION = (loginLocation: string) =>
  VISIT_LOCATION_UUID + `${loginLocation}`;
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
export const UUID_PATTERN = /^[a-f0-9-]{36}$/i;
export const PHONE_NUMBER_UUID = 'a384873b-847a-4a86-b869-28fb601162dd';
export const ALTERNATE_PHONE_NUMBER_UUID =
  '27fa84ff-fdd6-4895-9c77-254b60555f39';
export const EMAIL_UUID = 'e3123cba-5e07-11ef-8f7c-0242ac120002';

export const VISIT_TYPES_URL = () =>
  OPENMRS_REST_V1 +
  `/bahmnicore/config/bahmniencounter?callerContext=REGISTRATION_CONCEPTS`;

export const PERSON_ATTRIBUTE_TYPES_URL =
  OPENMRS_REST_V1 +
  '/personattributetype?v=custom:(uuid,name,sortWeight,description,format,concept:(uuid,display,answers:(uuid,name)))';
