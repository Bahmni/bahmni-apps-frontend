import { useServiceRequestStore } from '../../../stores';
import { FORM_REGISTRY } from '../formRegistry';
import type { FormRegistry } from '../models';
import { captureUpdatedResources, getActiveEntries } from '../utils';

jest.mock('../../../stores');

const mockFormEntry = (overrides: Partial<FormRegistry> = {}): FormRegistry =>
  ({
    key: 'allergies',
    component: jest.fn() as unknown as React.ComponentType,
    reset: jest.fn(),
    validate: jest.fn().mockReturnValue(true),
    hasData: jest.fn().mockReturnValue(false),
    subscribe: jest.fn(),
    ...overrides,
  }) as FormRegistry;

beforeEach(() => {
  jest.clearAllMocks();
  (useServiceRequestStore as unknown as { getState: jest.Mock }).getState = jest
    .fn()
    .mockReturnValue({ selectedServiceRequests: new Map() });
});

describe('getActiveEntries', () => {
  it('includes all entries for Consultation encounter type', () => {
    const result = getActiveEntries('Consultation');

    expect(result).toHaveLength(FORM_REGISTRY.length);
  });

  it('excludes entries restricted to specific encounter types for non-matching type', () => {
    const result = getActiveEntries('OPD');

    const unrestricted = FORM_REGISTRY.filter((e) => !e.encounterTypes);
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
      mockFormEntry({
        key: key as FormRegistry['key'],
        hasData: jest.fn().mockReturnValue(true),
      }),
    ];

    const result = captureUpdatedResources(entries);

    expect(result[resultKey as keyof typeof result]).toBe(true);
  });

  it('returns true for medications when medications hasData', () => {
    const entries = [
      mockFormEntry({
        key: 'medications',
        hasData: jest.fn().mockReturnValue(true),
      }),
    ];

    expect(captureUpdatedResources(entries).medications).toBe(true);
  });

  it('returns true for medications when vaccinations hasData', () => {
    const entries = [
      mockFormEntry({
        key: 'vaccinations',
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
