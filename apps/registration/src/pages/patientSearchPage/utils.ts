import {
  PatientSearchResult,
  PatientSearchResultBundle,
  PatientSearchField,
} from '@bahmni/services';

export type PatientSearchViewModel<T extends PatientSearchResult> = T & {
  id: string;
  name: string;
  [key: string]: unknown;
};

/**
 * Parses and extracts patient attributes from JSON strings
 * @param patient - The patient search result
 * @returns An object containing parsed custom, address, and program attributes
 */
const parsePatientAttributes = (patient: PatientSearchResult) => {
  const customAttributes = patient.customAttribute
    ? JSON.parse(patient.customAttribute)
    : {};
  const addressAttributes = patient.addressFieldValue
    ? JSON.parse(patient.addressFieldValue)
    : {};
  const programAttributes = patient.patientProgramAttributeValue
    ? JSON.parse(patient.patientProgramAttributeValue)
    : {};

  return { customAttributes, addressAttributes, programAttributes };
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
): PatientSearchViewModel<PatientSearchResult>[] => {
  return patientSearchResultBundle
    ? patientSearchResultBundle.pageOfResults!.map((patient) => {
        const { customAttributes, addressAttributes, programAttributes } =
          parsePatientAttributes(patient);

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
