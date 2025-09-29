import {
  PatientSearchResult,
  PatientSearchResultBundle,
} from '@bahmni-frontend/bahmni-services';
import {
  formatPatientSearchResult,
  type PatientSearchViewModel,
} from '../utils';

const mockPatientSearchResultBundle: PatientSearchResultBundle = {
  totalCount: 1,
  pageOfResults: [
    {
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
    },
  ],
};

describe('formatPatientSearchResult', () => {
  it('convert patient search results bundle to view model if patient search bundle has results', () => {
    const patientSearchResult: PatientSearchViewModel<PatientSearchResult>[] = [
      {
        id: 'ABC200000',
        uuid: '02f47490-d657-48ee-98e7-4c9133ea168b',
        birthDate: new Date(-17366400000),
        extraIdentifiers: null,
        personId: 9,
        deathDate: null,
        identifier: 'ABC200000',
        addressFieldValue: null,
        name: 'Steffi Maria Graf',
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
        phoneNumber: '864579392',
        alternatePhoneNumber: '4596781239',
        hasBeenAdmitted: true,
        age: '56',
      },
    ];
    expect(
      formatPatientSearchResult(mockPatientSearchResultBundle),
    ).toStrictEqual(patientSearchResult);
  });

  it('return empty array if patient search bundle has results', () => {
    const mockPatientSearchResultBundle = undefined;
    expect(
      formatPatientSearchResult(mockPatientSearchResultBundle),
    ).toStrictEqual([]);
  });
});
