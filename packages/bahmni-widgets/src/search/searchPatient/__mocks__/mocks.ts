import { PatientSearchResult } from '@bahmni/services';

export const buttonTitle = 'Search';
export const searchBarPlaceholder = 'Search by name or patient ID';

export const mockPatient: PatientSearchResult = {
  uuid: '02f47490-d657-48ee-98e7-4c9133ea168b',
  birthDate: new Date(-17366400000),
  extraIdentifiers: null,
  personId: 9,
  deathDate: null,
  identifier: 'ABC200000',
  addressFieldValue: null,
  givenName: 'Steffi',
  middleName: 'Maria',
  familyName: 'Graf',
  gender: 'F',
  dateCreated: new Date(1739872641000),
  activeVisitUuid: 'de947029-15f6-4318-afff-a1cbce3593d2',
  customAttribute: JSON.stringify({
    phoneNumber: '864579392',
    alternatePhoneNumber: '4596781239',
  }),
  hasBeenAdmitted: true,
  age: '56',
  patientProgramAttributeValue: null,
};

export const mockSearchPatientData: PatientSearchResult[] = [
  mockPatient,
  mockPatient,
  mockPatient,
];

export const validPatientSearchConfig = {
  customAttributes: [
    {
      translationKey: 'REGISTRATION_PATIENT_SEARCH_DROPDOWN_PHONE_NUMBER',
      fields: ['phoneNumber', 'alternatePhoneNumber'],
      columnTranslationKeys: [
        'REGISTRATION_PATIENT_SEARCH_HEADER_PHONE_NUMBER',
        'REGISTRATION_PATIENT_SEARCH_HEADER_ALTERNATE_PHONE_NUMBER',
      ],
      type: 'person' as const,
    },
    {
      translationKey: 'REGISTRATION_PATIENT_SEARCH_DROPDOWN_EMAIL',
      fields: ['email'],
      columnTranslationKeys: ['REGISTRATION_PATIENT_SEARCH_HEADER_EMAIL'],
      type: 'person' as const,
    },
    {
      translationKey: 'REGISTRATION_PATIENT_SEARCH_DROPDOWN_VILLAGE',
      fields: ['village'],
      columnTranslationKeys: ['REGISTRATION_PATIENT_SEARCH_HEADER_VILLAGE'],
      type: 'address' as const,
    },
    {
      translationKey: 'REGISTRATION_PATIENT_SEARCH_DROPDOWN_LOCALITY',
      fields: ['locality'],
      columnTranslationKeys: ['REGISTRATION_PATIENT_SEARCH_HEADER_LOCALITY'],
      type: 'address' as const,
    },
    {
      translationKey: 'REGISTRATION_PATIENT_SEARCH_DROPDOWN_PROGRAM_NAME',
      fields: ['programName'],
      columnTranslationKeys: [
        'REGISTRATION_PATIENT_SEARCH_HEADER_PROGRAM_NAME',
      ],
      type: 'program' as const,
    },
  ],
  appointment: [],
};
