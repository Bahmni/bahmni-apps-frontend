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
): PatientSearchViewModel<PatientSearchResult>[] => {
  return patientSearchResultBundle
    ? patientSearchResultBundle.pageOfResults!.map((patient) => {
        const customAttributes = patient.customAttribute
          ? JSON.parse(patient.customAttribute)
          : {};

        const dynamicFields: {
          [key: string]: object;
        } = {};
        patientSearchFields.forEach((searchField) => {
          searchField.fields.forEach((fieldName) => {
            if (customAttributes[fieldName] !== undefined) {
              dynamicFields[fieldName] = customAttributes[fieldName];
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
