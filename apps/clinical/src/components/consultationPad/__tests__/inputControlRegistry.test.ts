import type { ConsultationPad } from '../../../providers/clinicalConfig/models';
import * as consultationBundleService from '../../../services/consultationBundleService';
import { loadEncounterInputControls } from '../inputControlRegistry';
import type { EncounterContext } from '../models';
import { mockConsultationPadConfig } from './__mocks__/inputControlRegistryMocks';

const mockBundleContext: EncounterContext = {
  encounterSubject: { reference: 'Patient/patient-uuid' },
  encounterReference: 'urn:uuid:encounter-ref',
  practitionerUUID: 'practitioner-uuid',
  consultationDate: new Date('2024-01-15'),
};

const mockReset = jest.fn();
const mockSubscribe = jest.fn().mockReturnValue(jest.fn());
const mockValidateAllAllergies = jest.fn().mockReturnValue(true);
const mockValidateAllMedications = jest.fn().mockReturnValue(true);
const mockValidateAllVaccinations = jest.fn().mockReturnValue(true);
const mockValidateConditions = jest.fn().mockReturnValue(true);
const mockObsFormsValidate = jest.fn().mockReturnValue(true);
const mockGetObservationFormsData = jest.fn().mockReturnValue({});

jest.mock('../../../stores', () => ({
  useEncounterDetailsStore: Object.assign(jest.fn(), {
    getState: () => ({ reset: mockReset, isEncounterDetailsFormReady: true }),
    subscribe: (cb: () => void) => mockSubscribe(cb),
  }),
  useAllergyStore: Object.assign(jest.fn(), {
    getState: () => ({
      reset: mockReset,
      validateAllAllergies: mockValidateAllAllergies,
      selectedAllergies: [],
    }),
    subscribe: (cb: () => void) => mockSubscribe(cb),
  }),
  useConditionsAndDiagnosesStore: Object.assign(jest.fn(), {
    getState: () => ({
      reset: mockReset,
      validate: mockValidateConditions,
      selectedDiagnoses: [],
      selectedConditions: [],
    }),
    subscribe: (cb: () => void) => mockSubscribe(cb),
  }),
  useMedicationStore: Object.assign(jest.fn(), {
    getState: () => ({
      reset: mockReset,
      validateAllMedications: mockValidateAllMedications,
      selectedMedications: [],
    }),
    subscribe: (cb: () => void) => mockSubscribe(cb),
  }),
  useServiceRequestStore: Object.assign(jest.fn(), {
    getState: () => ({ reset: mockReset, selectedServiceRequests: new Map() }),
    subscribe: (cb: () => void) => mockSubscribe(cb),
  }),
  useVaccinationStore: Object.assign(jest.fn(), {
    getState: () => ({
      reset: mockReset,
      validateAllVaccinations: mockValidateAllVaccinations,
      selectedVaccinations: [],
    }),
    subscribe: (cb: () => void) => mockSubscribe(cb),
  }),
}));

jest.mock('../../../stores/observationFormsStore', () => ({
  useObservationFormsStore: Object.assign(jest.fn(), {
    getState: () => ({
      reset: mockReset,
      validate: mockObsFormsValidate,
      selectedForms: [],
      getObservationFormsData: mockGetObservationFormsData,
    }),
    subscribe: (cb: () => void) => mockSubscribe(cb),
  }),
}));

jest.mock('../../../services/consultationBundleService', () => ({
  createAllergiesBundleEntries: jest.fn().mockReturnValue([]),
  createConditionsBundleEntries: jest.fn().mockReturnValue([]),
  createDiagnosisBundleEntries: jest.fn().mockReturnValue([]),
  createMedicationRequestEntries: jest.fn().mockReturnValue([]),
  createObservationBundleEntries: jest.fn().mockReturnValue([]),
  createServiceRequestBundleEntries: jest.fn().mockReturnValue([]),
}));

jest.mock('../../forms', () => ({
  AllergiesForm: () => null,
  ConditionsAndDiagnoses: () => null,
  EncounterDetails: () => null,
  InvestigationsForm: () => null,
  MedicationsForm: () => null,
  VaccinationForm: () => null,
}));

jest.mock('../components/ObservationFormsPanel', () => ({
  __esModule: true,
  default: () => null,
}));

describe('loadEncounterInputControls', () => {
  const EXPECTED_KEYS = [
    'encounterDetails',
    'allergies',
    'investigations',
    'conditionsAndDiagnoses',
    'medications',
    'vaccinations',
    'observationForms',
  ] as const;

  let registry: ReturnType<typeof loadEncounterInputControls>;

  beforeEach(() => {
    jest.clearAllMocks();
    registry = loadEncounterInputControls(mockConsultationPadConfig);
  });

  it('contains 7 entries with the correct keys in order', () => {
    expect(registry).toHaveLength(7);
    expect(registry.map((e) => e.key)).toEqual(EXPECTED_KEYS);
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
        encounterDetails: {
          ...mockConsultationPadConfig.encounterDetails,
          encounterTypes: configuredEncounterTypes,
        },
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
    'observationForms',
  ] as const)('%s has createBundleEntries', (key) => {
    const entry = registry.find((e) => e.key === key)!;
    expect(typeof entry.createBundleEntries).toBe('function');
  });

  it.each([
    [
      'encounterDetails',
      mockConsultationPadConfig.encounterDetails!.privileges,
    ],
    ['allergies', mockConsultationPadConfig.allergies!.privileges],
    ['investigations', mockConsultationPadConfig.investigations!.privileges],
    [
      'conditionsAndDiagnoses',
      mockConsultationPadConfig.conditionsAndDiagnoses!.privileges,
    ],
    ['medications', mockConsultationPadConfig.medications!.privileges],
    ['vaccinations', mockConsultationPadConfig.vaccinations!.privileges],
    [
      'observationForms',
      mockConsultationPadConfig.observationForms!.privileges,
    ],
  ] as const)(
    '%s has the correct privilege from config',
    (key, expectedPrivilege) => {
      const entry = registry.find((e) => e.key === key)!;
      expect(entry.privilege).toEqual(expectedPrivilege);
    },
  );

  it('returns empty registry when config is undefined', () => {
    expect(loadEncounterInputControls(undefined)).toHaveLength(0);
  });

  it('excludes entries whose config key is absent', () => {
    const result = loadEncounterInputControls({
      ...mockConsultationPadConfig,
      allergies: undefined,
      medications: undefined,
    } as ConsultationPad);
    expect(result.find((e) => e.key === 'allergies')).toBeUndefined();
    expect(result.find((e) => e.key === 'medications')).toBeUndefined();
    expect(result.find((e) => e.key === 'investigations')).toBeDefined();
  });

  it('encounterDetails.hasData always returns false', () => {
    expect(registry.find((e) => e.key === 'encounterDetails')!.hasData()).toBe(
      false,
    );
  });

  it('investigations.validate always returns true', () => {
    expect(registry.find((e) => e.key === 'investigations')!.validate()).toBe(
      true,
    );
  });

  describe('store delegation', () => {
    beforeEach(() => jest.clearAllMocks());

    it.each([
      'encounterDetails',
      'allergies',
      'investigations',
      'conditionsAndDiagnoses',
      'medications',
      'vaccinations',
      'observationForms',
    ] as const)('%s.reset delegates to store reset', (key) => {
      registry.find((e) => e.key === key)!.reset();
      expect(mockReset).toHaveBeenCalledTimes(1);
    });

    it('encounterDetails.validate returns isEncounterDetailsFormReady from store', () => {
      expect(
        registry.find((e) => e.key === 'encounterDetails')!.validate(),
      ).toBe(true);
    });

    it.each([
      ['allergies', mockValidateAllAllergies],
      ['medications', mockValidateAllMedications],
      ['vaccinations', mockValidateAllVaccinations],
      ['conditionsAndDiagnoses', mockValidateConditions],
    ] as const)('%s.validate delegates to store', (key, mockFn) => {
      registry.find((e) => e.key === key)!.validate();
      expect(mockFn).toHaveBeenCalledTimes(1);
    });

    it('observationForms.validate delegates to observationFormsStore.validate', () => {
      registry.find((e) => e.key === 'observationForms')!.validate();
      expect(mockObsFormsValidate).toHaveBeenCalledTimes(1);
    });

    it.each([
      'allergies',
      'medications',
      'vaccinations',
      'investigations',
      'conditionsAndDiagnoses',
      'observationForms',
    ] as const)('%s.hasData returns false when store has no data', (key) => {
      expect(registry.find((e) => e.key === key)!.hasData()).toBe(false);
    });

    it.each(EXPECTED_KEYS)(
      '%s.subscribe delegates to store subscribe',
      (key) => {
        const cb = jest.fn();
        registry.find((e) => e.key === key)!.subscribe(cb);
        expect(mockSubscribe).toHaveBeenCalledWith(cb);
      },
    );
  });

  describe('createBundleEntries', () => {
    beforeEach(() => jest.clearAllMocks());

    it.each([
      ['allergies', 'createAllergiesBundleEntries'],
      ['investigations', 'createServiceRequestBundleEntries'],
      ['medications', 'createMedicationRequestEntries'],
      ['vaccinations', 'createMedicationRequestEntries'],
    ] as const)('%s delegates to %s', (key, serviceFn) => {
      registry.find((e) => e.key === key)!.createBundleEntries!(
        mockBundleContext,
      );
      expect(
        jest.mocked(consultationBundleService[serviceFn]),
      ).toHaveBeenCalledWith(
        expect.objectContaining({
          encounterSubject: mockBundleContext.encounterSubject,
        }),
      );
    });

    it('conditionsAndDiagnoses delegates to createDiagnosisBundleEntries and createConditionsBundleEntries', () => {
      registry.find((e) => e.key === 'conditionsAndDiagnoses')!
        .createBundleEntries!(mockBundleContext);
      expect(
        jest.mocked(consultationBundleService.createDiagnosisBundleEntries),
      ).toHaveBeenCalled();
      expect(
        jest.mocked(consultationBundleService.createConditionsBundleEntries),
      ).toHaveBeenCalled();
    });

    it('observationForms delegates to createObservationBundleEntries', () => {
      registry.find((e) => e.key === 'observationForms')!.createBundleEntries!(
        mockBundleContext,
      );
      expect(
        jest.mocked(consultationBundleService.createObservationBundleEntries),
      ).toHaveBeenCalledWith(
        expect.objectContaining({
          encounterSubject: mockBundleContext.encounterSubject,
        }),
      );
    });
  });
});
