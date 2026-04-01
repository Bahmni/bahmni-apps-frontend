import { addDays } from 'date-fns';
import { getUserPreferredLocale } from '../../i18n/translationService';
import {
  calculateAge,
  formatDateTime,
  calculateOnsetDate,
  formatDateDistance,
  sortByDate,
  getFormattedAge,
  DURATION_UNIT_TO_DAYS,
  calculateEndDate,
  doDateRangesOverlap,
} from '../date';

const mockT = (key: string, options?: { count?: number }) => {
  const { count = 1 } = options ?? {};

  switch (key) {
    case 'DAYS':
      return count === 1 ? ' day' : ' days';
    case 'MONTHS':
      return count === 1 ? ' month' : ' months';
    case 'YEARS':
      return count === 1 ? ' year' : ' years';
    case 'DATE_ERROR_PARSE':
      return 'Parse Error';
    case 'DATE_ERROR_FORMAT':
      return 'Format Error';
    case 'DATE_ERROR_EMPTY_OR_INVALID':
      return 'Empty or invalid input';
    case 'DATE_ERROR_INVALID_FORMAT':
      return 'Invalid format';
    case 'DATE_ERROR_NULL_OR_UNDEFINED':
      return 'Null or undefined input';
    default:
      return key;
  }
};

jest.mock('../../i18n/translationService', () => ({
  getUserPreferredLocale: jest.fn(),
}));

Object.defineProperty(globalThis.navigator, 'language', {
  value: 'en-GB',
  writable: true,
  configurable: true,
});

describe('calculateAge', () => {
  const mockDate = new Date(2025, 2, 24);

  beforeEach(() => {
    jest.useFakeTimers();
    jest.setSystemTime(mockDate);
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('should calculate age correctly for valid past dates', () => {
    const result = calculateAge('1990-05-15');
    expect(result).not.toBeNull();
    expect(result?.years).toBe(34);
    expect(result?.months).toBe(10);
    expect(result?.days).toBe(9);
  });

  it('should calculate age correctly when birthday is today', () => {
    const result = calculateAge('2000-03-24');
    expect(result).not.toBeNull();
    expect(result?.years).toBe(25);
    expect(result?.months).toBe(0);
    expect(result?.days).toBe(0);
  });

  it('should handle leap year dates', () => {
    const result = calculateAge('2000-02-29');
    expect(result).not.toBeNull();
    expect(result?.years).toBe(25);
    expect(result?.days).toBe(24);
  });

  it('should calculate age for children under 1 year', () => {
    const result = calculateAge('2024-12-31');
    expect(result).not.toBeNull();
    expect(result?.years).toBe(0);
    expect(result?.months).toBe(2);
  });

  it('should return null for invalid date formats', () => {
    expect(calculateAge('05/15/1990')).toBeNull();
    expect(calculateAge('1990/05/15')).toBeNull();
    expect(calculateAge('1990-13-15')).toBeNull();
    expect(calculateAge('1990-05-32')).toBeNull();
    expect(calculateAge('1990-02-30')).toBeNull();
  });

  it('should return null for future dates', () => {
    expect(calculateAge('2026-01-01')).toBeNull();
  });

  it('should return null for invalid inputs', () => {
    expect(calculateAge(null as unknown as string)).toBeNull();
    expect(calculateAge(undefined as unknown as string)).toBeNull();
    expect(calculateAge('')).toBeNull();
    expect(calculateAge(123 as unknown as string)).toBeNull();
    expect(calculateAge('1990-05')).toBeNull();
    expect(calculateAge('199O-05-15')).toBeNull();
  });

  describe('Month Boundary and Complex Date Scenarios', () => {
    it('should correctly calculate age when born on last day of month', () => {
      // Set current date to March 1, 2024
      jest.setSystemTime(new Date(2024, 2, 1));

      const result = calculateAge('2024-01-31'); // Born Jan 31, 2024

      expect(result).not.toBeNull();
      expect(result?.years).toBe(0);
      expect(result?.months).toBe(1);
      expect(result?.days).toBe(1);
    });

    it('should handle births on May 31 when current date is July 30', () => {
      // Set current date to July 30, 2024
      jest.setSystemTime(new Date(2024, 6, 30));

      const result = calculateAge('2024-05-31'); // Born May 31, 2024

      expect(result).not.toBeNull();
      expect(result?.years).toBe(0);
      expect(result?.months).toBe(1);
      expect(result?.days).toBe(30); // June has 30 days
    });

    it('should handle leap year births crossing into non-leap year', () => {
      // Set current date to March 1, 2021
      jest.setSystemTime(new Date(2021, 2, 1));

      const result = calculateAge('2020-02-29'); // Born Feb 29, 2020 (leap year)

      expect(result).not.toBeNull();
      expect(result?.years).toBe(1);
      expect(result?.months).toBe(0);
      // Days should be calculated correctly across leap/non-leap year boundary
      expect(result?.days).toBeGreaterThanOrEqual(0);
    });

    it('should use correct reference month for day calculation', () => {
      // Set current date to March 1, 2024
      jest.setSystemTime(new Date(2024, 2, 1));

      const result = calculateAge('2024-01-31');

      expect(result).not.toBeNull();
      // Should use February (the previous month from March) for calculating remaining days
      expect(result?.months).toBe(1);
      expect(result?.days).toBe(1);
    });

    it('should handle end of month births crossing to shorter months', () => {
      // Set current date to June 30, 2024
      jest.setSystemTime(new Date(2024, 5, 30));

      const result = calculateAge('2024-01-31'); // Born Jan 31, 2024

      expect(result).not.toBeNull();
      expect(result?.years).toBe(0);
      expect(result?.months).toBe(4);
      expect(result?.days).toBeGreaterThanOrEqual(28);
    });

    it('should handle ISO date strings consistently regardless of timezone', () => {
      // Set current date to March 1, 2024 at 00:00:00
      jest.setSystemTime(new Date(2024, 2, 1, 0, 0, 0));

      // ISO string without time component (should be treated as local date)
      const result = calculateAge('2024-01-15');

      expect(result).not.toBeNull();
      expect(result?.years).toBe(0);
      expect(result?.months).toBe(1);
      expect(result?.days).toBeGreaterThanOrEqual(14);
    });

    it('should produce consistent results regardless of time of day', () => {
      // Test at different times of the day to ensure date-only calculation
      const birthDate = '2024-01-15';

      // Morning
      jest.setSystemTime(new Date(2024, 2, 1, 6, 0, 0));
      const morningResult = calculateAge(birthDate);

      // Evening
      jest.setSystemTime(new Date(2024, 2, 1, 18, 0, 0));
      const eveningResult = calculateAge(birthDate);

      expect(morningResult).toEqual(eveningResult);
    });

    it('should never return negative values in any age component', () => {
      // Test various month-end scenarios that previously could cause negative days
      const testCases = [
        { current: new Date(2024, 2, 1), birth: '2024-01-31' }, // Jan 31 to March 1
        { current: new Date(2024, 6, 30), birth: '2024-05-31' }, // May 31 to July 30
        { current: new Date(2024, 3, 30), birth: '2024-02-29' }, // Feb 29 to April 30
        { current: new Date(2023, 2, 1), birth: '2023-01-31' }, // Non-leap year variant
      ];

      testCases.forEach(({ current, birth }) => {
        jest.setSystemTime(current);
        const result = calculateAge(birth);

        expect(result).not.toBeNull();
        expect(result?.years).toBeGreaterThanOrEqual(0);
        expect(result?.months).toBeGreaterThanOrEqual(0);
        expect(result?.days).toBeGreaterThanOrEqual(0);
      });
    });
  });
});

describe('calculateOnsetDate', () => {
  const mockConsultationDate = new Date(2025, 2, 24);

  beforeEach(() => {
    jest.useFakeTimers();
    jest.setSystemTime(mockConsultationDate);
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('should calculate onset date for different duration units', () => {
    expect(
      calculateOnsetDate(mockConsultationDate, 10, 'days')?.getDate(),
    ).toBe(14);
    expect(
      calculateOnsetDate(mockConsultationDate, 3, 'months')?.getMonth(),
    ).toBe(11);
    expect(
      calculateOnsetDate(mockConsultationDate, 2, 'years')?.getFullYear(),
    ).toBe(2023);
  });

  it('should handle zero duration', () => {
    const result = calculateOnsetDate(mockConsultationDate, 0, 'days');
    expect(result?.getTime()).toBe(mockConsultationDate.getTime());
  });

  it('should handle month boundaries correctly', () => {
    const marchEnd = new Date(2025, 2, 31);
    const result = calculateOnsetDate(marchEnd, 1, 'months');
    expect(result?.getMonth()).toBe(1);
    expect(result?.getDate()).toBe(28);
  });

  it('should handle leap year transitions', () => {
    const leapYearDate = new Date(2024, 1, 29);
    const result = calculateOnsetDate(leapYearDate, 1, 'years');
    expect(result?.getDate()).toBe(28);
  });

  it('should return undefined for invalid inputs', () => {
    expect(
      calculateOnsetDate(mockConsultationDate, null, 'days'),
    ).toBeUndefined();
    expect(calculateOnsetDate(mockConsultationDate, 10, null)).toBeUndefined();
    expect(
      calculateOnsetDate(null as unknown as Date, 10, 'days'),
    ).toBeUndefined();
    expect(
      calculateOnsetDate(
        mockConsultationDate,
        '10' as unknown as number,
        'days',
      ),
    ).toBeUndefined();
    expect(calculateOnsetDate(mockConsultationDate, 10, null)).toBeUndefined();
  });

  it('should not mutate the original date', () => {
    const originalTime = mockConsultationDate.getTime();
    calculateOnsetDate(mockConsultationDate, 10, 'days');
    expect(mockConsultationDate.getTime()).toBe(originalTime);
  });
});

describe('formatDateTime', () => {
  const originalLocalStorage = globalThis.localStorage;

  beforeEach(() => {
    jest.clearAllMocks();
    Object.defineProperty(globalThis, 'localStorage', {
      value: {
        getItem: jest.fn().mockReturnValue('dd/MM/yyyy'),
        setItem: jest.fn(),
        removeItem: jest.fn(),
        clear: jest.fn(),
      },
      writable: true,
    });
  });

  afterEach(() => {
    Object.defineProperty(globalThis, 'localStorage', {
      value: originalLocalStorage,
      writable: true,
    });
  });

  describe('date only (includeTime=false)', () => {
    it('should format valid dates correctly', () => {
      const date = new Date(2024, 2, 28);
      const result = formatDateTime(date, mockT);
      expect(result.formattedResult).toBe('28/03/2024');
      expect(result.error).toBeUndefined();
    });

    it('should format date strings correctly', () => {
      const result = formatDateTime('2024-03-28', mockT);
      expect(result.formattedResult).toBe('28/03/2024');
      expect(result.error).toBeUndefined();
    });

    it('should format timestamps correctly', () => {
      const timestamp = new Date(2024, 2, 28).getTime();
      const result = formatDateTime(timestamp, mockT);
      expect(result.formattedResult).toBe('28/03/2024');
      expect(result.error).toBeUndefined();
    });

    it('should return errors for invalid inputs', () => {
      const invalidResult = formatDateTime('invalid-date', mockT);
      expect(invalidResult.formattedResult).toBe('');
      expect(invalidResult.error).toBeDefined();

      const emptyResult = formatDateTime('', mockT);
      expect(emptyResult.formattedResult).toBe('');
      expect(emptyResult.error).toBeDefined();

      const nullResult = formatDateTime(null as unknown as Date, mockT);
      expect(nullResult.formattedResult).toBe('');
      expect(nullResult.error).toBeDefined();
    });
  });

  describe('with time (includeTime=true)', () => {
    it('should format valid date-time correctly', () => {
      const date = new Date(2024, 2, 28, 12, 30);
      const result = formatDateTime(date, mockT, true);
      expect(result.formattedResult).toBe('28/03/2024 12:30 PM');
      expect(result.error).toBeUndefined();
    });

    it('should format date strings with time correctly', () => {
      const dateString = '2024-03-28T12:30:00Z';
      const result = formatDateTime(dateString, mockT, true);
      expect(result.formattedResult).toMatch(
        /^\d{2}\/\d{2}\/\d{4} \d{1,2}:\d{2} (AM|PM)$/,
      );
      expect(result.error).toBeUndefined();
    });

    it('should format timestamps correctly', () => {
      const timestamp = new Date(2024, 2, 28, 12, 30).getTime();
      const result = formatDateTime(timestamp, mockT, true);
      expect(result.formattedResult).toBe('28/03/2024 12:30 PM');
      expect(result.error).toBeUndefined();
    });

    it('should return errors for invalid inputs', () => {
      expect(formatDateTime('invalid-date', mockT, true).error).toBeDefined();
      expect(formatDateTime('', mockT, true).error).toBeDefined();
      expect(
        formatDateTime(null as unknown as Date, mockT, true).error,
      ).toBeDefined();
      expect(
        formatDateTime({} as unknown as Date, mockT, true).error,
      ).toBeDefined();
    });
  });
});

describe('formatDateTime locale support', () => {
  const originalLocalStorage = globalThis.localStorage;

  beforeEach(() => {
    jest.clearAllMocks();
    Object.defineProperty(globalThis, 'localStorage', {
      value: {
        getItem: jest.fn(),
        setItem: jest.fn(),
        removeItem: jest.fn(),
        clear: jest.fn(),
      },
      writable: true,
    });
  });

  afterEach(() => {
    Object.defineProperty(globalThis, 'localStorage', {
      value: originalLocalStorage,
      writable: true,
    });
  });

  it('should use localStorage format when available', () => {
    (globalThis.localStorage.getItem as jest.Mock).mockReturnValue(
      'MMMM dd, yyyy',
    );

    const result = formatDateTime('2024-03-28', mockT);
    expect(result.formattedResult).toBe('March 28, 2024');
  });

  it('should use locale-aware P token when localStorage is empty', () => {
    (globalThis.localStorage.getItem as jest.Mock).mockReturnValue(null);

    const result = formatDateTime('2024-03-28', mockT);
    expect(result.formattedResult).toMatch(/^\d{2}\/\d{2}\/\d{4}$/);
    expect(result.error).toBeUndefined();
  });

  it('should fallback to DEFAULT_DATE_FORMAT when localStorage throws error', () => {
    (globalThis.localStorage.getItem as jest.Mock).mockImplementation(() => {
      throw new Error('localStorage error');
    });

    const result = formatDateTime('2024-03-28', mockT);
    expect(result.formattedResult).toBe('28/03/2024');
  });

  it('should use custom dateFormat parameter when provided', () => {
    (globalThis.localStorage.getItem as jest.Mock).mockReturnValue(
      'dd/MM/yyyy',
    );

    const result = formatDateTime('2024-03-28', mockT, false, 'yyyy-MM-dd');
    expect(result.formattedResult).toBe('2024-03-28');
    expect(result.error).toBeUndefined();
  });

  it('should NOT append time format when dateFormat is provided even if includeTime is true', () => {
    const date = new Date(2024, 2, 28, 14, 30);
    const result = formatDateTime(date, mockT, true, 'yyyy-MM-dd');
    expect(result.formattedResult).toBe('2024-03-28');
    expect(result.error).toBeUndefined();
  });
});

describe('formatDateDistance', () => {
  const mockedGetUserPreferredLocale = jest.mocked(getUserPreferredLocale);
  const mockCurrentDate = new Date('2025-06-18T07:02:38.000Z');

  beforeEach(() => {
    jest.useFakeTimers();
    jest.setSystemTime(mockCurrentDate);
    jest.clearAllMocks();
    mockedGetUserPreferredLocale.mockReturnValue('en');
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('should format different time periods correctly', () => {
    expect(
      formatDateDistance('2025-06-17T07:02:38.000Z', mockT).formattedResult,
    ).toBe('1 day');
    expect(
      formatDateDistance('2025-06-16T07:02:38.000Z', mockT).formattedResult,
    ).toBe('2 days');
    expect(
      formatDateDistance('2025-05-18T07:02:38.000Z', mockT).formattedResult,
    ).toBe('1 month');
    expect(
      formatDateDistance('2025-03-18T07:02:38.000Z', mockT).formattedResult,
    ).toBe('3 months');
    expect(
      formatDateDistance('2024-06-18T07:02:38.000Z', mockT).formattedResult,
    ).toBe('1 year');
    expect(
      formatDateDistance('2023-06-18T07:02:38.000Z', mockT).formattedResult,
    ).toBe('2 years');
  });

  it('should round up small time periods to 1 day', () => {
    expect(
      formatDateDistance('2025-06-18T03:02:38.000Z', mockT).formattedResult,
    ).toBe('1 day');
    expect(
      formatDateDistance('2025-06-18T06:32:38.000Z', mockT).formattedResult,
    ).toBe('1 day');
  });

  it('should handle fractional years correctly', () => {
    expect(
      formatDateDistance('2023-12-18T07:02:38.000Z', mockT).formattedResult,
    ).toBe('1.5 years');
    expect(
      formatDateDistance('2020-07-18T07:02:38.000Z', mockT).formattedResult,
    ).toBe('5 years');
  });

  it('should format 11 months as 1 year', () => {
    expect(
      formatDateDistance('2024-07-18T07:02:38.000Z', mockT).formattedResult,
    ).toBe('1 year');
  });

  it('should handle month rounding', () => {
    expect(formatDateDistance('2025-05-01', mockT).formattedResult).toBe(
      '2 months',
    );
    expect(formatDateDistance('2025-05-10', mockT).formattedResult).toBe(
      '1 month',
    );
  });

  it('should return errors for invalid inputs', () => {
    expect(formatDateDistance('', mockT).error).toBeDefined();
    expect(formatDateDistance('invalid-date', mockT).error).toBeDefined();
    expect(
      formatDateDistance(null as unknown as string, mockT).error,
    ).toBeDefined();
    expect(
      formatDateDistance(undefined as unknown as string, mockT).error,
    ).toBeDefined();
    expect(
      formatDateDistance(123 as unknown as string, mockT).error,
    ).toBeDefined();
  });
});

describe('sortByDate', () => {
  it('should sort by date in descending order by default', () => {
    const testData = [
      { id: 1, date: '2025-01-15T10:00:00Z' },
      { id: 2, date: '2025-01-10T10:00:00Z' },
      { id: 3, date: '2025-01-20T10:00:00Z' },
    ];

    const result = sortByDate(testData, 'date');
    expect(result.map((item) => item.id)).toEqual([3, 1, 2]);
  });

  it('should sort by date in ascending order when specified', () => {
    const testData = [
      { id: 1, date: '2025-01-15T10:00:00Z' },
      { id: 2, date: '2025-01-10T10:00:00Z' },
      { id: 3, date: '2025-01-20T10:00:00Z' },
    ];

    const result = sortByDate(testData, 'date', true);
    expect(result.map((item) => item.id)).toEqual([2, 1, 3]);
  });

  it('should handle different date formats', () => {
    const testData = [
      { id: 1, date: '2025-01-15' },
      { id: 2, date: '2025-01-10T10:00:00Z' },
      { id: 3, date: '2025-01-20T15:30:00.000Z' },
    ];

    const result = sortByDate(testData, 'date', true);
    expect(result.map((item) => item.id)).toEqual([2, 1, 3]);
  });

  it('should maintain stable sort for equal dates', () => {
    const testData = [
      { id: 1, date: '2025-01-15T10:00:00Z' },
      { id: 2, date: '2025-01-15T10:00:00Z' },
      { id: 3, date: '2025-01-15T10:00:00Z' },
    ];

    const result = sortByDate(testData, 'date');
    expect(result.map((item) => item.id)).toEqual([1, 2, 3]);
  });

  it('should handle invalid dates by sorting them to the end', () => {
    const testData = [
      { id: 1, date: '2025-01-15T10:00:00Z' },
      { id: 2, date: 'invalid' },
      { id: 3, date: null },
      { id: 4, date: '2025-01-20T10:00:00Z' },
    ];

    const result = sortByDate(testData, 'date');
    expect(result[0].id).toBe(4);
    expect(result[1].id).toBe(1);
    expect([2, 3]).toContain(result[2].id);
  });

  it('should handle edge cases gracefully', () => {
    expect(sortByDate([], 'date')).toEqual([]);
    expect(sortByDate(null as unknown as Date[], 'date')).toEqual([]);
    expect(sortByDate('not-an-array' as unknown as Date[], 'date')).toEqual([]);

    const singleItem = [{ id: 1, date: '2025-01-15T10:00:00Z' }];
    expect(sortByDate(singleItem, 'date')).toEqual(singleItem);
  });
});

describe('getFormattedAge', () => {
  const mockDate = new Date(2024, 2, 28);

  beforeEach(() => {
    jest.useFakeTimers();
    jest.setSystemTime(mockDate);
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  const mockTFunction = jest.fn((key: string, options?: { count?: number }) => {
    if (key === 'YEARS') return options?.count === 1 ? ' Year' : ' Years';
    if (key === 'MONTHS') return options?.count === 1 ? ' Month' : ' Months';
    if (key === 'DAYS') return options?.count === 1 ? ' Day' : ' Days';
    return key;
  });

  it.each([
    {
      description: 'should calculate age correctly with timestamp input',
      birthDate: new Date(2000, 2, 28).getTime(),
      translateFn: mockTFunction,
      expected: '24 Years 0 Months 0 Days',
    },
    {
      description: 'should calculate age correctly with string input',
      birthDate: '2000-03-28',
      translateFn: mockTFunction,
      expected: '24 Years 0 Months 0 Days',
    },
    {
      description:
        'should show years and months and days including zeros for >= 1 year',
      birthDate: new Date(2018, 11, 28).getTime(),
      translateFn: mockTFunction,
      expected: '5 Years 3 Months 0 Days',
    },
    {
      description: 'should show months and days for >= 3 months but < 1 year',
      birthDate: new Date(2023, 8, 28).getTime(),
      translateFn: mockTFunction,
      expected: '6 Months 0 Days',
    },
    {
      description: 'should handle infants under 3 months showing only days',
      birthDate: new Date(2024, 1, 29).getTime(),
      translateFn: mockTFunction,
      expected: '28 Days',
    },
    {
      description: 'should return 0 Days for newborn (same day)',
      birthDate: new Date(2024, 2, 28).getTime(),
      translateFn: mockTFunction,
      expected: '0 Days',
    },
    {
      description: 'should use singular forms for values of 1',
      birthDate: new Date(2023, 1, 27).getTime(),
      translateFn: mockTFunction,
      expected: '1 Year 1 Month 1 Day',
    },
    {
      description:
        'should format age with fallback units when no translation function is passed',
      birthDate: new Date(2000, 2, 28).getTime(),
      translateFn: undefined,
      expected: '24 years 0 months 0 days',
    },
  ])('$description', ({ birthDate, translateFn, expected }) => {
    const result = getFormattedAge(birthDate, translateFn);
    expect(result).toBe(expected);
  });
});

describe('DURATION_UNIT_TO_DAYS', () => {
  test('contains all expected duration unit conversions', () => {
    expect(DURATION_UNIT_TO_DAYS).toEqual({
      d: 1,
      wk: 7,
      mo: 30,
      a: 365,
      h: 1 / 24,
      min: 1 / 1440,
      s: 1 / 86400,
    });
  });
});

describe('doDateRangesOverlap', () => {
  test('detects overlap when ranges overlap in the middle', () => {
    const start1 = new Date('2025-01-01');
    const end1 = new Date('2025-01-10');
    const start2 = new Date('2025-01-05');
    const end2 = new Date('2025-01-15');

    expect(doDateRangesOverlap(start1, end1, start2, end2)).toBe(true);
  });

  test('detects no overlap when ranges are separate', () => {
    const start1 = new Date('2025-01-01');
    const end1 = new Date('2025-01-05');
    const start2 = new Date('2025-01-10');
    const end2 = new Date('2025-01-15');

    expect(doDateRangesOverlap(start1, end1, start2, end2)).toBe(false);
  });

  test('detects overlap when ranges touch at edges', () => {
    const start1 = new Date('2025-01-01');
    const end1 = new Date('2025-01-10');
    const start2 = new Date('2025-01-10');
    const end2 = new Date('2025-01-15');

    expect(doDateRangesOverlap(start1, end1, start2, end2)).toBe(true);
  });
});

describe('calculateEndDate', () => {
  test('calculates end date with day duration', () => {
    const startDate = new Date('2025-01-01');
    const endDate = calculateEndDate(startDate, 7, 'd');

    expect(endDate).toEqual(addDays(startDate, 7));
  });

  test('calculates end date with week duration', () => {
    const startDate = new Date('2025-01-01');
    const endDate = calculateEndDate(startDate, 2, 'wk');

    expect(endDate).toEqual(addDays(startDate, 14));
  });

  test('throws error for invalid date', () => {
    expect(() => calculateEndDate('invalid-date', 7, 'd')).toThrow(
      'Invalid date',
    );
  });
});
