import { Condition } from 'fhir/r4';
import { createConditionViewModels } from '../utils';

jest.mock('i18next', () => ({
  t: jest.fn((key: string) => {
    const translations: { [key: string]: string } = {
      ERROR_CONDITION_MISSING_REQUIRED_FIELDS:
        'Missing required fields in condition data',
      ERROR_CONDITION_MISSING_CODING_INFORMATION:
        'Condition is missing display information',
    };
    return translations[key] || key;
  }),
}));

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

const mockNonCodedCondition: Condition[] = [
  {
    resourceType: 'Condition',
    id: 'condition-non-coded',
    meta: {
      versionId: '1',
      lastUpdated: '2026-04-09T14:48:10.000+00:00',
    },
    extension: [
      {
        url: 'http://fhir.openmrs.org/ext/non-coded-condition',
        valueString: 'Headache after eating',
      },
    ],
    clinicalStatus: {
      coding: [
        {
          system: 'http://terminology.hl7.org/CodeSystem/condition-clinical',
          code: 'active',
        },
      ],
    },
    category: [
      {
        coding: [
          {
            system: 'http://terminology.hl7.org/CodeSystem/condition-category',
            code: 'problem-list-item',
          },
        ],
      },
    ],
    subject: {
      reference: 'Patient/test-patient',
      type: 'Patient',
      display: 'James Nam',
    },
    onsetDateTime: '2026-03-31T18:30:00+00:00',
    recordedDate: '2026-04-09T14:48:10+00:00',
    recorder: {
      reference: 'Practitioner/dr-smith',
      type: 'Practitioner',
      display: 'Super Man',
    },
  },
];

const mockMixedConditions: Condition[] = [
  ...mockValidConditions.slice(0, 1),
  ...mockNonCodedCondition,
];

const mockConditionWithoutId: Condition[] = [
  {
    resourceType: 'Condition',
    code: {
      coding: [
        {
          code: 'test-code',
          display: 'Test Condition',
        },
      ],
    },
    subject: {
      reference: 'Patient/test-patient',
      type: 'Patient',
      display: 'Test Patient',
    },
  },
];

const mockConditionWithNeitherCodedNorNonCoded: Condition[] = [
  {
    resourceType: 'Condition',
    id: 'condition-no-display',
    subject: {
      reference: 'Patient/test-patient',
      type: 'Patient',
      display: 'Test Patient',
    },
    recordedDate: '2025-03-25T06:48:32.000+00:00',
  },
];

describe('createConditionViewModels', () => {
  it('should convert valid coded FHIR conditions to view models', () => {
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

  it('should map clinical status correctly', () => {
    const result = createConditionViewModels(mockValidConditions);

    expect(result[0].status).toBe('active');
    expect(result[1].status).toBe('inactive');
    expect(result[2].status).toBe('inactive');
  });

  it('should convert non-coded conditions using extension valueString', () => {
    const result = createConditionViewModels(mockNonCodedCondition);

    expect(result).toHaveLength(1);
    expect(result[0]).toStrictEqual({
      id: 'condition-non-coded',
      display: 'Headache after eating',
      status: 'active',
      onsetDate: '2026-03-31T18:30:00+00:00',
      recordedDate: '2026-04-09T14:48:10+00:00',
      recorder: 'Super Man',
      code: '',
      codeDisplay: 'Headache after eating',
      note: undefined,
    });
  });

  it('should handle a mix of coded and non-coded conditions', () => {
    const result = createConditionViewModels(mockMixedConditions);

    expect(result).toHaveLength(2);
    expect(result[0].display).toBe('Diabetes mellitus');
    expect(result[1].display).toBe('Headache after eating');
  });

  it('should throw error when a condition is missing id', () => {
    expect(() => createConditionViewModels(mockConditionWithoutId)).toThrow(
      'Missing required fields in condition data',
    );
  });

  it('should throw error when condition has neither coded nor non-coded display', () => {
    expect(() =>
      createConditionViewModels(mockConditionWithNeitherCodedNorNonCoded),
    ).toThrow('Condition is missing display information');
  });

  it('should return empty array for empty input', () => {
    expect(createConditionViewModels([])).toStrictEqual([]);
  });
});
