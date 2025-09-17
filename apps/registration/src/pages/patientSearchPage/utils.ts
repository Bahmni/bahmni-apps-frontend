import {
  PatientSearchResult,
  PatientSearchResultBundle,
} from '@bahmni-frontend/bahmni-services';

export type PatientSearchViewModel<T> = T & {
  id: string;
  name: string;
  phoneNumber: string;
  alternatePhoneNumber: string;
};

/**
 * Formats Lucene Patient Search To Match View Model
 * @param patientSearchResultBundle - The Lucene Patient Search Bundle
 * @returns An PatientSearchViewModel Array if there are results
 * @returns An empty array if no results are available
 */
export const formatPatientSearchResult = (
  patientSearchResultBundle: PatientSearchResultBundle | undefined,
): PatientSearchViewModel<PatientSearchResult>[] => {
  return patientSearchResultBundle
    ? patientSearchResultBundle.pageOfResults!.map((patient) => ({
        ...patient,
        id: patient.identifier,
        name: [patient.givenName, patient.middleName, patient.familyName].join(
          ' ',
        ),
        phoneNumber: patient.customAttribute
          ? JSON.parse(patient.customAttribute)['phoneNumber']
          : '',
        alternatePhoneNumber: patient.customAttribute
          ? JSON.parse(patient.customAttribute)['alternatePhoneNumber']
          : '',
      }))
    : [];
};
