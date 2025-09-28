import { Condition } from 'fhir/r4';
import { createConditionViewModels } from '../utils';

jest.mock('i18next', () => ({
  t: jest.fn((key: string) => {
    const translations: { [key: string]: string } = {
      ERROR_CONDITION_MISSING_REQUIRED_FIELDS:
        'Missing required fields in condition data',
      ERROR_CONDITION_MISSING_CODING_INFORMATION:
        'Missing required condition coding information',
    };
    return translations[key] || key;
  }),
}));

const mockConditionsWithoutOptionalFields: Condition[] = [
  {
    resourceType: 'Condition',
    id: 'condition-without-optionals',
    meta: {
      versionId: '1',
      lastUpdated: '2025-03-25T06:48:32.000+00:00',
    },
    code: {
      coding: [
        {
          code: 'test-code',
          display: 'Test Condition',
        },
      ],
      text: 'Test Condition',
    },
    subject: {
      reference: 'Patient/test-patient',
      type: 'Patient',
      display: 'Test Patient',
    },
  },
];

const mockConditionWithoutCoding: Condition[] = [
  {
    resourceType: 'Condition',
    id: 'condition-without-coding',
    meta: {
      versionId: '1',
      lastUpdated: '2025-03-25T06:48:32.000+00:00',
    },
    code: {
      text: 'Test Condition Without Coding',
    },
    subject: {
      reference: 'Patient/test-patient',
      type: 'Patient',
      display: 'Test Patient',
    },
    recordedDate: '2025-03-25T06:48:32.000+00:00',
  },
];

const mockValidConditions: Condition[] = [
  {
    resourceType: 'Condition',
    id: 'condition-active-diabetes',
    meta: {
      versionId: '1',
      lastUpdated: '2025-03-25T06:48:32.000+00:00',
    },
    clinicalStatus: {
      coding: [
        {
          system: 'http://terminology.hl7.org/CodeSystem/condition-clinical',
          code: 'active',
          display: 'Active',
        },
      ],
    },
    code: {
      coding: [
        {
          system: 'http://snomed.info/sct',
          code: '73211009',
          display: 'Diabetes mellitus',
        },
      ],
    },
    subject: {
      reference: 'Patient/test-patient',
      type: 'Patient',
      display: 'John Doe',
    },
    onsetDateTime: '2023-01-15T10:30:00.000+00:00',
    recordedDate: '2023-01-15T10:30:00.000+00:00',
    recorder: {
      reference: 'Practitioner/dr-smith',
      display: 'Dr. Smith',
    },
    note: [
      {
        text: 'Patient diagnosed with Type 2 diabetes',
      },
      {
        text: 'Requires regular blood sugar monitoring',
      },
    ],
  },
  {
    resourceType: 'Condition',
    id: 'condition-inactive-hypertension',
    meta: {
      versionId: '2',
      lastUpdated: '2025-03-20T14:22:15.000+00:00',
    },
    clinicalStatus: {
      coding: [
        {
          system: 'http://terminology.hl7.org/CodeSystem/condition-clinical',
          code: 'inactive',
          display: 'Inactive',
        },
      ],
    },
    code: {
      coding: [
        {
          system: 'http://snomed.info/sct',
        },
      ],
      text: 'High blood pressure',
    },
    subject: {
      reference: 'Patient/test-patient',
      type: 'Patient',
      display: 'John Doe',
    },
    onsetDateTime: '2022-06-10T08:15:00.000+00:00',
    recordedDate: '2022-06-10T08:15:00.000+00:00',
    recorder: {
      reference: 'Practitioner/dr-johnson',
      display: 'Dr. Johnson',
    },
  },
  {
    resourceType: 'Condition',
    id: 'condition-no-status',
    meta: {
      versionId: '1',
      lastUpdated: '2025-03-22T12:00:00.000+00:00',
    },
    code: {
      coding: [
        {
          system: 'http://snomed.info/sct',
          code: '195967001',
        },
      ],
    },
    subject: {
      reference: 'Patient/test-patient',
      type: 'Patient',
      display: 'John Doe',
    },
    recordedDate: '2025-03-22T12:00:00.000+00:00',
  },
];

describe('utils', () => {
  it('should convert valid FHIR Conditions array to Conditions View Model array', () => {
    expect(createConditionViewModels(mockValidConditions)).toStrictEqual([
      {
        code: '73211009',
        codeDisplay: 'Diabetes mellitus',
        display: 'Diabetes mellitus',
        id: 'condition-active-diabetes',
        note: [
          'Patient diagnosed with Type 2 diabetes',
          'Requires regular blood sugar monitoring',
        ],
        onsetDate: '2023-01-15T10:30:00.000+00:00',
        recordedDate: '2023-01-15T10:30:00.000+00:00',
        recorder: 'Dr. Smith',
        status: 'active',
      },
      {
        code: '',
        codeDisplay: '',
        display: 'High blood pressure',
        id: 'condition-inactive-hypertension',
        note: undefined,
        onsetDate: '2022-06-10T08:15:00.000+00:00',
        recordedDate: '2022-06-10T08:15:00.000+00:00',
        recorder: 'Dr. Johnson',
        status: 'inactive',
      },
      {
        code: '195967001',
        codeDisplay: '',
        display: '',
        id: 'condition-no-status',
        note: undefined,
        onsetDate: undefined,
        recordedDate: '2025-03-22T12:00:00.000+00:00',
        recorder: undefined,
        status: 'inactive',
      },
    ]);
  });

  it('should convert valid FHIR Conditions Status to Conditions View Model Status', () => {
    expect(createConditionViewModels(mockValidConditions)).toStrictEqual([
      {
        code: '73211009',
        codeDisplay: 'Diabetes mellitus',
        display: 'Diabetes mellitus',
        id: 'condition-active-diabetes',
        note: [
          'Patient diagnosed with Type 2 diabetes',
          'Requires regular blood sugar monitoring',
        ],
        onsetDate: '2023-01-15T10:30:00.000+00:00',
        recordedDate: '2023-01-15T10:30:00.000+00:00',
        recorder: 'Dr. Smith',
        status: 'active',
      },
      {
        code: '',
        codeDisplay: '',
        display: 'High blood pressure',
        id: 'condition-inactive-hypertension',
        note: undefined,
        onsetDate: '2022-06-10T08:15:00.000+00:00',
        recordedDate: '2022-06-10T08:15:00.000+00:00',
        recorder: 'Dr. Johnson',
        status: 'inactive',
      },
      {
        code: '195967001',
        codeDisplay: '',
        display: '',
        id: 'condition-no-status',
        note: undefined,
        onsetDate: undefined,
        recordedDate: '2025-03-22T12:00:00.000+00:00',
        recorder: undefined,
        status: 'inactive',
      },
    ]);
  });

  it('should throw error when a condition is missing required fields (id, code, recordedDate)', () => {
    expect(() =>
      createConditionViewModels(mockConditionsWithoutOptionalFields),
    ).toThrow('Missing required fields in condition data');
  });

  it('should throw error when a condition lacks coding information in the code field', () => {
    expect(() => createConditionViewModels(mockConditionWithoutCoding)).toThrow(
      'Missing required condition coding information',
    );
  });
});
