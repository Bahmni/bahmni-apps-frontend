import type { ConsultationPad } from '../../../providers/clinicalConfig/models';
import {
  useServiceRequestStore,
  useObservationFormsStore,
} from '../../../stores';
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
  'medication',
  'vaccination',
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
  makeStub('medication'),
  makeStub('vaccination'),
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
  (useObservationFormsStore as unknown as { getState: jest.Mock }).getState =
    jest.fn().mockReturnValue({
      getObservationFormsData: jest.fn().mockReturnValue([]),
    });
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
    'medication',
    'vaccination',
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
    'medication',
    'vaccination',
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
    'medication',
    'vaccination',
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
        findControl('vaccination'),
        findControl('medication'),
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
      'vaccination',
      'medication',
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
        (c) => c.type !== 'allergies' && c.type !== 'medication',
      ),
    });
    expect(result.find((e) => e.key === 'allergies')).toBeUndefined();
    expect(result.find((e) => e.key === 'medication')).toBeUndefined();
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

  it('returns only allergies + encounterDetails when editOnlyKey is "allergies"', () => {
    const result = getActiveEntries(registry, 'Consultation', 'allergies');

    expect(result.map((e) => e.key)).toEqual(
      expect.arrayContaining(['encounterDetails', 'allergies']),
    );
    expect(result).toHaveLength(2);
    expect(result.find((e) => e.key === 'medication')).toBeUndefined();
    expect(result.find((e) => e.key === 'investigations')).toBeUndefined();
  });

  it('returns all matching entries (existing behaviour) when editOnlyKey is undefined', () => {
    const withoutEditOnly = getActiveEntries(
      registry,
      'Consultation',
      undefined,
    );
    const withoutArg = getActiveEntries(registry, 'Consultation');

    expect(withoutEditOnly).toEqual(withoutArg);
    expect(withoutEditOnly.length).toBeGreaterThan(2);
  });

  it('returns only encounterDetails when editOnlyKey does not match any entry key', () => {
    const result = getActiveEntries(registry, 'Consultation', 'nonExistentKey');

    expect(result).toHaveLength(1);
    expect(result[0].key).toBe('encounterDetails');
  });

  it('encounterDetails always passes the editOnlyKey filter when editOnlyKey is set', () => {
    const result = getActiveEntries(registry, 'Consultation', 'medication');

    const encounterDetailsEntry = result.find(
      (e) => e.key === 'encounterDetails',
    );
    expect(encounterDetailsEntry).toBeDefined();
    expect(result.find((e) => e.key === 'medication')).toBeDefined();
    expect(result).toHaveLength(2);
  });

  it('excludes onActionTriggered controls from normal consultation', () => {
    const registryWithTriggered = [
      ...registry,
      {
        key: 'stopMedications',
        onActionTriggered: true,
        component: () => null,
        reset: jest.fn(),
        validate: jest.fn().mockReturnValue(true),
        hasData: jest.fn().mockReturnValue(false),
        subscribe: jest.fn().mockReturnValue(jest.fn()),
      },
    ];
    const result = getActiveEntries(registryWithTriggered, 'Consultation');
    expect(result.find((e) => e.key === 'stopMedications')).toBeUndefined();
  });

  it('includes onActionTriggered control when it is the editOnly target', () => {
    const registryWithTriggered = [
      ...registry,
      {
        key: 'stopMedications',
        onActionTriggered: true,
        component: () => null,
        reset: jest.fn(),
        validate: jest.fn().mockReturnValue(true),
        hasData: jest.fn().mockReturnValue(false),
        subscribe: jest.fn().mockReturnValue(jest.fn()),
      },
    ];
    const result = getActiveEntries(
      registryWithTriggered,
      'Consultation',
      'stopMedications',
    );
    expect(result.find((e) => e.key === 'stopMedications')).toBeDefined();
    expect(result).toHaveLength(2); // stopMedications + encounterDetails
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
    ['immunizationWaiver', 'immunizationWaiver', 'immunizationHistory'],
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
      makeMockEntry('medication', {
        hasData: jest.fn().mockReturnValue(true),
      }),
    ];

    expect(captureUpdatedResources(entries).medications).toBe(true);
  });

  it('returns true for medications when vaccinations hasData', () => {
    const entries = [
      makeMockEntry('vaccination', {
        hasData: jest.fn().mockReturnValue(true),
      }),
    ];

    expect(captureUpdatedResources(entries).medications).toBe(true);
  });

  it('returns true for medications when stopMedications hasData', () => {
    const entries = [
      makeMockEntry('stopMedications', {
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
      observationFormsWithBasedOn: false,
      serviceRequests: {},
    });
  });
});
