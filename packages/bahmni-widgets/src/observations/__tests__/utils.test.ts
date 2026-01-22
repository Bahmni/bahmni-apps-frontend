import * as services from '@bahmni/services';
import {
  mockBundleWithCorrectValues,
  mockEmptyBundle,
  mockBundleWithNoEntries,
  mockBundleWithEncounterDetails,
  mockBundleWithHasMember,
  mockBundleWithoutValueType,
  mockBundleWithMissingOptionalFields,
  mockBundleWithAllOptionalValues,
  mockBundleWithMultipleEncounters,
  mockBundleWithMixedObservations,
  mockBundleWithGroupedObservationsOnly,
  mockBundleWithOneMissingDate,
  mockBundleWithBothMissingDates,
  mockBundleWithReversedMissingDate,
} from '../__mocks__/observationTestData';
import { ExtractedObservation, EncounterDetails } from '../models';
import {
  extractObservationsFromBundle,
  groupObservationsByEncounter,
  sortObservationsByEncounterDate,
  formatEncounterTitle,
  formatObservationValue,
  transformObservationToRowCell,
} from '../utils';

jest.mock('@bahmni/services', () => ({
  ...jest.requireActual('@bahmni/services'),
  formatDateTime: jest.fn(),
}));

describe('observationUtils', () => {
  describe('extractObservationsFromBundle', () => {
    it('should extract observation with correct values', () => {
      const result = extractObservationsFromBundle(mockBundleWithCorrectValues);

      expect(result.observations).toHaveLength(3);
      expect(result.observations[0]).toEqual({
        id: 'obs-1',
        display: 'Systolic blood pressure',
        observationValue: {
          value: 120,
          unit: 'mmHg',
          type: 'quantity',
        },
        effectiveDateTime: '2026-01-19T12:35:58+00:00',
        issued: undefined,
        encounter: undefined,
        members: undefined,
      });
      expect(result.observations[1]).toEqual({
        id: 'obs-2',
        display: 'Chief Complaint Duration',
        observationValue: {
          value: 'Days',
          unit: undefined,
          type: 'codeable',
        },
        effectiveDateTime: undefined,
        issued: undefined,
        encounter: undefined,
        members: undefined,
      });
      expect(result.observations[2]).toEqual({
        id: 'obs-3',
        display: 'Chief Complaint Record',
        observationValue: {
          value: 'Fever, 2.0, Days',
          unit: undefined,
          type: 'string',
        },
        effectiveDateTime: undefined,
        issued: undefined,
        encounter: undefined,
        members: undefined,
      });
      expect(result.groupedObservations).toHaveLength(0);
    });

    it('should handle empty bundle', () => {
      const result = extractObservationsFromBundle(mockEmptyBundle);

      expect(result.observations).toHaveLength(0);
      expect(result.groupedObservations).toHaveLength(0);
    });

    it('should handle bundle with no entries', () => {
      const result = extractObservationsFromBundle(mockBundleWithNoEntries);

      expect(result.observations).toHaveLength(0);
      expect(result.groupedObservations).toHaveLength(0);
    });

    it('should extract observation with encounter details', () => {
      const result = extractObservationsFromBundle(
        mockBundleWithEncounterDetails,
      );

      expect(result.observations[0].encounter).toEqual({
        id: 'enc-1',
        type: 'Consultation',
        date: '2026-01-19T10:00:00+00:00',
        provider: 'Dr. Smith',
        location: 'OPD',
      });
    });

    it('should handle grouped observations with hasMember', () => {
      const result = extractObservationsFromBundle(mockBundleWithHasMember);

      expect(result.groupedObservations).toHaveLength(1);
      expect(result.observations).toHaveLength(0);
      expect(result.groupedObservations[0].display).toBe('Blood Pressure');
      expect(result.groupedObservations[0].children).toHaveLength(1);
      expect(result.groupedObservations[0].children[0].display).toBe(
        'Systolic',
      );
    });

    it('should handle observation without value type', () => {
      const result = extractObservationsFromBundle(mockBundleWithoutValueType);

      expect(result.observations[0].observationValue).toBeUndefined();
    });

    it('should handle missing optional fields', () => {
      const result = extractObservationsFromBundle(
        mockBundleWithMissingOptionalFields,
      );

      expect(result.observations[0].display).toBe('Lab Test');
      expect(result.observations[0].observationValue?.value).toBe('Positive');
    });

    it('should handle all optional values gracefully', () => {
      const result = extractObservationsFromBundle(
        mockBundleWithAllOptionalValues,
      );

      expect(result.observations).toHaveLength(1);
      expect(result.observations[0].id).toBe('obs-with-string-ref');
      expect(result.observations[0].display).toBe('');
      expect(result.observations[0].observationValue?.value).toBe('');
      expect(result.observations[0].observationValue?.type).toBe('quantity');
      expect(result.observations[0].encounter).toEqual({
        id: 'enc-minimal',
        type: 'Unknown',
        date: '',
        provider: undefined,
        location: undefined,
      });

      expect(result.groupedObservations).toHaveLength(1);
      expect(result.groupedObservations[0].id).toBe('obs-parent');
      expect(result.groupedObservations[0].children).toHaveLength(1);
      expect(result.groupedObservations[0].children[0].id).toBe(
        'obs-child-valid',
      );
    });
  });

  describe('groupObservationsByEncounter', () => {
    it('should group observations by encounter ID', () => {
      const result = extractObservationsFromBundle(
        mockBundleWithMultipleEncounters,
      );

      const grouped = groupObservationsByEncounter(result);

      expect(grouped).toHaveLength(2);
      const enc1 = grouped.find((g) => g.encounterId === 'enc-1');
      const enc2 = grouped.find((g) => g.encounterId === 'enc-2');
      expect(enc1?.observations).toHaveLength(2);
      expect(enc2?.observations).toHaveLength(1);
    });

    it('should group both observations and groupedObservations together', () => {
      const result = extractObservationsFromBundle(
        mockBundleWithMixedObservations,
      );

      const grouped = groupObservationsByEncounter(result);

      expect(grouped).toHaveLength(1);
      expect(grouped[0].observations).toHaveLength(1);
      expect(grouped[0].groupedObservations).toHaveLength(1);
    });

    it('should handle empty observations and groupedObservations', () => {
      const result = {
        observations: [],
        groupedObservations: [],
      };

      const grouped = groupObservationsByEncounter(result);

      expect(grouped).toHaveLength(0);
    });
  });

  describe('sortObservationsByEncounterDate', () => {
    it('should sort observations by encounter date newest first', () => {
      const result = extractObservationsFromBundle(
        mockBundleWithMultipleEncounters,
      );

      const grouped = groupObservationsByEncounter(result);
      const sorted = sortObservationsByEncounterDate(grouped);

      expect(sorted).toHaveLength(2);
      expect(sorted[0].encounterId).toBe('enc-2');
      expect(sorted[1].encounterId).toBe('enc-1');
    });

    it('should handle empty array', () => {
      const sorted = sortObservationsByEncounterDate([]);

      expect(sorted).toHaveLength(0);
    });

    it('should use groupedObservations date when observations array is empty', () => {
      const result = extractObservationsFromBundle(
        mockBundleWithGroupedObservationsOnly,
      );

      const grouped = groupObservationsByEncounter(result);
      const sorted = sortObservationsByEncounterDate(grouped);

      expect(sorted).toHaveLength(2);
      expect(sorted[0].encounterId).toBe('enc-2');
      expect(sorted[0].observations).toHaveLength(0);
      expect(sorted[0].groupedObservations).toHaveLength(1);
      expect(sorted[1].encounterId).toBe('enc-1');
      expect(sorted[1].observations).toHaveLength(0);
      expect(sorted[1].groupedObservations).toHaveLength(1);
    });

    it('should handle encounters with missing dates correctly', () => {
      const result1 = extractObservationsFromBundle(
        mockBundleWithOneMissingDate,
      );

      const grouped1 = groupObservationsByEncounter(result1);
      const sorted1 = sortObservationsByEncounterDate(grouped1);

      expect(sorted1[0].encounterId).toBe('enc-1');
      expect(sorted1[1].encounterId).toBe('enc-2');

      const result2 = extractObservationsFromBundle(
        mockBundleWithBothMissingDates,
      );

      const grouped2 = groupObservationsByEncounter(result2);
      const sorted2 = sortObservationsByEncounterDate(grouped2);

      expect(sorted2).toHaveLength(2);

      const result3 = extractObservationsFromBundle(
        mockBundleWithReversedMissingDate,
      );

      const grouped3 = groupObservationsByEncounter(result3);
      const sorted3 = sortObservationsByEncounterDate(grouped3);

      expect(sorted3[0].encounterId).toBe('enc-6');
      expect(sorted3[1].encounterId).toBe('enc-5');
    });
  });

  describe('formatEncounterTitle', () => {
    const mockT = (key: string) => key;
    const mockFormatDateTime = services.formatDateTime as jest.MockedFunction<
      typeof services.formatDateTime
    >;

    beforeEach(() => {
      mockFormatDateTime.mockReturnValue({
        formattedResult: '20/01/2026 21:07',
      });
    });

    afterEach(() => {
      mockFormatDateTime.mockClear();
    });

    it('should format encounter date', () => {
      const encounterDetails: EncounterDetails = {
        id: 'enc-1',
        type: 'Consultation',
        date: '2026-01-20T21:07:00Z',
        provider: 'Super Man',
      };

      const result = formatEncounterTitle(encounterDetails, mockT);
      expect(result).toBe('20/01/2026 21:07');
      expect(mockFormatDateTime).toHaveBeenCalledWith(
        '2026-01-20T21:07:00Z',
        mockT,
      );
    });

    it('should return UNKNOWN_ENCOUNTER when date is missing', () => {
      const result = formatEncounterTitle(undefined, mockT);
      expect(result).toBe('UNKNOWN_ENCOUNTER');
      expect(mockFormatDateTime).not.toHaveBeenCalled();
    });
  });

  describe('formatObservationValue', () => {
    it('should format value with unit', () => {
      const observation: ExtractedObservation = {
        id: 'obs-1',
        display: 'Temperature',
        observationValue: {
          value: 98.6,
          unit: '°F',
          type: 'quantity',
        },
      };

      expect(formatObservationValue(observation)).toBe('98.6 °F');
    });

    it('should format value without unit', () => {
      const observation: ExtractedObservation = {
        id: 'obs-2',
        display: 'Fever',
        observationValue: {
          value: 'Fever',
          type: 'string',
        },
      };

      expect(formatObservationValue(observation)).toBe('Fever');
    });
  });

  describe('transformObservationToRowCell', () => {
    it('should transform observation to row cell format with provider', () => {
      const observation: ExtractedObservation = {
        id: 'obs-1',
        display: 'Temperature',
        observationValue: {
          value: 98.6,
          unit: '°F',
          type: 'quantity',
        },
        encounter: {
          id: 'enc-1',
          type: 'Consultation',
          date: '2026-01-20',
          provider: 'Dr. Smith',
        },
      };

      const result = transformObservationToRowCell(observation, 0);
      expect(result).toEqual({
        index: 0,
        header: 'Temperature',
        value: '98.6 °F',
        provider: 'Dr. Smith',
      });
    });

    it('should transform observation without provider', () => {
      const observation: ExtractedObservation = {
        id: 'obs-2',
        display: 'Fever',
        observationValue: {
          value: 'High',
          type: 'string',
        },
      };

      const result = transformObservationToRowCell(observation, 1);
      expect(result).toEqual({
        index: 1,
        header: 'Fever',
        value: 'High',
        provider: undefined,
      });
    });
  });
});
