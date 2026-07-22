import type { Observation, Encounter, Bundle } from 'fhir/r4';
import {
  mockObservationWithFormPath,
  mockObservationWithoutFormPath,
  mockEncounterWithProvider,
  mockEncounterWithoutProvider,
  mockEncounterWithoutPeriodStart,
  mockObservationsForVitals,
} from '../../../__tests__/__mocks__/observationMocks';
import {
  extractUuidFromReference,
  groupObservationsByEncounter,
} from '../viewFormUtils';

describe('viewFormUtils', () => {
  describe('extractUuidFromReference', () => {
    it.each([
      ['Encounter/encounter-123', 'encounter-123'],
      ['ServiceRequest/service-request-456', 'service-request-456'],
      ['Task/task-789', 'task-789'],
      ['Patient/patient-uuid', 'patient-uuid'],
    ])('should extract UUID from reference %s', (reference, expectedUuid) => {
      expect(extractUuidFromReference(reference)).toBe(expectedUuid);
    });

    it('should return empty string for empty reference', () => {
      expect(extractUuidFromReference('')).toBe('');
    });

    it('should return the string itself for reference without slash', () => {
      expect(extractUuidFromReference('no-slash-here')).toBe('no-slash-here');
    });

    it('should handle reference with multiple slashes', () => {
      expect(
        extractUuidFromReference('http://example.com/Encounter/uuid-123'),
      ).toBe('uuid-123');
    });
  });

  describe('groupObservationsByEncounter', () => {
    it('should group observations by encounter', () => {
      const observations = mockObservationsForVitals;
      const bundle: Bundle<Encounter> = {
        resourceType: 'Bundle',
        type: 'searchset',
        entry: [
          {
            resource: mockEncounterWithProvider,
          },
        ],
      };

      const result = groupObservationsByEncounter(observations, bundle);

      expect(result).toHaveLength(1);
      expect(result[0].encounterUuid).toBe('encounter-1');
      expect(result[0].observations).toHaveLength(2);
      expect(result[0].providerName).toBe('Super Man');
    });

    it('should return empty array when observations array is empty', () => {
      const bundle: Bundle<Encounter> = {
        resourceType: 'Bundle',
        type: 'searchset',
        entry: [
          {
            resource: mockEncounterWithProvider,
          },
        ],
      };

      const result = groupObservationsByEncounter([], bundle);

      expect(result).toEqual([]);
    });

    it('should return empty array when bundle has no entries', () => {
      const observations = mockObservationsForVitals;
      const emptyBundle: Bundle<Encounter> = {
        resourceType: 'Bundle',
        type: 'searchset',
        entry: [],
      };

      const result = groupObservationsByEncounter(observations, emptyBundle);

      expect(result).toEqual([]);
    });

    it('should return empty array when bundle has no encounters', () => {
      const observations = mockObservationsForVitals;
      const bundleWithoutEncounters: Bundle<Encounter> = {
        resourceType: 'Bundle',
        type: 'searchset',
        entry: [
          {
            resource: {
              resourceType: 'Observation',
              id: 'some-obs',
              status: 'final',
              code: { text: 'test' },
            } as Observation,
          },
        ],
      };

      const result = groupObservationsByEncounter(
        observations,
        bundleWithoutEncounters as Bundle<Encounter>,
      );

      expect(result).toEqual([]);
    });

    it('should default to 0 when period start is missing', () => {
      const observations: Observation[] = [
        {
          ...mockObservationWithFormPath,
          encounter: {
            reference: 'Encounter/encounter-3',
          },
        },
      ];
      const bundle: Bundle<Encounter> = {
        resourceType: 'Bundle',
        type: 'searchset',
        entry: [
          {
            resource: mockEncounterWithoutPeriodStart,
          },
        ],
      };

      const result = groupObservationsByEncounter(observations, bundle);

      expect(result).toHaveLength(1);
      expect(result[0].encounterDateTime).toBe(0);
    });

    it('should default to Unknown when provider is missing', () => {
      const observations: Observation[] = [
        {
          ...mockObservationWithFormPath,
          encounter: {
            reference: 'Encounter/encounter-2',
          },
        },
      ];
      const bundle: Bundle<Encounter> = {
        resourceType: 'Bundle',
        type: 'searchset',
        entry: [
          {
            resource: mockEncounterWithoutProvider,
          },
        ],
      };

      const result = groupObservationsByEncounter(observations, bundle);

      expect(result).toHaveLength(1);
      expect(result[0].providerName).toBe('Unknown');
    });

    it('should sort groups by encounterDateTime descending', () => {
      const observations: Observation[] = [
        {
          ...mockObservationWithFormPath,
          id: 'obs-old',
          encounter: {
            reference: 'Encounter/encounter-old',
          },
        },
        {
          ...mockObservationWithFormPath,
          id: 'obs-new',
          encounter: {
            reference: 'Encounter/encounter-new',
          },
        },
      ];

      const oldEncounter: Encounter = {
        ...mockEncounterWithProvider,
        id: 'encounter-old',
        period: {
          start: '2026-07-19T09:00:00+00:00',
        },
      };

      const newEncounter: Encounter = {
        ...mockEncounterWithProvider,
        id: 'encounter-new',
        period: {
          start: '2026-07-20T09:00:00+00:00',
        },
      };

      const bundle: Bundle<Encounter> = {
        resourceType: 'Bundle',
        type: 'searchset',
        entry: [{ resource: oldEncounter }, { resource: newEncounter }],
      };

      const result = groupObservationsByEncounter(observations, bundle);

      expect(result).toHaveLength(2);
      expect(result[0].encounterUuid).toBe('encounter-new');
      expect(result[1].encounterUuid).toBe('encounter-old');
    });

    it('should skip observations without encounter reference', () => {
      const observations: Observation[] = [
        mockObservationWithFormPath,
        {
          ...mockObservationWithFormPath,
          id: 'obs-no-encounter',
          encounter: undefined,
        },
      ];
      const bundle: Bundle<Encounter> = {
        resourceType: 'Bundle',
        type: 'searchset',
        entry: [
          {
            resource: mockEncounterWithProvider,
          },
        ],
      };

      const result = groupObservationsByEncounter(observations, bundle);

      expect(result).toHaveLength(1);
      expect(result[0].observations).toHaveLength(1);
      expect(result[0].observations[0].id).toBe('obs-1');
    });

    it('should skip observations when encounter not present in bundle', () => {
      const observations: Observation[] = [
        {
          ...mockObservationWithFormPath,
          encounter: {
            reference: 'Encounter/non-existent-encounter',
          },
        },
      ];
      const bundle: Bundle<Encounter> = {
        resourceType: 'Bundle',
        type: 'searchset',
        entry: [
          {
            resource: mockEncounterWithProvider,
          },
        ],
      };

      const result = groupObservationsByEncounter(observations, bundle);

      expect(result).toEqual([]);
    });

    it('should handle multiple observations for same encounter', () => {
      const observations = [
        mockObservationsForVitals[0],
        mockObservationsForVitals[1],
        {
          ...mockObservationsForVitals[0],
          id: 'obs-third',
        },
      ];
      const bundle: Bundle<Encounter> = {
        resourceType: 'Bundle',
        type: 'searchset',
        entry: [
          {
            resource: mockEncounterWithProvider,
          },
        ],
      };

      const result = groupObservationsByEncounter(observations, bundle);

      expect(result).toHaveLength(1);
      expect(result[0].observations).toHaveLength(3);
    });

    it('should handle encounters without id field', () => {
      const observations: Observation[] = [
        {
          ...mockObservationWithFormPath,
          encounter: {
            reference: 'Encounter/encounter-1',
          },
        },
      ];
      const encounterWithoutId: Encounter = {
        ...mockEncounterWithProvider,
        id: undefined,
      };
      const bundle: Bundle<Encounter> = {
        resourceType: 'Bundle',
        type: 'searchset',
        entry: [
          {
            resource: encounterWithoutId,
          },
        ],
      };

      const result = groupObservationsByEncounter(observations, bundle);

      expect(result).toEqual([]);
    });
  });
});
