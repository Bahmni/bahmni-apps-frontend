import { resolveComboBoxItems } from '@bahmni/services';
import { MedicationRequest } from 'fhir/r4';
import {
  applyDefaultDosage,
  applyDefaultDurationUnit,
  applyDefaultFrequency,
  applyDefaultInstruction,
  createMedicationRequestEntries,
  getDefaultDosingUnit,
  getDefaultRoute,
  getMedicationRequestComboBoxItems,
} from '../utils';
import {
  mockEncounterReference,
  mockEncounterSubject,
  mockMedication,
  mockMedicationConfig,
  mockMedicationEntry,
  mockMedicationWithForm,
  mockPractitionerUUID,
} from './__mocks__/MedicationRequestFormMocks';

jest.mock('@bahmni/services', () => ({
  ...jest.requireActual('@bahmni/services'),
  resolveComboBoxItems: jest.fn(),
}));

jest.mock('../../../../services/medicationService', () => ({
  getMedicationDisplay: jest.fn((m) => m?.code?.text ?? 'Unknown'),
}));

const mockUUID = '1d87ab20-8b86-4b41-a30d-984b2208d945';
globalThis.crypto.randomUUID = jest.fn().mockReturnValue(mockUUID);

describe('applyDefaultDosage', () => {
  it('applies default when dosage is 0', () => {
    const updateDosage = jest.fn();
    applyDefaultDosage([{ name: 'dosage', default: 5 }], 0, 'id', updateDosage);
    expect(updateDosage).toHaveBeenCalledWith('id', 5);
  });

  it.each([
    [
      'does nothing when dosage is already non-zero',
      2,
      [{ name: 'dosage', default: 5 }],
    ],
    ['does nothing when no default configured', 0, [{ name: 'dosage' }]],
  ])('%s', (_, dosage, attrs) => {
    const updateDosage = jest.fn();
    applyDefaultDosage(attrs, dosage as number, 'id', updateDosage);
    expect(updateDosage).not.toHaveBeenCalled();
  });
});

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

  it.each([
    [
      'does nothing when frequency is already set',
      { uuid: 'bd-uuid', name: 'BD', frequencyPerDay: 2 },
      [{ name: 'frequency', default: 'BD' }],
    ],
    [
      'does nothing when no default configured on the attribute',
      null,
      [{ name: 'frequency' }],
    ],
    [
      'does nothing when default name matches an immediate frequency',
      null,
      [{ name: 'frequency', default: 'Immediately' }],
    ],
  ])('%s', (_, frequency, attrs) => {
    const updateFrequency = jest.fn();
    applyDefaultFrequency(
      attrs,
      mockMedicationConfig,
      frequency,
      'id',
      updateFrequency,
    );
    expect(updateFrequency).not.toHaveBeenCalled();
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
    expect(result[0].fullUrl).toBe(`urn:uuid:${mockUUID}`);
    expect(result[0].resource?.resourceType).toBe('MedicationRequest');
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
      { ...mockMedicationEntry, id: 'med-456' },
    ];

    let callCount = 0;
    const uuids = ['uuid-1', 'uuid-2'];
    (globalThis.crypto.randomUUID as jest.Mock).mockImplementation(
      () => uuids[callCount++],
    );

    const result = createMedicationRequestEntries({
      selectedMedicationRequests: medications,
      ...mockCreateParams,
    });

    expect(result[0].fullUrl).toBe('urn:uuid:uuid-1');
    expect(result[1].fullUrl).toBe('urn:uuid:uuid-2');

    (globalThis.crypto.randomUUID as jest.Mock).mockReturnValue(mockUUID);
  });
});
