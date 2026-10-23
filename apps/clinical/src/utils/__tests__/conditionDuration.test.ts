import {
  calculateConditionOnsetDate,
  hasConditionDuration,
  isValidConditionDurationValue,
  parseConditionDurationInput,
} from '../conditionDuration';

const duration = (
  durationYears: number | null,
  durationMonths: number | null,
  durationDays: number | null,
) => ({ durationYears, durationMonths, durationDays });

describe('conditionDuration utils', () => {
  describe('isValidConditionDurationValue', () => {
    it.each([
      ['years', null],
      ['years', 0],
      ['years', 150],
      ['months', 999],
      ['days', 999],
    ] as const)('accepts %s value %s', (field, value) => {
      expect(isValidConditionDurationValue(field, value)).toBe(true);
    });

    it.each([
      ['years', -1],
      ['years', 2.4],
      ['years', 151],
      ['months', 1000],
      ['days', 1000],
      ['days', NaN],
    ] as const)('rejects %s value %s', (field, value) => {
      expect(isValidConditionDurationValue(field, value)).toBe(false);
    });
  });

  describe('parseConditionDurationInput', () => {
    it('returns null for empty input', () => {
      expect(parseConditionDurationInput('years', '')).toBeNull();
      expect(parseConditionDurationInput('years', '  ')).toBeNull();
    });

    it('parses valid whole numbers', () => {
      expect(parseConditionDurationInput('years', '2')).toBe(2);
      expect(parseConditionDurationInput('months', ' 18 ')).toBe(18);
      expect(parseConditionDurationInput('days', '0')).toBe(0);
    });

    it.each(['-3', '2.5', 'abc', '1e2', '151'])(
      'rejects "%s" for years',
      (raw) => {
        expect(parseConditionDurationInput('years', raw)).toBeUndefined();
      },
    );
  });

  describe('hasConditionDuration', () => {
    it('is false when all values are empty or zero', () => {
      expect(hasConditionDuration(duration(null, null, null))).toBe(false);
      expect(hasConditionDuration(duration(0, 0, 0))).toBe(false);
    });

    it('is true when any value is positive', () => {
      expect(hasConditionDuration(duration(2, null, null))).toBe(true);
      expect(hasConditionDuration(duration(0, 0, 5))).toBe(true);
    });
  });

  describe('calculateConditionOnsetDate', () => {
    const consultationDate = new Date(2026, 9, 23, 10, 30);

    it('subtracts years only', () => {
      expect(
        calculateConditionOnsetDate(consultationDate, duration(2, null, null)),
      ).toEqual(new Date(2024, 9, 23, 10, 30));
    });

    it('subtracts a combined years, months and days duration', () => {
      expect(
        calculateConditionOnsetDate(consultationDate, duration(1, 6, 10)),
      ).toEqual(new Date(2025, 3, 13, 10, 30));
    });

    it('treats 18 months the same as 1 year 6 months', () => {
      expect(
        calculateConditionOnsetDate(consultationDate, duration(null, 18, null)),
      ).toEqual(
        calculateConditionOnsetDate(consultationDate, duration(1, 6, null)),
      );
    });

    it('clamps month-end rollover', () => {
      expect(
        calculateConditionOnsetDate(
          new Date(2026, 2, 31),
          duration(null, 1, null),
        ),
      ).toEqual(new Date(2026, 1, 28));
    });

    it('handles leap day', () => {
      expect(
        calculateConditionOnsetDate(
          new Date(2028, 1, 29),
          duration(1, null, null),
        ),
      ).toEqual(new Date(2027, 1, 28));
    });

    it('returns undefined when there is no duration', () => {
      expect(
        calculateConditionOnsetDate(
          consultationDate,
          duration(null, null, null),
        ),
      ).toBeUndefined();
      expect(
        calculateConditionOnsetDate(consultationDate, duration(0, 0, 0)),
      ).toBeUndefined();
    });

    it('does not mutate the consultation date', () => {
      const date = new Date(2026, 9, 23);
      calculateConditionOnsetDate(date, duration(1, 2, 3));
      expect(date).toEqual(new Date(2026, 9, 23));
    });
  });
});
