import type { ConsultationPad } from '../../../providers/clinicalConfig/models';
import { useServiceRequestStore } from '../../../stores';
import type { InputControl } from '../../forms';
import {
  captureUpdatedResources,
  getActiveEntries,
  loadEncounterInputControls,
} from '../utils';
import { makeMockEntry } from './__mocks__/indexMocks';
import { mockConsultationPadConfig } from './__mocks__/inputControlRegistryMocks';

const EXPECTED_KEYS = [
  'encounterDetails',
  'allergies',
  'investigations',
  'conditionsAndDiagnoses',
  'medications',
  'vaccinations',
  'immunizationHistory',
  'observationForms',
] as const;

const makeStub = (key: string, withBundleEntries = true) => ({
  key,
  component: () => null,
  reset: jest.fn(),
  validate: jest.fn().mockReturnValue(true),
  hasData: jest.fn().mockReturnValue(false),
  subscribe: jest.fn().mockReturnValue(jest.fn()),
  ...(withBundleEntries && {
    createBundleEntries: jest.fn().mockReturnValue([]),
  }),
});

const mockStubs = [
  makeStub('encounterDetails', false),
  makeStub('allergies'),
  makeStub('investigations'),
  makeStub('conditionsAndDiagnoses'),
  makeStub('medications'),
  makeStub('vaccinations'),
  makeStub('immunizationHistory'),
  makeStub('observationForms'),
];

jest.mock('../../../stores');
jest.mock('../../forms/registry', () => ({
  registerInputControl: jest.fn(),
  getRegisteredInputControls: jest.fn(() => mockStubs),
}));

beforeEach(() => {
  jest.clearAllMocks();
  (useServiceRequestStore as unknown as { getState: jest.Mock }).getState = jest
    .fn()
    .mockReturnValue({ selectedServiceRequests: new Map() });
});

describe('loadEncounterInputControls', () => {
  let registry: ReturnType<typeof loadEncounterInputControls>;

  beforeEach(() => {
    registry = loadEncounterInputControls(mockConsultationPadConfig);
  });

  it('contains the correct keys in order', () => {
    expect(registry.map((e) => e.key)).toEqual([...EXPECTED_KEYS]);
  });

  it.each(EXPECTED_KEYS)(
    '%s entry has required shape (component, reset, validate, hasData, subscribe)',
    (key) => {
      const entry = registry.find((e) => e.key === key)!;
      expect(entry.component).toBeDefined();
      expect(typeof entry.reset).toBe('function');
      expect(typeof entry.validate).toBe('function');
      expect(typeof entry.hasData).toBe('function');
      expect(typeof entry.subscribe).toBe('function');
    },
  );

  it.each<[string[]]>([[[]], [['Consultation']], [['Immunization', 'OPD']]])(
    'encounterDetails.encounterTypes is always undefined regardless of config value %j',
    (configuredEncounterTypes) => {
      const result = loadEncounterInputControls({
        ...mockConsultationPadConfig,
        inputControls: mockConsultationPadConfig.inputControls.map((c) =>
          c.type === 'encounterDetails'
            ? { ...c, encounterTypes: configuredEncounterTypes }
            : c,
        ),
      });
      expect(
        result.find((e) => e.key === 'encounterDetails')!.encounterTypes,
      ).toBeUndefined();
    },
  );

  it.each([
    'allergies',
    'investigations',
    'conditionsAndDiagnoses',
    'medications',
    'vaccinations',
    'observationForms',
  ] as const)(
    '%s is restricted to Consultation encounter type from config',
    (key) => {
      const entry = registry.find((e) => e.key === key)!;
      expect(entry.encounterTypes).toEqual(['Consultation']);
    },
  );

  it('encounterDetails has no createBundleEntries', () => {
    const entry = registry.find((e) => e.key === 'encounterDetails')!;
    expect(entry.createBundleEntries).toBeUndefined();
  });

  it.each([
    'allergies',
    'investigations',
    'conditionsAndDiagnoses',
    'medications',
    'vaccinations',
    'immunizationHistory',
    'observationForms',
  ] as const)('%s has createBundleEntries', (key) => {
    const entry = registry.find((e) => e.key === key)!;
    expect(typeof entry.createBundleEntries).toBe('function');
  });

  it.each([
    'encounterDetails',
    'allergies',
    'investigations',
    'conditionsAndDiagnoses',
    'medications',
    'vaccinations',
    'observationForms',
  ] as const)('%s has the correct privilege from config', (key) => {
    const expectedPrivilege = mockConsultationPadConfig.inputControls.find(
      (c) => c.type === key,
    )!.privileges;
    const entry = registry.find((e) => e.key === key)!;
    expect(entry.privilege).toEqual(expectedPrivilege);
  });

  it('sets privilege to undefined when privileges is empty', () => {
    const result = loadEncounterInputControls({
      ...mockConsultationPadConfig,
      inputControls: mockConsultationPadConfig.inputControls.map((c) =>
        c.type === 'allergies' ? { ...c, privileges: [] } : c,
      ),
    });
    expect(
      result.find((e) => e.key === 'allergies')!.privilege,
    ).toBeUndefined();
  });

  it('returns empty registry when config is undefined', () => {
    expect(loadEncounterInputControls(undefined)).toHaveLength(0);
  });

  it('returns entries in array order, with encounterDetails always first', () => {
    const findControl = (type: string) =>
      mockConsultationPadConfig.inputControls.find((c) => c.type === type)!;
    const reversedConfig: ConsultationPad = {
      allergyConceptMap: mockConsultationPadConfig.allergyConceptMap,
      inputControls: [
        findControl('observationForms'),
        findControl('immunizationHistory'),
        findControl('vaccinations'),
        findControl('medications'),
        findControl('conditionsAndDiagnoses'),
        findControl('investigations'),
        findControl('allergies'),
        findControl('encounterDetails'),
      ],
    };
    const result = loadEncounterInputControls(reversedConfig);
    expect(result.map((e) => e.key)).toEqual([
      'encounterDetails',
      'observationForms',
      'immunizationHistory',
      'vaccinations',
      'medications',
      'conditionsAndDiagnoses',
      'investigations',
      'allergies',
    ]);
  });

  it('skips inputControls items whose type has no matching registered control', () => {
    const result = loadEncounterInputControls({
      ...mockConsultationPadConfig,
      inputControls: [
        ...mockConsultationPadConfig.inputControls,
        {
          type: 'unknownForm',
          encounterTypes: [],
          privileges: [],
          attributes: [],
          metadata: {},
        },
      ],
    });
    expect(result).toHaveLength(EXPECTED_KEYS.length);
  });

  it('excludes entries not present in the inputControls array', () => {
    const result = loadEncounterInputControls({
      ...mockConsultationPadConfig,
      inputControls: mockConsultationPadConfig.inputControls.filter(
        (c) => c.type !== 'allergies' && c.type !== 'medications',
      ),
    });
    expect(result.find((e) => e.key === 'allergies')).toBeUndefined();
    expect(result.find((e) => e.key === 'medications')).toBeUndefined();
    expect(result.find((e) => e.key === 'investigations')).toBeDefined();
  });
});

describe('getActiveEntries', () => {
  let registry: ReturnType<typeof loadEncounterInputControls>;

  beforeEach(() => {
    registry = loadEncounterInputControls(mockConsultationPadConfig);
  });

  it('includes all entries for Consultation encounter type', () => {
    const result = getActiveEntries(registry, 'Consultation');

    const expected = registry.filter(
      (e) => !e.encounterTypes || e.encounterTypes.includes('Consultation'),
    );
    expect(result).toHaveLength(expected.length);
    expect(result.find((e) => e.key === 'immunizationHistory')).toBeUndefined();
  });

  it('excludes entries restricted to specific encounter types for non-matching type', () => {
    const result = getActiveEntries(registry, 'OPD');

    const unrestricted = registry.filter((e) => !e.encounterTypes);
    expect(result).toHaveLength(unrestricted.length);
    result.forEach((entry) => expect(entry.encounterTypes).toBeUndefined());
  });
});

describe('captureUpdatedResources', () => {
  it.each([
    [
      'conditions from conditionsAndDiagnoses',
      'conditionsAndDiagnoses',
      'conditions',
    ],
    ['allergies', 'allergies', 'allergies'],
    [
      'immunizations from immunizationHistory',
      'immunizationHistory',
      'immunizationHistory',
    ],
    [
      'immunizationAdministration',
      'immunizationAdministration',
      'immunizationHistory',
    ],
  ])('returns true for %s when hasData is true', (_label, key, resultKey) => {
    const entries = [
      makeMockEntry(key as InputControl['key'], {
        hasData: jest.fn().mockReturnValue(true),
      }),
    ];

    const result = captureUpdatedResources(entries);

    expect(result[resultKey as keyof typeof result]).toBe(true);
  });

  it('returns true for medications when medications hasData', () => {
    const entries = [
      makeMockEntry('medications', {
        hasData: jest.fn().mockReturnValue(true),
      }),
    ];

    expect(captureUpdatedResources(entries).medications).toBe(true);
  });

  it('returns true for medications when vaccinations hasData', () => {
    const entries = [
      makeMockEntry('vaccinations', {
        hasData: jest.fn().mockReturnValue(true),
      }),
    ];

    expect(captureUpdatedResources(entries).medications).toBe(true);
  });

  it('maps selected service request categories to lowercase boolean flags', () => {
    (useServiceRequestStore as unknown as { getState: jest.Mock }).getState =
      jest.fn().mockReturnValue({
        selectedServiceRequests: new Map([
          ['Blood Tests', []],
          ['URINE', []],
        ]),
      });

    const result = captureUpdatedResources([]);

    expect(result.serviceRequests).toEqual({
      'blood tests': true,
      urine: true,
    });
  });

  it('returns all false and empty serviceRequests when nothing has data', () => {
    const result = captureUpdatedResources([]);

    expect(result).toEqual({
      conditions: false,
      allergies: false,
      medications: false,
      immunizationHistory: false,
      serviceRequests: {},
    });
  });
});
