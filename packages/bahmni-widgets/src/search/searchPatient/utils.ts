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
          isDead: patient.isDead ?? patient.dead ?? !!patient.deathDate,
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
