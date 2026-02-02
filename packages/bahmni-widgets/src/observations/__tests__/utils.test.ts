import * as services from '@bahmni/services';
import { Bundle, Observation } from 'fhir/r4';
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
  mockBundleWithNormalReferenceRange,
  mockBundleWithOnlyFirstReferenceRange,
  mockObservationWithBothRangesHavingUnits,
  mockObservationWithBothRangesUsingObsUnit,
  mockObservationWithMixedUnits,
  mockObservationWithOnlyLowWithUnit,
  mockObservationWithOnlyLowUsingObsUnit,
  mockObservationWithOnlyHighWithUnit,
  mockObservationWithOnlyHighUsingObsUnit,
  mockObservationWithNoReferenceRange,
  mockObservationWithEmptyReferenceRange,
  mockObservationWithNoUnits,
  mockObservationWithoutObservationValue,
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
          isAbnormal: false,
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
          isAbnormal: false,
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
          isAbnormal: false,
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

    it('should extract normal reference range when multiple ranges exist', () => {
      const result = extractObservationsFromBundle(
        mockBundleWithNormalReferenceRange,
      );

      expect(result.observations).toHaveLength(1);
      expect(result.observations[0].observationValue?.referenceRange).toEqual({
        low: { value: 70, unit: 'mg/dL' },
        high: { value: 100, unit: 'mg/dL' },
      });
    });

    it('should not extract reference range when normal type is not found', () => {
      const result = extractObservationsFromBundle(
        mockBundleWithOnlyFirstReferenceRange,
      );

      expect(result.observations).toHaveLength(1);
      expect(
        result.observations[0].observationValue?.referenceRange,
      ).toBeUndefined();
    });

    it('should mark observation as abnormal when interpretation code is A', () => {
      const result = extractObservationsFromBundle(
        mockBundleWithOnlyFirstReferenceRange,
      );

      expect(result.observations).toHaveLength(1);
      expect(result.observations[0].observationValue?.isAbnormal).toBe(true);
    });

    it('should not mark observation as abnormal when interpretation code is N', () => {
      const result = extractObservationsFromBundle(
        mockBundleWithNormalReferenceRange,
      );

      expect(result.observations).toHaveLength(1);
      expect(result.observations[0].observationValue?.isAbnormal).toBe(false);
    });

    it('should mark observation as not abnormal when no interpretation exists', () => {
      const result = extractObservationsFromBundle(mockBundleWithCorrectValues);

      expect(result.observations[0].observationValue?.isAbnormal).toBe(false);
      expect(result.observations[1].observationValue?.isAbnormal).toBe(false);
      expect(result.observations[2].observationValue?.isAbnormal).toBe(false);
    });

    it('should extract observation with valueBoolean', () => {
      const bundle: Bundle<Observation> = {
        resourceType: 'Bundle',
        type: 'searchset',
        entry: [
          {
            resource: {
              resourceType: 'Observation',
              id: 'obs-bool',
              status: 'final',
              code: { text: 'Is Smoker' },
              valueBoolean: true,
            },
          },
        ],
      };

      const result = extractObservationsFromBundle(bundle);
      expect(result.observations[0].observationValue?.value).toBe(true);
      expect(result.observations[0].observationValue?.type).toBe('boolean');
    });

    it('should extract observation with valueInteger', () => {
      const bundle: Bundle<Observation> = {
        resourceType: 'Bundle',
        type: 'searchset',
        entry: [
          {
            resource: {
              resourceType: 'Observation',
              id: 'obs-int',
              status: 'final',
              code: { text: 'Count' },
              valueInteger: 5,
            },
          },
        ],
      };

      const result = extractObservationsFromBundle(bundle);
      expect(result.observations[0].observationValue?.value).toBe(5);
      expect(result.observations[0].observationValue?.type).toBe('integer');
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

    it('should return DATE_ERROR_PARSE when date is missing', () => {
      const result = formatEncounterTitle(undefined, mockT);
      expect(result).toBe('DATE_ERROR_PARSE');
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

    it('should return empty string when observationValue is undefined', () => {
      const observation: ExtractedObservation = {
        id: 'obs-3',
        display: 'Test',
        observationValue: undefined,
      };

      expect(formatObservationValue(observation)).toBe('');
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

    it('should format header with both ranges having units', () => {
      const result = transformObservationToRowCell(
        mockObservationWithBothRangesHavingUnits,
        0,
      );
      expect(result.header).toBe('Blood Glucose (70 mg/dL - 100 mg/dL)');
    });

    it('should format header with both ranges using obs unit', () => {
      const result = transformObservationToRowCell(
        mockObservationWithBothRangesUsingObsUnit,
        0,
      );
      expect(result.header).toBe('Hemoglobin (12 g/dL - 16 g/dL)');
    });

    it('should format header with mixed units', () => {
      const result = transformObservationToRowCell(
        mockObservationWithMixedUnits,
        0,
      );
      expect(result.header).toBe('Temperature (97 °F - 99 °F)');
    });

    it('should format header with only low range having unit', () => {
      const result = transformObservationToRowCell(
        mockObservationWithOnlyLowWithUnit,
        0,
      );
      expect(result.header).toBe('Systolic BP (>90 mmHg)');
    });

    it('should format header with only low range using obs unit', () => {
      const result = transformObservationToRowCell(
        mockObservationWithOnlyLowUsingObsUnit,
        0,
      );
      expect(result.header).toBe('Heart Rate (>60 bpm)');
    });

    it('should format header with only high range having unit', () => {
      const result = transformObservationToRowCell(
        mockObservationWithOnlyHighWithUnit,
        0,
      );
      expect(result.header).toBe('Cholesterol (<200 mg/dL)');
    });

    it('should format header with only high range using obs unit', () => {
      const result = transformObservationToRowCell(
        mockObservationWithOnlyHighUsingObsUnit,
        0,
      );
      expect(result.header).toBe('Blood Sugar (<140 mg/dL)');
    });

    it('should format header with no reference range', () => {
      const result = transformObservationToRowCell(
        mockObservationWithNoReferenceRange,
        0,
      );
      expect(result.header).toBe('Notes');
    });

    it('should format header with empty reference range', () => {
      const result = transformObservationToRowCell(
        mockObservationWithEmptyReferenceRange,
        0,
      );
      expect(result.header).toBe('Comments');
    });

    it('should format header with no units', () => {
      const result = transformObservationToRowCell(
        mockObservationWithNoUnits,
        0,
      );
      expect(result.header).toBe('Count (2 - 10)');
    });

    it('should format header when observationValue is undefined', () => {
      const result = transformObservationToRowCell(
        mockObservationWithoutObservationValue,
        0,
      );
      expect(result.header).toBe('Notes Only');
      expect(result.value).toBe('');
    });
  });
});
