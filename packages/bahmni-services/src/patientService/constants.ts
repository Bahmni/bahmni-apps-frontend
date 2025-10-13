import { PatientSearchField } from '../configService/models/registrationConfig';
import { OPENMRS_FHIR_R4, OPENMRS_REST_V1 } from '../constants/app';

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

export const ADDRESS_HIERARCHY_URL = (
  addressField: string,
  searchString: string,
  limit: number = 20,
) =>
  `/openmrs/module/addresshierarchy/ajax/getPossibleAddressHierarchyEntriesWithParents.form?addressField=${addressField}&limit=${limit}&searchString=${encodeURIComponent(searchString)}`;
