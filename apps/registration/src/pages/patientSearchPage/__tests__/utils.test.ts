import {
  PatientSearchResult,
  PatientSearchResultBundle,
  PatientSearchField,
  hasPrivilege,
  dateComparator,
  UserPrivilege,
} from '@bahmni-frontend/bahmni-services';
import {
  formatPatientSearchResult,
  privilegeValidator,
  statusValidator,
  appDateValidator,
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

const mockPatientSearchFields: PatientSearchField[] = [
  {
    translationKey: 'PHONE_SEARCH',
    fields: ['phoneNumber', 'alternatePhoneNumber'],
    columnTranslationKeys: ['PHONE_NUMBER', 'ALTERNATE_PHONE_NUMBER'],
    type: 'person',
  },
];

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
      formatPatientSearchResult(
        mockPatientSearchResultBundle,
        mockPatientSearchFields,
      ),
    ).toStrictEqual(patientSearchResult);
  });

  it('return empty array if patient search bundle is undefined', () => {
    const mockPatientSearchResultBundle = undefined;
    expect(
      formatPatientSearchResult(mockPatientSearchResultBundle),
    ).toStrictEqual([]);
  });
});

jest.mock('@bahmni-frontend/bahmni-services', () => ({
  ...jest.requireActual('@bahmni-frontend/bahmni-services'),
  hasPrivilege: jest.fn(),
  dateComparator: jest.fn(),
}));

describe('privilegeValidator', () => {
  it('returns true if user has at least one required privilege', () => {
    (hasPrivilege as jest.Mock).mockImplementation(
      (privs, rule) => rule === 'CAN_VIEW',
    );
    const validator = privilegeValidator([
      { name: 'CAN_VIEW' } as UserPrivilege,
    ]);
    expect(validator(['CAN_VIEW', 'CAN_EDIT'])).toBe(true);
  });

  it('returns false if user has none of the required privileges', () => {
    (hasPrivilege as jest.Mock).mockReturnValue(false);
    const validator = privilegeValidator([
      { name: 'CAN_DELETE' } as UserPrivilege,
    ]);
    expect(validator(['CAN_VIEW', 'CAN_EDIT'])).toBe(false);
  });
});

describe('statusValidator', () => {
  const row = { appointmentStatus: 'SCHEDULED' } as any;

  it('returns true if status is in rules', () => {
    expect(statusValidator(['SCHEDULED', 'COMPLETED'], row)).toBe(true);
  });

  it('returns false if status is not in rules', () => {
    expect(statusValidator(['CANCELLED'], row)).toBe(false);
  });

  it('handles undefined appointmentStatus', () => {
    expect(statusValidator([''], { appointmentStatus: undefined } as any)).toBe(
      true,
    );
  });
});

describe('appDateValidator', () => {
  const row = { appointmentDate: '2024-06-01' } as any;

  it('returns true if any rule matches dateComparator', () => {
    (dateComparator as jest.Mock).mockImplementation(
      (date, rule) => rule === 'today',
    );
    expect(appDateValidator(['today', 'past'], row)).toBe(true);
  });

  it('returns false if no rule matches dateComparator', () => {
    (dateComparator as jest.Mock).mockReturnValue(false);
    expect(appDateValidator(['future'], row)).toBe(false);
  });
});
