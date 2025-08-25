import { PatientSearchResult, PatientSearchResponse } from '../models';

export const mockPatientSearchResults: PatientSearchResult[] = [
  {
    uuid: 'patient-uuid-1',
    birthDate: 631152000000, // 1990-01-01
    extraIdentifiers: null,
    personId: 1001,
    deathDate: null,
    identifier: 'PAT001',
    addressFieldValue: '123 Main St, City',
    givenName: 'John',
    middleName: 'Michael',
    familyName: 'Doe',
    gender: 'M',
    dateCreated: 1577836800000, // 2020-01-01
    activeVisitUuid: null,
    customAttribute: null,
    patientProgramAttributeValue: null,
    hasBeenAdmitted: false,
    age: '34',
  },
  {
    uuid: 'patient-uuid-2',
    birthDate: 662688000000, // 1991-01-01
    extraIdentifiers: 'ALT002',
    personId: 1002,
    deathDate: null,
    identifier: 'PAT002',
    addressFieldValue: '456 Oak Ave, Town',
    givenName: 'Jane',
    middleName: null,
    familyName: 'Smith',
    gender: 'F',
    dateCreated: 1609459200000, // 2021-01-01
    activeVisitUuid: 'visit-uuid-1',
    customAttribute: 'VIP',
    patientProgramAttributeValue: null,
    hasBeenAdmitted: true,
    age: '33',
  },
];

// Mock data for identifier match-based sorting tests
export const mockPatientSearchResultsForIdentifierSorting: PatientSearchResult[] =
  [
    {
      uuid: 'patient-uuid-1',
      birthDate: 631152000000,
      extraIdentifiers: null,
      personId: 1001,
      deathDate: null,
      identifier: 'ABC200', // Exact match for search term "ABC200"
      addressFieldValue: '123 Main St',
      givenName: 'John',
      middleName: null,
      familyName: 'Doe',
      gender: 'M',
      dateCreated: 1577836800000,
      activeVisitUuid: null,
      customAttribute: null,
      patientProgramAttributeValue: null,
      hasBeenAdmitted: false,
      age: '34',
    },
    {
      uuid: 'patient-uuid-2',
      birthDate: 662688000000,
      extraIdentifiers: null,
      personId: 1002,
      deathDate: null,
      identifier: 'ABC20000', // Starts with "ABC200" but longer
      addressFieldValue: '456 Oak Ave',
      givenName: 'Jane',
      middleName: null,
      familyName: 'Smith',
      gender: 'F',
      dateCreated: 1609459200000,
      activeVisitUuid: null,
      customAttribute: null,
      patientProgramAttributeValue: null,
      hasBeenAdmitted: false,
      age: '33',
    },
    {
      uuid: 'patient-uuid-3',
      birthDate: 694224000000,
      extraIdentifiers: null,
      personId: 1003,
      deathDate: null,
      identifier: 'ABC200000', // Starts with "ABC200" but even longer
      addressFieldValue: '789 Pine St',
      givenName: 'Robert',
      middleName: null,
      familyName: 'Johnson',
      gender: 'M',
      dateCreated: 1640995200000,
      activeVisitUuid: null,
      customAttribute: null,
      patientProgramAttributeValue: null,
      hasBeenAdmitted: false,
      age: '32',
    },
    {
      uuid: 'patient-uuid-4',
      birthDate: 725760000000,
      extraIdentifiers: null,
      personId: 1004,
      deathDate: null,
      identifier: 'ABC2000001', // Starts with "ABC200" but longest
      addressFieldValue: '321 Elm St',
      givenName: 'Emily',
      middleName: null,
      familyName: 'Davis',
      gender: 'F',
      dateCreated: 1672531200000,
      activeVisitUuid: null,
      customAttribute: null,
      patientProgramAttributeValue: null,
      hasBeenAdmitted: false,
      age: '31',
    },
    {
      uuid: 'patient-uuid-5',
      birthDate: 757296000000,
      extraIdentifiers: null,
      personId: 1005,
      deathDate: null,
      identifier: 'XYZ123ABC200', // Contains "ABC200" but not at start
      addressFieldValue: '555 Maple Ave',
      givenName: 'Michael',
      middleName: null,
      familyName: 'Wilson',
      gender: 'M',
      dateCreated: 1704067200000,
      activeVisitUuid: null,
      customAttribute: null,
      patientProgramAttributeValue: null,
      hasBeenAdmitted: false,
      age: '30',
    },
    {
      uuid: 'patient-uuid-6',
      birthDate: 788832000000,
      extraIdentifiers: null,
      personId: 1006,
      deathDate: null,
      identifier: 'DEF456', // No match with "ABC200"
      addressFieldValue: '777 Cedar Rd',
      givenName: 'Sarah',
      middleName: null,
      familyName: 'Brown',
      gender: 'F',
      dateCreated: 1735689600000,
      activeVisitUuid: null,
      customAttribute: null,
      patientProgramAttributeValue: null,
      hasBeenAdmitted: false,
      age: '29',
    },
  ];

export const mockPatientSearchResponseForIdentifierSorting: PatientSearchResponse =
  {
    totalCount: 6,
    pageOfResults: mockPatientSearchResultsForIdentifierSorting,
  };

export const mockPatientSearchResponse: PatientSearchResponse = {
  totalCount: 2,
  pageOfResults: mockPatientSearchResults,
};

// Additional test cases for edge scenarios
export const mockPatientSearchResultsWithPartialMatches: PatientSearchResult[] =
  [
    {
      uuid: 'patient-uuid-1',
      birthDate: 631152000000,
      extraIdentifiers: null,
      personId: 1001,
      deathDate: null,
      identifier: 'ABC123', // Partial match with "ABC200" (ABC prefix)
      addressFieldValue: '123 Main St',
      givenName: 'John',
      middleName: null,
      familyName: 'Doe',
      gender: 'M',
      dateCreated: 1577836800000,
      activeVisitUuid: null,
      customAttribute: null,
      patientProgramAttributeValue: null,
      hasBeenAdmitted: false,
      age: '34',
    },
    {
      uuid: 'patient-uuid-2',
      birthDate: 662688000000,
      extraIdentifiers: null,
      personId: 1002,
      deathDate: null,
      identifier: 'AB200', // Partial match with "ABC200" (AB prefix)
      addressFieldValue: '456 Oak Ave',
      givenName: 'Jane',
      middleName: null,
      familyName: 'Smith',
      gender: 'F',
      dateCreated: 1609459200000,
      activeVisitUuid: null,
      customAttribute: null,
      patientProgramAttributeValue: null,
      hasBeenAdmitted: false,
      age: '33',
    },
    {
      uuid: 'patient-uuid-3',
      birthDate: 694224000000,
      extraIdentifiers: null,
      personId: 1003,
      deathDate: null,
      identifier: 'XYZ789', // No match with "ABC200"
      addressFieldValue: '789 Pine St',
      givenName: 'Robert',
      middleName: null,
      familyName: 'Johnson',
      gender: 'M',
      dateCreated: 1640995200000,
      activeVisitUuid: null,
      customAttribute: null,
      patientProgramAttributeValue: null,
      hasBeenAdmitted: false,
      age: '32',
    },
  ];

export const mockPatientSearchResponseWithPartialMatches: PatientSearchResponse =
  {
    totalCount: 3,
    pageOfResults: mockPatientSearchResultsWithPartialMatches,
  };

export const mockEmptyPatientSearchResponse: PatientSearchResponse = {
  totalCount: 0,
  pageOfResults: [],
};

// Mock data for case-insensitive matching tests
export const mockPatientSearchResultsWithCaseVariations: PatientSearchResult[] =
  [
    {
      uuid: 'patient-uuid-1',
      birthDate: 631152000000,
      extraIdentifiers: null,
      personId: 1001,
      deathDate: null,
      identifier: 'abc200', // Lowercase exact match
      addressFieldValue: '123 Main St',
      givenName: 'John',
      middleName: null,
      familyName: 'Doe',
      gender: 'M',
      dateCreated: 1577836800000,
      activeVisitUuid: null,
      customAttribute: null,
      patientProgramAttributeValue: null,
      hasBeenAdmitted: false,
      age: '34',
    },
    {
      uuid: 'patient-uuid-2',
      birthDate: 662688000000,
      extraIdentifiers: null,
      personId: 1002,
      deathDate: null,
      identifier: 'ABC200', // Uppercase exact match
      addressFieldValue: '456 Oak Ave',
      givenName: 'Jane',
      middleName: null,
      familyName: 'Smith',
      gender: 'F',
      dateCreated: 1609459200000,
      activeVisitUuid: null,
      customAttribute: null,
      patientProgramAttributeValue: null,
      hasBeenAdmitted: false,
      age: '33',
    },
    {
      uuid: 'patient-uuid-3',
      birthDate: 694224000000,
      extraIdentifiers: null,
      personId: 1003,
      deathDate: null,
      identifier: 'AbC200', // Mixed case exact match
      addressFieldValue: '789 Pine St',
      givenName: 'Robert',
      middleName: null,
      familyName: 'Johnson',
      gender: 'M',
      dateCreated: 1640995200000,
      activeVisitUuid: null,
      customAttribute: null,
      patientProgramAttributeValue: null,
      hasBeenAdmitted: false,
      age: '32',
    },
  ];

export const mockPatientSearchResponseWithCaseVariations: PatientSearchResponse =
  {
    totalCount: 3,
    pageOfResults: mockPatientSearchResultsWithCaseVariations,
  };

// Mock data for "%" search (show all patients) - unsorted initially
export const mockPatientSearchResultsForPercentSearch: PatientSearchResult[] = [
  {
    uuid: 'patient-uuid-3',
    birthDate: 694224000000,
    extraIdentifiers: null,
    personId: 1003,
    deathDate: null,
    identifier: 'ABC200000', // Should be 3rd in sorted order
    addressFieldValue: '789 Pine St',
    givenName: 'Robert',
    middleName: null,
    familyName: 'Johnson',
    gender: 'M',
    dateCreated: 1640995200000,
    activeVisitUuid: null,
    customAttribute: null,
    patientProgramAttributeValue: null,
    hasBeenAdmitted: false,
    age: '32',
  },
  {
    uuid: 'patient-uuid-1',
    birthDate: 631152000000,
    extraIdentifiers: null,
    personId: 1001,
    deathDate: null,
    identifier: 'ABC200', // Should be 1st in sorted order
    addressFieldValue: '123 Main St',
    givenName: 'John',
    middleName: null,
    familyName: 'Doe',
    gender: 'M',
    dateCreated: 1577836800000,
    activeVisitUuid: null,
    customAttribute: null,
    patientProgramAttributeValue: null,
    hasBeenAdmitted: false,
    age: '34',
  },
  {
    uuid: 'patient-uuid-5',
    birthDate: 757296000000,
    extraIdentifiers: null,
    personId: 1005,
    deathDate: null,
    identifier: 'DEF456', // Should be 5th in sorted order
    addressFieldValue: '555 Maple Ave',
    givenName: 'Michael',
    middleName: null,
    familyName: 'Wilson',
    gender: 'M',
    dateCreated: 1704067200000,
    activeVisitUuid: null,
    customAttribute: null,
    patientProgramAttributeValue: null,
    hasBeenAdmitted: false,
    age: '30',
  },
  {
    uuid: 'patient-uuid-2',
    birthDate: 662688000000,
    extraIdentifiers: null,
    personId: 1002,
    deathDate: null,
    identifier: 'ABC20000', // Should be 2nd in sorted order
    addressFieldValue: '456 Oak Ave',
    givenName: 'Jane',
    middleName: null,
    familyName: 'Smith',
    gender: 'F',
    dateCreated: 1609459200000,
    activeVisitUuid: null,
    customAttribute: null,
    patientProgramAttributeValue: null,
    hasBeenAdmitted: false,
    age: '33',
  },
  {
    uuid: 'patient-uuid-4',
    birthDate: 725760000000,
    extraIdentifiers: null,
    personId: 1004,
    deathDate: null,
    identifier: 'ABC2000001', // Should be 4th in sorted order
    addressFieldValue: '321 Elm St',
    givenName: 'Emily',
    middleName: null,
    familyName: 'Davis',
    gender: 'F',
    dateCreated: 1672531200000,
    activeVisitUuid: null,
    customAttribute: null,
    patientProgramAttributeValue: null,
    hasBeenAdmitted: false,
    age: '31',
  },
];

export const mockPatientSearchResponseForPercentSearch: PatientSearchResponse =
  {
    totalCount: 5,
    pageOfResults: mockPatientSearchResultsForPercentSearch,
  };

// Single patient response for testing
export const mockSinglePatientSearchResponse: PatientSearchResponse = {
  totalCount: 1,
  pageOfResults: [mockPatientSearchResultsForIdentifierSorting[0]],
};
