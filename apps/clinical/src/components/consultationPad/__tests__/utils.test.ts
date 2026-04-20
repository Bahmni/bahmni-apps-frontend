import { useServiceRequestStore } from '../../../stores';
import { loadEncounterInputControls } from '../inputControlRegistry';
import type { EncounterInputControl } from '../models';
import { captureUpdatedResources, getActiveEntries } from '../utils';
import { makeMockEntry } from './__mocks__/indexMocks';
import { mockConsultationPadConfig } from './__mocks__/inputControlRegistryMocks';

jest.mock('../../../stores');

beforeEach(() => {
  jest.clearAllMocks();
  (useServiceRequestStore as unknown as { getState: jest.Mock }).getState = jest
    .fn()
    .mockReturnValue({ selectedServiceRequests: new Map() });
});

describe('getActiveEntries', () => {
  let registry: ReturnType<typeof loadEncounterInputControls>;

  beforeEach(() => {
    registry = loadEncounterInputControls(mockConsultationPadConfig);
  });

  it('includes all entries for Consultation encounter type', () => {
    const result = getActiveEntries(registry, 'Consultation');

    expect(result).toHaveLength(registry.length);
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
  ])('returns true for %s when hasData is true', (_label, key, resultKey) => {
    const entries = [
      makeMockEntry(key as EncounterInputControl['key'], {
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
      serviceRequests: {},
    });
  });
});
