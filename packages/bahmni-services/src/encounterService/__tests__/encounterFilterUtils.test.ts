import { shouldEnableEncounterFilter } from '../encounterFilterUtils';

describe('encounterFilterUtils', () => {
  describe('shouldShowEmptyEncounterFilter', () => {
    it('should return false when episodeOfCareUuids is empty array', () => {
      const result = shouldEnableEncounterFilter([], ['encounter1']);
      expect(result).toBe(false);
    });

    it('should return false when episodeOfCareUuids is empty and encounterUuids is also empty', () => {
      const result = shouldEnableEncounterFilter([], []);
      expect(result).toBe(false);
    });

    it('should return true when episodeOfCareUuids has values and encounterUuids is empty', () => {
      const result = shouldEnableEncounterFilter(['episode1'], []);
      expect(result).toBe(true);
    });

    it('should return false when both episodeOfCareUuids and encounterUuids have values', () => {
      const result = shouldEnableEncounterFilter(['episode1'], ['encounter1']);
      expect(result).toBe(false);
    });

    it('should return true when episodeOfCareUuids is undefined and encounterUuids is empty', () => {
      const result = shouldEnableEncounterFilter(undefined, []);
      expect(result).toBe(true);
    });

    it('should return false when encounterUuids is undefined', () => {
      const result = shouldEnableEncounterFilter(['episode1'], undefined);
      expect(result).toBe(false);
    });

    it('should return false when both are undefined', () => {
      const result = shouldEnableEncounterFilter(undefined, undefined);
      expect(result).toBe(false);
    });

    it('should return false when encounterUuids has values (matching original logic)', () => {
      const result = shouldEnableEncounterFilter(
        ['episode1'],
        ['encounter1', 'encounter2'],
      );
      expect(result).toBe(false);
    });

    // Test cases that match the original logic exactly
    describe('original logic equivalence', () => {
      const testCases = [
        {
          episodeOfCareUuids: [],
          encounterUuids: [],
          expected: false,
          description: 'empty episodes, empty encounters',
        },
        {
          episodeOfCareUuids: [],
          encounterUuids: ['enc1'],
          expected: false,
          description: 'empty episodes, has encounters',
        },
        {
          episodeOfCareUuids: ['ep1'],
          encounterUuids: [],
          expected: true,
          description: 'has episodes, empty encounters',
        },
        {
          episodeOfCareUuids: ['ep1'],
          encounterUuids: ['enc1'],
          expected: false,
          description: 'has episodes, has encounters',
        },
        {
          episodeOfCareUuids: undefined,
          encounterUuids: [],
          expected: true,
          description: 'undefined episodes, empty encounters',
        },
        {
          episodeOfCareUuids: ['ep1'],
          encounterUuids: undefined,
          expected: false,
          description: 'has episodes, undefined encounters',
        },
      ];

      testCases.forEach(
        ({ episodeOfCareUuids, encounterUuids, expected, description }) => {
          it(`should return ${expected} for ${description}`, () => {
            const result = shouldEnableEncounterFilter(
              episodeOfCareUuids,
              encounterUuids,
            );
            expect(result).toBe(expected);
          });
        },
      );
    });
  });
});
