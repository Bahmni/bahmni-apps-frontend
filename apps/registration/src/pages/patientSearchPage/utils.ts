import {
  PatientSearchResult,
  PatientSearchResultBundle,
  PatientSearchField,
} from '@bahmni-frontend/bahmni-services';

export type PatientSearchViewModel<T> = T & {
  id: string;
  name: string;
  [key: string]: unknown;
};

/**
 * Formats Lucene Patient Search To Match View Model
 * @param patientSearchResultBundle - The Lucene Patient Search Bundle
 * @param patientSearchFields - The configured search fields for extracting custom attributes
 * @returns An PatientSearchViewModel Array if there are results
 * @returns An empty array if no results are available
 */
export const formatPatientSearchResult = (
  patientSearchResultBundle: PatientSearchResultBundle | undefined,
  patientSearchFields: PatientSearchField[] = [],
  searchedField?: PatientSearchField,
): PatientSearchViewModel<PatientSearchResult>[] => {
  return patientSearchResultBundle
    ? patientSearchResultBundle
        .pageOfResults!.filter((patient) => {
          if (!searchedField) return true;

          const customAttributes = patient.customAttribute
            ? JSON.parse(patient.customAttribute)
            : {};
          const addressAttributes = patient.addressFieldValue
            ? JSON.parse(patient.addressFieldValue)
            : {};
          const programAttributes = patient.patientProgramAttributeValue
            ? JSON.parse(patient.patientProgramAttributeValue)
            : {};

          return searchedField.fields.some((fieldName) => {
            const value =
              customAttributes[fieldName] ??
              addressAttributes[fieldName] ??
              programAttributes[fieldName];
            return value !== undefined && value !== null && value !== '';
          });
        })
        .map((patient) => {
          const customAttributes = patient.customAttribute
            ? JSON.parse(patient.customAttribute)
            : {};

          const addressAttributes = patient.addressFieldValue
            ? JSON.parse(patient.addressFieldValue)
            : {};

          const programAttributes = patient.patientProgramAttributeValue
            ? JSON.parse(patient.patientProgramAttributeValue)
            : {};

          const dynamicFields: {
            [key: string]: object;
          } = {};

          patientSearchFields.forEach((searchField) => {
            searchField.fields.forEach((fieldName) => {
              if (customAttributes[fieldName] !== undefined) {
                dynamicFields[fieldName] = customAttributes[fieldName];
              } else if (addressAttributes[fieldName] !== undefined) {
                dynamicFields[fieldName] = addressAttributes[fieldName];
              } else if (programAttributes[fieldName] !== undefined) {
                dynamicFields[fieldName] = programAttributes[fieldName];
              }
            });
          });

          return {
            ...patient,
            id: patient.identifier,
            name: [
              patient.givenName,
              patient.middleName,
              patient.familyName,
            ].join(' '),
            ...dynamicFields,
          };
        })
    : [];
};
