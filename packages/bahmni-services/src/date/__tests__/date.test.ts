import { format, parseISO } from 'date-fns';
import { getUserPreferredLocale } from '../../i18n/translationService';
import { DATE_TIME_FORMAT } from '../constants';
import {
  calculateAge,
  formatDate,
  formatDateTime,
  calculateOnsetDate,
  formatDateDistance,
  sortByDate,
} from '../date';

jest.mock('i18next', () => ({
  t: jest.fn((key: string, options?: { count?: number }) => {
    const { count = 1 } = options ?? {};

    switch (key) {
      case 'CLINICAL_DAYS_TRANSLATION_KEY':
        return count === 1 ? 'day' : 'days';
      case 'CLINICAL_MONTHS_TRANSLATION_KEY':
        return count === 1 ? 'month' : 'months';
      case 'CLINICAL_YEARS_TRANSLATION_KEY':
        return count === 1 ? 'year' : 'years';
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
  }),
}));

jest.mock('../../i18n/translationService', () => ({
  getUserPreferredLocale: jest.fn(),
}));

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

describe('formatDate', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should format valid dates correctly', () => {
    const date = new Date(2024, 2, 28);
    const result = formatDate(date);
    expect(result.formattedResult).toBe('28/03/2024');
    expect(result.error).toBeUndefined();
  });

  it('should format date strings correctly', () => {
    const result = formatDate('2024-03-28');
    expect(result.formattedResult).toBe('28/03/2024');
    expect(result.error).toBeUndefined();
  });

  it('should format timestamps correctly', () => {
    const timestamp = new Date(2024, 2, 28).getTime();
    const result = formatDate(timestamp);
    expect(result.formattedResult).toBe('28/03/2024');
    expect(result.error).toBeUndefined();
  });

  it('should accept custom format parameter', () => {
    const date = new Date(2024, 2, 28);
    const result = formatDate(date, 'MMMM d, yyyy');
    expect(result.formattedResult).toBe('March 28, 2024');
    expect(result.error).toBeUndefined();
  });

  it('should return errors for invalid inputs', () => {
    const invalidResult = formatDate('invalid-date');
    expect(invalidResult.formattedResult).toBe('');
    expect(invalidResult.error).toBeDefined();

    const emptyResult = formatDate('');
    expect(emptyResult.formattedResult).toBe('');
    expect(emptyResult.error).toBeDefined();

    const nullResult = formatDate(null as unknown as Date);
    expect(nullResult.formattedResult).toBe('');
    expect(nullResult.error).toBeDefined();
  });
});

describe('formatDateTime', () => {
  it('should format valid date-time correctly', () => {
    const date = new Date(2024, 2, 28, 12, 30);
    const result = formatDateTime(date);
    expect(result.formattedResult).toBe(format(date, DATE_TIME_FORMAT));
    expect(result.error).toBeUndefined();
  });

  it('should format date strings with time correctly', () => {
    const dateString = '2024-03-28T12:30:00Z';
    const result = formatDateTime(dateString);
    expect(result.formattedResult).toBe(
      format(parseISO(dateString), DATE_TIME_FORMAT),
    );
    expect(result.error).toBeUndefined();
  });

  it('should format timestamps correctly', () => {
    const timestamp = new Date(2024, 2, 28, 12, 30).getTime();
    const result = formatDateTime(timestamp);
    expect(result.formattedResult).toBe('28/03/2024 12:30');
    expect(result.error).toBeUndefined();
  });

  it('should return errors for invalid inputs', () => {
    expect(formatDateTime('invalid-date').error).toBeDefined();
    expect(formatDateTime('').error).toBeDefined();
    expect(formatDateTime(null as unknown as Date).error).toBeDefined();
    expect(formatDateTime({} as unknown as Date).error).toBeDefined();
  });
});

describe('formatDate locale support', () => {
  const mockedGetUserPreferredLocale = jest.mocked(getUserPreferredLocale);

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should format with different locales', () => {
    mockedGetUserPreferredLocale.mockReturnValue('en');
    expect(formatDate('2024-03-28', 'MMMM dd, yyyy').formattedResult).toBe(
      'March 28, 2024',
    );

    mockedGetUserPreferredLocale.mockReturnValue('es');
    expect(formatDate('2024-03-28', 'MMMM dd, yyyy').formattedResult).toBe(
      'marzo 28, 2024',
    );

    mockedGetUserPreferredLocale.mockReturnValue('fr');
    expect(formatDate('2024-03-28', 'MMMM dd, yyyy').formattedResult).toBe(
      'mars 28, 2024',
    );
  });

  it('should fallback to English for unsupported locales', () => {
    mockedGetUserPreferredLocale.mockReturnValue('unsupported-locale');
    const result = formatDate('2024-03-28', 'MMMM dd, yyyy');
    expect(result.formattedResult).toBe('March 28, 2024');
  });

  it('should use numeric format regardless of locale for default format', () => {
    ['en', 'es', 'fr'].forEach((locale) => {
      mockedGetUserPreferredLocale.mockReturnValue(locale);
      const result = formatDate('2024-03-28');
      expect(result.formattedResult).toBe('28/03/2024');
    });
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
    expect(formatDateDistance('2025-06-17T07:02:38.000Z').formattedResult).toBe(
      '1 day',
    );
    expect(formatDateDistance('2025-06-16T07:02:38.000Z').formattedResult).toBe(
      '2 days',
    );
    expect(formatDateDistance('2025-05-18T07:02:38.000Z').formattedResult).toBe(
      '1 month',
    );
    expect(formatDateDistance('2025-03-18T07:02:38.000Z').formattedResult).toBe(
      '3 months',
    );
    expect(formatDateDistance('2024-06-18T07:02:38.000Z').formattedResult).toBe(
      '1 year',
    );
    expect(formatDateDistance('2023-06-18T07:02:38.000Z').formattedResult).toBe(
      '2 years',
    );
  });

  it('should round up small time periods to 1 day', () => {
    expect(formatDateDistance('2025-06-18T03:02:38.000Z').formattedResult).toBe(
      '1 day',
    );
    expect(formatDateDistance('2025-06-18T06:32:38.000Z').formattedResult).toBe(
      '1 day',
    );
  });

  it('should handle fractional years correctly', () => {
    expect(formatDateDistance('2023-12-18T07:02:38.000Z').formattedResult).toBe(
      '1.5 years',
    );
    expect(formatDateDistance('2020-07-18T07:02:38.000Z').formattedResult).toBe(
      '5 years',
    );
  });

  it('should format 11 months as 1 year', () => {
    expect(formatDateDistance('2024-07-18T07:02:38.000Z').formattedResult).toBe(
      '1 year',
    );
  });

  it('should handle month rounding', () => {
    expect(formatDateDistance('2025-05-01').formattedResult).toBe('2 months');
    expect(formatDateDistance('2025-05-10').formattedResult).toBe('1 month');
  });

  it('should return errors for invalid inputs', () => {
    expect(formatDateDistance('').error).toBeDefined();
    expect(formatDateDistance('invalid-date').error).toBeDefined();
    expect(formatDateDistance(null as unknown as string).error).toBeDefined();
    expect(
      formatDateDistance(undefined as unknown as string).error,
    ).toBeDefined();
    expect(formatDateDistance(123 as unknown as string).error).toBeDefined();
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
