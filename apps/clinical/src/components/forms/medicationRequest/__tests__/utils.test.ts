import { generateUUID, resolveComboBoxItems } from '@bahmni/services';
import { MedicationRequest } from 'fhir/r4';
import {
  applyDefaultDosageUnit,
  applyDefaultDurationUnit,
  applyDefaultFrequency,
  applyDefaultInstruction,
  applyDefaultRoute,
  applyMountDefaults,
  createMedicationRequestEntries,
  getDefaultDosingUnit,
  getDefaultRoute,
  getMedicationRequestComboBoxItems,
} from '../utils';
import {
  mockEmptyMedicationEntry,
  mockEncounterReference,
  mockEncounterSubject,
  mockMedication,
  mockMedicationConfig,
  mockMedicationConfigWithDrugFormDefaults,
  mockMedicationEntry,
  mockMedicationWithForm,
  mockPractitionerUUID,
  mockSelectedMedication,
} from './__mocks__/MedicationRequestFormMocks';

const mockUUID = '1d87ab20-8b86-4b41-a30d-984b2208d945';

jest.mock('@bahmni/services', () => ({
  ...jest.requireActual('@bahmni/services'),
  resolveComboBoxItems: jest.fn(),
  generateUUID: jest.fn(() => mockUUID),
}));

jest.mock('../../../../services/medicationService', () => ({
  getMedicationDisplay: jest.fn((m) => m?.code?.text ?? 'Unknown'),
}));

const mockGenerateUUID = generateUUID as jest.Mock;

describe('applyDefaultFrequency', () => {
  it('applies default frequency when none is set and default matches a non-immediate frequency', () => {
    const updateFrequency = jest.fn();
    applyDefaultFrequency(
      [{ name: 'frequency', default: 'BD' }],
      mockMedicationConfig,
      null,
      'id',
      updateFrequency,
    );
    expect(updateFrequency).toHaveBeenCalledWith('id', {
      uuid: 'bd-uuid',
      name: 'BD',
      frequencyPerDay: 2,
    });
  });

  it('does nothing when frequency is already set', () => {
    const updateFrequency = jest.fn();
    applyDefaultFrequency(
      [{ name: 'frequency', default: 'BD' }],
      mockMedicationConfig,
      { uuid: 'bd-uuid', name: 'BD', frequencyPerDay: 2 },
      'id',
      updateFrequency,
    );
    expect(updateFrequency).not.toHaveBeenCalled();
  });

  it('does nothing when no default configured on the attribute', () => {
    const updateFrequency = jest.fn();
    applyDefaultFrequency(
      [{ name: 'frequency' }],
      mockMedicationConfig,
      null,
      'id',
      updateFrequency,
    );
    expect(updateFrequency).not.toHaveBeenCalled();
  });

  it('applies default frequency when default matches an immediate frequency', () => {
    const updateFrequency = jest.fn();
    applyDefaultFrequency(
      [{ name: 'frequency', default: 'Immediately' }],
      mockMedicationConfig,
      null,
      'id',
      updateFrequency,
    );
    expect(updateFrequency).toHaveBeenCalledWith('id', {
      uuid: '0',
      name: 'Immediately',
      frequencyPerDay: 1,
    });
  });
});

describe('applyDefaultInstruction', () => {
  it('applies default when instruction is null and default name matches', () => {
    const updateInstruction = jest.fn();
    applyDefaultInstruction(
      [{ name: 'instruction', default: 'Before Food' }],
      mockMedicationConfig,
      null,
      'id',
      updateInstruction,
    );
    expect(updateInstruction).toHaveBeenCalledWith('id', {
      uuid: 'before-food-uuid',
      name: 'Before Food',
    });
  });

  it.each([
    [
      'does nothing when instruction is already set',
      { uuid: 'before-food-uuid', name: 'Before Food' },
      [{ name: 'instruction', default: 'Before Food' }],
    ],
    [
      'does nothing when no default configured',
      null,
      [{ name: 'instruction' }],
    ],
    [
      'does nothing when default name does not match any instruction',
      null,
      [{ name: 'instruction', default: 'With Dinner' }],
    ],
  ])('%s', (_, instruction, attrs) => {
    const updateInstruction = jest.fn();
    applyDefaultInstruction(
      attrs,
      mockMedicationConfig,
      instruction,
      'id',
      updateInstruction,
    );
    expect(updateInstruction).not.toHaveBeenCalled();
  });
});

describe('applyDefaultDurationUnit', () => {
  it('applies default when durationUnit is null and default code matches', () => {
    const updateDurationUnit = jest.fn();
    applyDefaultDurationUnit(
      [{ name: 'durationUnit', default: 'd' }],
      null,
      'id',
      updateDurationUnit,
    );
    expect(updateDurationUnit).toHaveBeenCalledWith('id', {
      code: 'd',
      display: 'DURATION_UNIT_DAYS',
      daysMultiplier: 1,
    });
  });

  it.each([
    [
      'does nothing when durationUnit is already set',
      { code: 'd', display: 'DURATION_UNIT_DAYS', daysMultiplier: 1 },
      [{ name: 'durationUnit', default: 'd' }],
    ],
    [
      'does nothing when no default configured',
      null,
      [{ name: 'durationUnit' }],
    ],
    [
      'does nothing when default code does not match any option',
      null,
      [{ name: 'durationUnit', default: 'invalid' }],
    ],
  ])('%s', (_, durationUnit, attrs) => {
    const updateDurationUnit = jest.fn();
    applyDefaultDurationUnit(attrs, durationUnit, 'id', updateDurationUnit);
    expect(updateDurationUnit).not.toHaveBeenCalled();
  });
});

describe('applyDefaultDosageUnit', () => {
  const drugFormDefaults = { Tablet: { doseUnits: 'mg' } };

  it('applies attribute default when dosageUnit is null and name matches a doseUnit', () => {
    const updateDosageUnit = jest.fn();
    const updateDispenseUnit = jest.fn();
    applyDefaultDosageUnit(
      [{ name: 'dosageUnit', default: 'ml' }],
      null,
      mockMedication,
      undefined,
      mockMedicationConfig.doseUnits,
      'id',
      updateDosageUnit,
      updateDispenseUnit,
    );
    expect(updateDosageUnit).toHaveBeenCalledWith('id', {
      uuid: 'ml-uuid',
      name: 'ml',
    });
    expect(updateDispenseUnit).toHaveBeenCalledWith('id', {
      uuid: 'ml-uuid',
      name: 'ml',
    });
  });

  it('falls back to drugFormDefaults when no attribute default is configured', () => {
    const updateDosageUnit = jest.fn();
    const updateDispenseUnit = jest.fn();
    applyDefaultDosageUnit(
      [{ name: 'dosageUnit' }],
      null,
      mockMedicationWithForm,
      drugFormDefaults,
      mockMedicationConfig.doseUnits,
      'id',
      updateDosageUnit,
      updateDispenseUnit,
    );
    expect(updateDosageUnit).toHaveBeenCalledWith('id', {
      uuid: 'mg-uuid',
      name: 'mg',
    });
    expect(updateDispenseUnit).toHaveBeenCalledWith('id', {
      uuid: 'mg-uuid',
      name: 'mg',
    });
  });

  it.each([
    [
      'does nothing when dosageUnit is already set',
      { uuid: 'mg-uuid', name: 'mg' },
      [{ name: 'dosageUnit', default: 'ml' }],
    ],
    [
      'does nothing when attribute default does not match and no drugFormDefaults',
      null,
      [{ name: 'dosageUnit', default: 'g' }],
    ],
  ])('%s', (_, dosageUnit, attrs) => {
    const updateDosageUnit = jest.fn();
    const updateDispenseUnit = jest.fn();
    applyDefaultDosageUnit(
      attrs,
      dosageUnit as ReturnType<typeof jest.fn>,
      mockMedication,
      undefined,
      mockMedicationConfig.doseUnits,
      'id',
      updateDosageUnit,
      updateDispenseUnit,
    );
    expect(updateDosageUnit).not.toHaveBeenCalled();
    expect(updateDispenseUnit).not.toHaveBeenCalled();
  });
});

describe('applyDefaultRoute', () => {
  const drugFormDefaults = { Tablet: { route: 'Oral' } };

  it('applies attribute default when route is null and name matches a route', () => {
    const updateRoute = jest.fn();
    applyDefaultRoute(
      [{ name: 'route', default: 'IV' }],
      null,
      mockMedication,
      undefined,
      mockMedicationConfig.routes,
      'id',
      updateRoute,
    );
    expect(updateRoute).toHaveBeenCalledWith('id', {
      uuid: 'iv-uuid',
      name: 'IV',
    });
  });

  it('falls back to drugFormDefaults when no attribute default is configured', () => {
    const updateRoute = jest.fn();
    applyDefaultRoute(
      [{ name: 'route' }],
      null,
      mockMedicationWithForm,
      drugFormDefaults,
      mockMedicationConfig.routes,
      'id',
      updateRoute,
    );
    expect(updateRoute).toHaveBeenCalledWith('id', {
      uuid: 'oral-uuid',
      name: 'Oral',
    });
  });

  it.each([
    [
      'does nothing when route is already set',
      { uuid: 'oral-uuid', name: 'Oral' },
      [{ name: 'route', default: 'IV' }],
    ],
    [
      'does nothing when attribute default does not match and no drugFormDefaults',
      null,
      [{ name: 'route', default: 'Unknown' }],
    ],
  ])('%s', (_, route, attrs) => {
    const updateRoute = jest.fn();
    applyDefaultRoute(
      attrs,
      route as ReturnType<typeof jest.fn>,
      mockMedication,
      undefined,
      mockMedicationConfig.routes,
      'id',
      updateRoute,
    );
    expect(updateRoute).not.toHaveBeenCalled();
  });
});

describe('applyMountDefaults', () => {
  const makeUpdaters = () => ({
    updateDosageUnit: jest.fn(),
    updateDispenseUnit: jest.fn(),
    updateFrequency: jest.fn(),
    updateDurationUnit: jest.fn(),
    updateInstruction: jest.fn(),
    updateRoute: jest.fn(),
  });

  const fullAttributes = [
    { name: 'dosage', default: 5 },
    { name: 'dosageUnit', default: 'mg' },
    { name: 'stat', default: true },
    { name: 'prn', default: true },
    { name: 'frequency', default: 'BD' },
    { name: 'duration', default: 7 },
    { name: 'durationUnit', default: 'd' },
    { name: 'instruction', default: 'Before Food' },
    { name: 'route', default: 'Oral' },
    { name: 'note', default: 'Take with water' },
  ];

  it('applies dosageUnit, frequency, durationUnit, instruction, and route defaults when entry is empty', () => {
    const updaters = makeUpdaters();
    applyMountDefaults({
      attributes: fullAttributes,
      medicationConfig: mockMedicationConfig,
      entry: mockEmptyMedicationEntry,
      ...updaters,
    });
    expect(updaters.updateDosageUnit).toHaveBeenCalledWith('med-empty', {
      uuid: 'mg-uuid',
      name: 'mg',
    });
    expect(updaters.updateDispenseUnit).toHaveBeenCalledWith('med-empty', {
      uuid: 'mg-uuid',
      name: 'mg',
    });
    expect(updaters.updateFrequency).toHaveBeenCalledWith('med-empty', {
      uuid: 'bd-uuid',
      name: 'BD',
      frequencyPerDay: 2,
    });
    expect(updaters.updateDurationUnit).toHaveBeenCalledWith('med-empty', {
      code: 'd',
      display: 'DURATION_UNIT_DAYS',
      daysMultiplier: 1,
    });
    expect(updaters.updateInstruction).toHaveBeenCalledWith('med-empty', {
      uuid: 'before-food-uuid',
      name: 'Before Food',
    });
    expect(updaters.updateRoute).toHaveBeenCalledWith('med-empty', {
      uuid: 'oral-uuid',
      name: 'Oral',
    });
  });

  it('does not override fields that are already set', () => {
    const updaters = makeUpdaters();
    const entryWithAllSet = {
      ...mockSelectedMedication,
      instruction: { uuid: 'before-food-uuid', name: 'Before Food' },
    };
    applyMountDefaults({
      attributes: fullAttributes,
      medicationConfig: mockMedicationConfig,
      entry: entryWithAllSet,
      ...updaters,
    });
    expect(updaters.updateDosageUnit).not.toHaveBeenCalled();
    expect(updaters.updateFrequency).not.toHaveBeenCalled();
    expect(updaters.updateDurationUnit).not.toHaveBeenCalled();
    expect(updaters.updateInstruction).not.toHaveBeenCalled();
    expect(updaters.updateRoute).not.toHaveBeenCalled();
  });

  it('uses drugFormDefaults fallback for dosageUnit and route when attribute default is not configured', () => {
    const updaters = makeUpdaters();
    applyMountDefaults({
      attributes: [{ name: 'dosageUnit' }, { name: 'route' }],
      medicationConfig: mockMedicationConfigWithDrugFormDefaults,
      entry: mockEmptyMedicationEntry,
      ...updaters,
    });
    expect(updaters.updateDosageUnit).toHaveBeenCalledWith('med-empty', {
      uuid: 'mg-uuid',
      name: 'mg',
    });
    expect(updaters.updateDispenseUnit).toHaveBeenCalledWith('med-empty', {
      uuid: 'mg-uuid',
      name: 'mg',
    });
    expect(updaters.updateRoute).toHaveBeenCalledWith('med-empty', {
      uuid: 'oral-uuid',
      name: 'Oral',
    });
  });
});

describe('getDefaultRoute', () => {
  const drugFormDefaults = { Tablet: { route: 'Oral' } };

  it('returns the matching route when medication form maps to a configured route', () => {
    const result = getDefaultRoute(
      mockMedicationWithForm,
      drugFormDefaults,
      mockMedicationConfig.routes,
    );
    expect(result).toEqual({ uuid: 'oral-uuid', name: 'Oral' });
  });

  it.each([
    [
      'returns undefined when medication has no form',
      mockMedication,
      drugFormDefaults,
    ],
    [
      'returns undefined when no route configured for the drug form',
      mockMedicationWithForm,
      { Tablet: {} },
    ],
    [
      'returns undefined when route name does not match any route',
      mockMedicationWithForm,
      { Tablet: { route: 'IM' } },
    ],
  ])('%s', (_, medication, defaults) => {
    const result = getDefaultRoute(
      medication,
      defaults,
      mockMedicationConfig.routes,
    );
    expect(result).toBeUndefined();
  });
});

describe('getDefaultDosingUnit', () => {
  const drugFormDefaults = { Tablet: { doseUnits: 'mg' } };

  it('returns the matching dose unit when medication form maps to a configured dose unit', () => {
    const result = getDefaultDosingUnit(
      mockMedicationWithForm,
      drugFormDefaults,
      mockMedicationConfig.doseUnits,
    );
    expect(result).toEqual({ uuid: 'mg-uuid', name: 'mg' });
  });

  it.each([
    [
      'returns undefined when medication has no form',
      mockMedication,
      drugFormDefaults,
    ],
    [
      'returns undefined when no doseUnits configured for the drug form',
      mockMedicationWithForm,
      { Tablet: {} },
    ],
    [
      'returns undefined when dose unit name does not match any unit',
      mockMedicationWithForm,
      { Tablet: { doseUnits: 'g' } },
    ],
  ])('%s', (_, medication, defaults) => {
    const result = getDefaultDosingUnit(
      medication,
      defaults,
      mockMedicationConfig.doseUnits,
    );
    expect(result).toBeUndefined();
  });
});

describe('getMedicationRequestComboBoxItems', () => {
  const messages = { loading: 'Loading', error: 'Error', empty: 'Empty' };
  const mockResolveComboBoxItems = jest.mocked(resolveComboBoxItems);

  beforeEach(() => {
    mockResolveComboBoxItems.mockReturnValue([]);
  });

  it('passes empty array to resolveComboBoxItems when medicationResults is undefined', () => {
    getMedicationRequestComboBoxItems(
      'test',
      undefined,
      false,
      false,
      messages,
    );
    expect(mockResolveComboBoxItems).toHaveBeenCalledWith(
      false,
      false,
      [],
      expect.any(Function),
      messages,
    );
  });
});

describe('createMedicationRequestEntries', () => {
  const mockCreateParams = {
    encounterSubject: mockEncounterSubject,
    encounterReference: mockEncounterReference,
    practitionerUUID: mockPractitionerUUID,
  };

  afterAll(() => {
    jest.resetAllMocks();
  });

  it('should create bundle entries with correct structure', () => {
    const result = createMedicationRequestEntries({
      selectedMedicationRequests: [mockMedicationEntry],
      ...mockCreateParams,
    });

    expect(result).toHaveLength(1);
    expect(result[0].fullUrl).toBe(`urn:uuid:uuid-med-123`);
    expect(result[0].resource).toMatchObject({
      resourceType: 'MedicationRequest',
      status: 'active',
      intent: 'order',
      medicationReference: {
        reference: 'Medication/med-123',
        type: 'Medication',
      },
      subject: mockEncounterSubject,
      encounter: { reference: mockEncounterReference },
      requester: {
        reference: `Practitioner/${mockPractitionerUUID}`,
        type: 'Practitioner',
      },
      priority: 'routine',
      dosageInstruction: [{ text: '{}', asNeededBoolean: false }],
      dispenseRequest: {
        numberOfRepeatsAllowed: 0,
        quantity: { value: 14, code: undefined },
      },
    });
    expect(result[0].request).toEqual({
      method: 'POST',
      url: 'MedicationRequest',
    });
  });

  it('should create multiple bundle entries for multiple medications', () => {
    const medications = [
      mockMedicationEntry,
      { ...mockMedicationEntry, id: 'med-456' },
      { ...mockMedicationEntry, id: 'med-789' },
    ];

    const result = createMedicationRequestEntries({
      selectedMedicationRequests: medications,
      ...mockCreateParams,
    });

    expect(result).toHaveLength(3);
    result.forEach((entry) => {
      expect(entry.resource?.resourceType).toBe('MedicationRequest');
      expect(entry.request?.method).toBe('POST');
    });
  });

  it('should return empty array for empty medications list', () => {
    const result = createMedicationRequestEntries({
      selectedMedicationRequests: [],
      ...mockCreateParams,
    });

    expect(result).toEqual([]);
  });

  it('should create proper references for encounter and practitioner', () => {
    const result = createMedicationRequestEntries({
      selectedMedicationRequests: [mockMedicationEntry],
      ...mockCreateParams,
    });

    const medicationRequest = result[0].resource as MedicationRequest;
    expect(medicationRequest.subject).toEqual(mockEncounterSubject);
    expect(medicationRequest.encounter?.reference).toBe(mockEncounterReference);
    expect(medicationRequest.requester?.reference).toBe(
      `Practitioner/${mockPractitionerUUID}`,
    );
  });

  it('should generate unique UUIDs for each medication entry', () => {
    const medications = [
      mockMedicationEntry,
      { ...mockMedicationEntry, id: 'uuid-med-456' },
    ];

    let callCount = 0;
    const uuids = ['uuid-1', 'uuid-2'];
    mockGenerateUUID.mockImplementation(() => uuids[callCount++]);

    const result = createMedicationRequestEntries({
      selectedMedicationRequests: medications,
      ...mockCreateParams,
    });

    expect(result[0].fullUrl).toBe('urn:uuid:uuid-med-123');
    expect(result[1].fullUrl).toBe('urn:uuid:uuid-med-456');

    mockGenerateUUID.mockReturnValue(mockUUID);
  });
});
