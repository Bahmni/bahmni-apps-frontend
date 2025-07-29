import { format, parseISO } from 'date-fns';
import i18n from '@/setupTests.i18n';
import { DATE_TIME_FORMAT } from '@constants/date';
import { DATE_ERROR_MESSAGES } from '@constants/errors';
import { getUserPreferredLocale } from '@services/translationService';
import {
  calculateAge,
  formatDate,
  formatDateTime,
  calculateOnsetDate,
  formatDateDistance,
  sortByDate,
} from '../date';

jest.mock('@utils/common', () => ({
  generateId: jest.fn().mockReturnValue('generated-id'),
  getFormattedError: jest.fn().mockImplementation((error) => {
    if (error instanceof Error) {
      return { title: error.name || 'Error', message: error.message };
    }
    return { title: 'Error', message: 'An unexpected error occurred' };
  }),
}));

jest.mock('@services/translationService', () => ({
  getUserPreferredLocale: jest.fn(),
}));

describe('calculateAge', () => {
  // Store the original Date implementation and mock date
  const mockDate = new Date(2025, 2, 24); // 2025-03-24 (Month is 0-indexed in JS Date)

  // Mock date for consistent testing
  beforeEach(() => {
    // Mock current date for testing
    jest.useFakeTimers();
    jest.setSystemTime(mockDate);
  });

  // Restore original Date after tests
  afterEach(() => {
    jest.useRealTimers();
  });

  // Happy path tests
  it('should calculate age correctly for a past date', () => {
    const result = calculateAge('1990-05-15');
    expect(result).not.toBeNull();
    expect(result?.years).toBe(34); // 2025 - 1990 = 35, but birthday hasn't occurred yet in March
    expect(result?.months).toBe(10); // 10 months since last birthday
    expect(result?.days).toBe(9); // 9 days since last month anniversary
  });

  it('should calculate age correctly when birthday is today', () => {
    const result = calculateAge('2000-03-24');
    expect(result).not.toBeNull();
    expect(result?.years).toBe(25); // 2025 - 2000 = 25, birthday is today
    expect(result?.months).toBe(0); // 0 months since birthday is today
    expect(result?.days).toBe(0); // 0 days since birthday is today
  });

  it('should calculate age correctly when birthday was yesterday', () => {
    const result = calculateAge('2000-03-23');
    expect(result).not.toBeNull();
    expect(result?.years).toBe(25); // 2025 - 2000 = 25, birthday has occurred this year
    expect(result?.months).toBe(0); // 0 months since birthday just happened
    expect(result?.days).toBe(1); // 1 day since birthday
  });

  it('should calculate age correctly for February 29th in a leap year', () => {
    const result = calculateAge('2000-02-29'); // 2000 was a leap year
    expect(result).not.toBeNull();
    expect(result?.years).toBe(25); // 2025 - 2000 = 25, birthday has occurred this year
    expect(result?.months).toBe(0); // Testing month calculation for leap year
    expect(result?.days).toBe(24); // Days since Feb 29 (treated as Feb 28 in non-leap years)
  });

  it('should calculate age correctly for a date many years', () => {
    const result = calculateAge('1925-01-01');
    expect(result).not.toBeNull();
    expect(result?.years).toBe(100); // 2025 - 1925 = 100, birthday has occurred this year
    expect(result?.months).toBe(2); // 2 months since January
    expect(result?.days).toBe(23); // 23 days in current month
  });

  it('should calculate age correctly for a recent date', () => {
    const result = calculateAge('2024-01-01');
    expect(result).not.toBeNull();
    expect(result?.years).toBe(1); // 2025 - 2024 = 1, birthday has occurred this year
    expect(result?.months).toBe(2); // 2 months since January
    expect(result?.days).toBe(23); // 23 days in current month
  });

  it('should calculate age as 0 years for a child less than 1 year old', () => {
    const result = calculateAge('2024-12-31');
    expect(result).not.toBeNull();
    expect(result?.years).toBe(0); // Child born less than a year
    expect(result?.months).toBe(2); // 2 months since December 31
    expect(result?.days).toBe(24); // 24 days in current month
  });

  it('should calculate months and days correctly for a child born 2 months', () => {
    const result = calculateAge('2025-01-24');
    expect(result).not.toBeNull();
    expect(result?.years).toBe(0); // Child born less than a year
    expect(result?.months).toBe(2); // Exactly 2 months
    expect(result?.days).toBe(0); // Exactly on the day
  });

  // Sad path tests
  it('should return null for invalid date format', () => {
    const result = calculateAge('05/15/1990'); // MM/DD/YYYY format
    expect(result).toBeNull();
  });

  it('should return null for date with invalid separators', () => {
    const result = calculateAge('1990/05/15'); // Using / instead of -
    expect(result).toBeNull();
  });

  it('should return null for date with invalid month (> 12)', () => {
    const result = calculateAge('1990-13-15');
    expect(result).toBeNull();
  });

  it('should return null for date with invalid day (> 31)', () => {
    const result = calculateAge('1990-05-32');
    expect(result).toBeNull();
  });

  it('should return null for non-existent date (February 30th)', () => {
    const result = calculateAge('1990-02-30');
    expect(result).toBeNull();
  });

  it('should return null for future date', () => {
    const result = calculateAge('2026-01-01'); // Future date
    expect(result).toBeNull();
  });

  it('should return null for null input', () => {
    const result = calculateAge(null as unknown as string);
    expect(result).toBeNull();
  });

  it('should return null for undefined input', () => {
    const result = calculateAge(undefined as unknown as string);
    expect(result).toBeNull();
  });

  it('should return null for empty string', () => {
    const result = calculateAge('');
    expect(result).toBeNull();
  });

  it('should return null for non-string input', () => {
    const result = calculateAge(123 as unknown as string);
    expect(result).toBeNull();
  });

  it('should return null for malformed date string (missing parts)', () => {
    const result = calculateAge('1990-05');
    expect(result).toBeNull();
  });

  it('should return null for malformed date string (extra parts)', () => {
    const result = calculateAge('1990-05-15-00');
    expect(result).toBeNull();
  });

  it('should return null for date string with non-numeric characters', () => {
    const result = calculateAge('199O-05-15'); // Using letter O instead of zero
    expect(result).toBeNull();
  });
});

describe('calculateOnsetDate', () => {
  // Mock date for consistent testing
  const mockConsultationDate = new Date(2025, 2, 24); // March 24, 2025

  beforeEach(() => {
    jest.useFakeTimers();
    jest.setSystemTime(mockConsultationDate);
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe('Happy Path Tests', () => {
    it('should calculate onset date correctly for days duration', () => {
      const result = calculateOnsetDate(mockConsultationDate, 10, 'days');
      expect(result).toBeInstanceOf(Date);
      expect(result?.getFullYear()).toBe(2025);
      expect(result?.getMonth()).toBe(2); // March (0-indexed)
      expect(result?.getDate()).toBe(14); // 24 - 10 = 14
    });

    it('should calculate onset date correctly for months duration', () => {
      const result = calculateOnsetDate(mockConsultationDate, 3, 'months');
      expect(result).toBeInstanceOf(Date);
      expect(result?.getFullYear()).toBe(2024);
      expect(result?.getMonth()).toBe(11); // December (0-indexed)
      expect(result?.getDate()).toBe(24); // Same date, 3 months back
    });

    it('should calculate onset date correctly for years duration', () => {
      const result = calculateOnsetDate(mockConsultationDate, 2, 'years');
      expect(result).toBeInstanceOf(Date);
      expect(result?.getFullYear()).toBe(2023);
      expect(result?.getMonth()).toBe(2); // March (0-indexed)
      expect(result?.getDate()).toBe(24); // Same date and month, 2 years back
    });

    it('should handle single day duration', () => {
      const result = calculateOnsetDate(mockConsultationDate, 1, 'days');
      expect(result).toBeInstanceOf(Date);
      expect(result?.getFullYear()).toBe(2025);
      expect(result?.getMonth()).toBe(2); // March (0-indexed)
      expect(result?.getDate()).toBe(23); // Yesterday
    });

    it('should handle single month duration', () => {
      const result = calculateOnsetDate(mockConsultationDate, 1, 'months');
      expect(result).toBeInstanceOf(Date);
      expect(result?.getFullYear()).toBe(2025);
      expect(result?.getMonth()).toBe(1); // February (0-indexed)
      expect(result?.getDate()).toBe(24); // Same date, 1 month back
    });

    it('should handle single year duration', () => {
      const result = calculateOnsetDate(mockConsultationDate, 1, 'years');
      expect(result).toBeInstanceOf(Date);
      expect(result?.getFullYear()).toBe(2024);
      expect(result?.getMonth()).toBe(2); // March (0-indexed)
      expect(result?.getDate()).toBe(24); // Same date and month, 1 year back
    });

    it('should handle large duration values', () => {
      const result = calculateOnsetDate(mockConsultationDate, 365, 'days');
      expect(result).toBeInstanceOf(Date);
      expect(result?.getFullYear()).toBe(2024);
      expect(result?.getMonth()).toBe(2); // March (0-indexed)
      expect(result?.getDate()).toBe(24); // Approximately 1 year back
    });
  });

  describe('Edge Cases', () => {
    it('should return undefined when duration value is null', () => {
      const result = calculateOnsetDate(mockConsultationDate, null, 'days');
      expect(result).toBeUndefined();
    });

    it('should return undefined when duration unit is null', () => {
      const result = calculateOnsetDate(mockConsultationDate, 10, null);
      expect(result).toBeUndefined();
    });

    it('should return undefined when both duration value and unit are null', () => {
      const result = calculateOnsetDate(mockConsultationDate, null, null);
      expect(result).toBeUndefined();
    });

    it('should handle zero duration value', () => {
      const result = calculateOnsetDate(mockConsultationDate, 0, 'days');
      expect(result).toBeInstanceOf(Date);
      expect(result?.getTime()).toBe(mockConsultationDate.getTime());
    });

    it('should handle zero duration for months', () => {
      const result = calculateOnsetDate(mockConsultationDate, 0, 'months');
      expect(result).toBeInstanceOf(Date);
      expect(result?.getTime()).toBe(mockConsultationDate.getTime());
    });

    it('should handle zero duration for years', () => {
      const result = calculateOnsetDate(mockConsultationDate, 0, 'years');
      expect(result).toBeInstanceOf(Date);
      expect(result?.getTime()).toBe(mockConsultationDate.getTime());
    });

    it('should handle month boundary correctly - from March to February', () => {
      const result = calculateOnsetDate(mockConsultationDate, 1, 'months');
      expect(result?.getMonth()).toBe(1); // February (0-indexed)
      expect(result?.getDate()).toBe(24); // Same date
    });

    it('should handle year boundary correctly - from March to previous year', () => {
      const result = calculateOnsetDate(mockConsultationDate, 12, 'months');
      expect(result?.getFullYear()).toBe(2024);
      expect(result?.getMonth()).toBe(2); // March (0-indexed)
      expect(result?.getDate()).toBe(24); // Same date
    });

    it('should handle leap year correctly', () => {
      const leapYearDate = new Date(2024, 1, 29); // February 29, 2024 (leap year)
      const result = calculateOnsetDate(leapYearDate, 1, 'years');
      expect(result?.getFullYear()).toBe(2023);
      expect(result?.getMonth()).toBe(1); // February (0-indexed)
      // Should handle leap year date appropriately
      expect(result?.getDate()).toBe(28); // Feb 28 in non-leap year
    });

    it('should handle end of month dates correctly', () => {
      const endOfMonth = new Date(2025, 0, 31); // January 31, 2025
      const result = calculateOnsetDate(endOfMonth, 1, 'months');
      expect(result?.getFullYear()).toBe(2024);
      expect(result?.getMonth()).toBe(11); // December (0-indexed)
      expect(result?.getDate()).toBe(31); // December has 31 days
    });

    it('should handle month with fewer days correctly', () => {
      const marchEnd = new Date(2025, 2, 31); // March 31, 2025
      const result = calculateOnsetDate(marchEnd, 1, 'months');
      expect(result?.getFullYear()).toBe(2025);
      expect(result?.getMonth()).toBe(1); // February (0-indexed)
      // February 2025 has 28 days, so should adjust to Feb 28
      expect(result?.getDate()).toBe(28);
    });
  });

  describe('Validation Tests', () => {
    it('should handle negative duration values gracefully', () => {
      const result = calculateOnsetDate(mockConsultationDate, -10, 'days');
      expect(result).toBeInstanceOf(Date);
      // Negative values should add to the date instead of subtracting
      expect(result?.getDate()).toBe(3); // 24 + 10 = 34, which becomes April 3rd
    });

    it('should handle very large duration values', () => {
      const result = calculateOnsetDate(mockConsultationDate, 10000, 'days');
      expect(result).toBeInstanceOf(Date);
      // Should still return a valid date, even if very far in the past
      expect(result?.getFullYear()).toBeLessThan(2000);
    });

    it('should not mutate the original consultation date', () => {
      const originalTime = mockConsultationDate.getTime();
      calculateOnsetDate(mockConsultationDate, 10, 'days');
      expect(mockConsultationDate.getTime()).toBe(originalTime);
    });
  });

  describe('Type Safety Tests', () => {
    it('should handle invalid duration unit gracefully', () => {
      const result = calculateOnsetDate(
        mockConsultationDate,
        10,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        'invalid' as any,
      );
      expect(result).toBeUndefined();
    });

    it('should handle string duration value by treating as undefined', () => {
      const result = calculateOnsetDate(
        mockConsultationDate,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        '10' as any,
        'days',
      );
      expect(result).toBeUndefined();
    });

    it('should handle undefined consultation date', () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const result = calculateOnsetDate(undefined as any, 10, 'days');
      expect(result).toBeUndefined();
    });

    it('should handle null consultation date', () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const result = calculateOnsetDate(null as any, 10, 'days');
      expect(result).toBeUndefined();
    });
  });

  describe('Real-world Scenarios', () => {
    it('should calculate onset for chronic conditions (years)', () => {
      const result = calculateOnsetDate(mockConsultationDate, 5, 'years');
      expect(result?.getFullYear()).toBe(2020);
      expect(result?.getMonth()).toBe(2); // March
      expect(result?.getDate()).toBe(24);
    });

    it('should calculate onset for recent conditions (days)', () => {
      const result = calculateOnsetDate(mockConsultationDate, 7, 'days');
      expect(result?.getFullYear()).toBe(2025);
      expect(result?.getMonth()).toBe(2); // March
      expect(result?.getDate()).toBe(17); // A week
    });

    it('should calculate onset for medium-term conditions (months)', () => {
      const result = calculateOnsetDate(mockConsultationDate, 6, 'months');
      expect(result?.getFullYear()).toBe(2024);
      expect(result?.getMonth()).toBe(8); // September (0-indexed)
      expect(result?.getDate()).toBe(24);
    });

    it('should handle COVID-related timeline (2-3 years)', () => {
      const result = calculateOnsetDate(mockConsultationDate, 2, 'years');
      expect(result?.getFullYear()).toBe(2023);
      expect(result?.getMonth()).toBe(2); // March 2023
      expect(result?.getDate()).toBe(24);
    });
  });
});

describe('Date Utility Functions', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('formatDate', () => {
    it('should return a formatted date string for a valid Date object', () => {
      const date = new Date(2024, 2, 28); // March 28, 2024
      const formatted = formatDate(date);
      expect(formatted.formattedResult).toBe('28/03/2024'); // Default DATE_FORMAT
      expect(formatted.error).toBeUndefined();
    });

    it('should return a formatted date string for a valid date string', () => {
      const dateString = '2024-03-28';
      const formatted = formatDate(dateString);
      expect(formatted.formattedResult).toBe('28/03/2024'); // Default DATE_FORMAT
      expect(formatted.error).toBeUndefined();
    });

    it('should return an empty string and error object for an invalid date string', () => {
      const formatted = formatDate('invalid-date');
      expect(formatted.formattedResult).toBe('');
      expect(formatted.error).toBeDefined();
      expect(formatted.error?.title).toBe(
        i18n.t(DATE_ERROR_MESSAGES.PARSE_ERROR),
      );
      expect(formatted.error?.message).toBe(
        i18n.t(DATE_ERROR_MESSAGES.INVALID_FORMAT),
      );
    });

    it('should handle empty string input', () => {
      const formatted = formatDate('');
      expect(formatted.formattedResult).toBe('');
      expect(formatted.error).toBeDefined();
      expect(formatted.error?.title).toBe(
        i18n.t(DATE_ERROR_MESSAGES.PARSE_ERROR),
      );
      expect(formatted.error?.message).toBe(
        i18n.t(DATE_ERROR_MESSAGES.EMPTY_OR_INVALID),
      );
    });

    it('should handle null input', () => {
      /* eslint-disable  @typescript-eslint/no-explicit-any */
      const formatted = formatDate(null as any);
      /* eslint-enable @typescript-eslint/no-explicit-any */
      expect(formatted.formattedResult).toBe('');
      expect(formatted.error).toBeDefined();
    });

    it('should handle timestamp input', () => {
      const timestamp = new Date(2024, 2, 28).getTime();
      const formatted = formatDate(timestamp);
      expect(formatted.formattedResult).toBe('28/03/2024'); // Default DATE_FORMAT
      expect(formatted.error).toBeUndefined();
    });

    it('should accept custom format parameter', () => {
      const date = new Date(2024, 2, 28); // March 28, 2024
      const formatted = formatDate(date, 'MMMM d, yyyy');
      expect(formatted.formattedResult).toBe('March 28, 2024'); // Custom format
      expect(formatted.error).toBeUndefined();
    });

    it('should use default format when no format parameter is provided', () => {
      const date = new Date(2024, 2, 28); // March 28, 2024
      const formatted = formatDate(date);
      expect(formatted.formattedResult).toBe('28/03/2024'); // Default DATE_FORMAT
      expect(formatted.error).toBeUndefined();
    });
  });

  describe('formatDateTime', () => {
    it('should return a formatted date-time string for a valid Date object', () => {
      const date = new Date(2024, 2, 28, 12, 30); // March 28, 2024, 12:30 PM
      const formatted = formatDateTime(date);
      expect(formatted.formattedResult).toBe(format(date, DATE_TIME_FORMAT));
      expect(formatted.error).toBeUndefined();
    });

    it('should return a formatted date-time string for a valid date string', () => {
      const dateString = '2024-03-28T12:30:00Z';
      const formatted = formatDateTime(dateString);
      expect(formatted.formattedResult).toBe(
        format(parseISO(dateString), DATE_TIME_FORMAT),
      );
      expect(formatted.error).toBeUndefined();
    });

    it('should return an empty string and error object for an invalid date string', () => {
      const formatted = formatDateTime('invalid-date');
      expect(formatted.formattedResult).toBe('');
      expect(formatted.error).toBeDefined();
      expect(formatted.error?.title).toBe(
        i18n.t(DATE_ERROR_MESSAGES.PARSE_ERROR),
      );
      expect(formatted.error?.message).toBe(
        i18n.t(DATE_ERROR_MESSAGES.INVALID_FORMAT),
      );
    });

    it('should handle empty string input', () => {
      const formatted = formatDateTime('');
      expect(formatted.formattedResult).toBe('');
      expect(formatted.error).toBeDefined();
      expect(formatted.error?.title).toBe(
        i18n.t(DATE_ERROR_MESSAGES.PARSE_ERROR),
      );
      expect(formatted.error?.message).toBe(
        i18n.t(DATE_ERROR_MESSAGES.EMPTY_OR_INVALID),
      );
    });

    it('should handle null input', () => {
      /* eslint-disable  @typescript-eslint/no-explicit-any */
      const formatted = formatDateTime(null as any);
      /* eslint-enable @typescript-eslint/no-explicit-any */
      expect(formatted.formattedResult).toBe('');
      expect(formatted.error).toBeDefined();
    });

    it('should handle timestamp input', () => {
      const timestamp = new Date(2024, 2, 28, 12, 30).getTime();
      const formatted = formatDateTime(timestamp);
      expect(formatted.formattedResult).toBe('28/03/2024 12:30');
      expect(formatted.error).toBeUndefined();
    });

    it('should handle invalid input', () => {
      /* eslint-disable  @typescript-eslint/no-explicit-any */
      const formatted = formatDateTime({} as any);
      /* eslint-enable @typescript-eslint/no-explicit-any */
      expect(formatted.formattedResult).toBe('');
      expect(formatted.error).toBeDefined();
    });
  });

  describe('Locale Support for Date Formatting', () => {
    const mockedGetUserPreferredLocale = jest.mocked(getUserPreferredLocale);

    beforeEach(() => {
      jest.clearAllMocks();
    });

    it('should format date with English month names when locale is en', () => {
      mockedGetUserPreferredLocale.mockReturnValue('en');
      const result = formatDate('2024-03-28', 'MMMM dd, yyyy');
      expect(result.formattedResult).toBe('March 28, 2024');
      expect(result.error).toBeUndefined();
    });

    it('should format date with Spanish month names when locale is es', () => {
      mockedGetUserPreferredLocale.mockReturnValue('es');
      const result = formatDate('2024-03-28', 'MMMM dd, yyyy');
      expect(result.formattedResult).toBe('marzo 28, 2024');
      expect(result.error).toBeUndefined();
    });

    it('should format date with French month names when locale is fr', () => {
      mockedGetUserPreferredLocale.mockReturnValue('fr');
      const result = formatDate('2024-03-28', 'MMMM dd, yyyy');
      expect(result.formattedResult).toBe('mars 28, 2024');
      expect(result.error).toBeUndefined();
    });

    it('should use same numeric format for all locales with dd/MM/yyyy', () => {
      const testCases = ['en', 'es', 'fr'];
      testCases.forEach((locale) => {
        mockedGetUserPreferredLocale.mockReturnValue(locale);
        const result = formatDate('2024-03-28'); // Default dd/MM/yyyy
        expect(result.formattedResult).toBe('28/03/2024');
        expect(result.error).toBeUndefined();
      });
    });

    it('should format datetime with localized month names', () => {
      mockedGetUserPreferredLocale.mockReturnValue('es');
      const result = formatDateTime('2024-03-28T12:30:00');
      // Since formatDateTime uses the default DATE_TIME_FORMAT (dd/MM/yyyy HH:mm),
      // the result should be numeric format regardless of locale
      expect(result.formattedResult).toBe('28/03/2024 12:30');
      expect(result.error).toBeUndefined();
    });

    it('should fallback to English for unsupported locale', () => {
      mockedGetUserPreferredLocale.mockReturnValue('unsupported-locale');
      const result = formatDate('2024-03-28', 'MMMM dd, yyyy');
      expect(result.formattedResult).toBe('March 28, 2024');
      expect(result.error).toBeUndefined();
    });

    it('should handle en-US locale', () => {
      mockedGetUserPreferredLocale.mockReturnValue('en-US');
      const result = formatDate('2024-03-28', 'MMMM dd, yyyy');
      expect(result.formattedResult).toBe('March 28, 2024');
      expect(result.error).toBeUndefined();
    });

    it('should handle en-GB locale', () => {
      mockedGetUserPreferredLocale.mockReturnValue('en-GB');
      const result = formatDate('2024-03-28', 'MMMM dd, yyyy');
      expect(result.formattedResult).toBe('March 28, 2024');
      expect(result.error).toBeUndefined();
    });

    it('should handle es-ES locale', () => {
      mockedGetUserPreferredLocale.mockReturnValue('es-ES');
      const result = formatDate('2024-03-28', 'MMMM dd, yyyy');
      expect(result.formattedResult).toBe('marzo 28, 2024');
      expect(result.error).toBeUndefined();
    });
  });

  describe('formatDateDistance', () => {
    const mockedGetUserPreferredLocale = jest.mocked(getUserPreferredLocale);
    const mockCurrentDate = new Date('2025-06-18T07:02:38.000Z'); // June 18, 2025, 7:02:38 AM UTC

    beforeEach(() => {
      jest.useFakeTimers();
      jest.setSystemTime(mockCurrentDate);
      jest.clearAllMocks();
      mockedGetUserPreferredLocale.mockReturnValue('en');
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    describe('Happy Path Tests', () => {
      it('should format distance for date 1 day', () => {
        const oneDayAgo = '2025-06-17T07:02:38.000Z'; // 1 day
        const result = formatDateDistance(oneDayAgo);
        expect(result.formattedResult).toBe('1 day');
        expect(result.error).toBeUndefined();
      });

      it('should format distance for date 2 days', () => {
        const twoDaysAgo = '2025-06-16T07:02:38.000Z'; // 2 days
        const result = formatDateDistance(twoDaysAgo);
        expect(result.formattedResult).toBe('2 days');
        expect(result.error).toBeUndefined();
      });

      it('should format distance for date 1 week', () => {
        const oneWeekAgo = '2025-06-11T07:02:38.000Z'; // 1 week
        const result = formatDateDistance(oneWeekAgo);
        expect(result.formattedResult).toBe('7 days');
        expect(result.error).toBeUndefined();
      });

      it('should format distance for date 1 month', () => {
        const oneMonthAgo = '2025-05-18T07:02:38.000Z'; // 1 month
        const result = formatDateDistance(oneMonthAgo);
        expect(result.formattedResult).toBe('1 month');
        expect(result.error).toBeUndefined();
      });

      it('should format distance for date 3 months', () => {
        const threeMonthsAgo = '2025-03-18T07:02:38.000Z'; // 3 months
        const result = formatDateDistance(threeMonthsAgo);
        expect(result.formattedResult).toBe('3 months');
        expect(result.error).toBeUndefined();
      });

      it('should format distance for date 1 year', () => {
        const oneYearAgo = '2024-06-18T07:02:38.000Z'; // 1 year
        const result = formatDateDistance(oneYearAgo);
        expect(result.formattedResult).toBe('1 year');
        expect(result.error).toBeUndefined();
      });

      it('should format distance for date 2 years', () => {
        const twoYearsAgo = '2023-06-18T07:02:38.000Z'; // 2 years
        const result = formatDateDistance(twoYearsAgo);
        expect(result.formattedResult).toBe('2 years');
        expect(result.error).toBeUndefined();
      });

      it('should format distance for recent dates (hours)', () => {
        const hoursAgo = '2025-06-18T03:02:38.000Z'; // 4 hours
        const result = formatDateDistance(hoursAgo);
        expect(result.formattedResult).toBe('1 day'); // hours converted to 1 day
        expect(result.error).toBeUndefined();
      });

      it('should format distance for very recent dates (minutes)', () => {
        const minutesAgo = '2025-06-18T06:32:38.000Z'; // 30 minutes
        const result = formatDateDistance(minutesAgo);
        expect(result.formattedResult).toBe('1 day'); // minutes converted to 1 day
        expect(result.error).toBeUndefined();
      });

      it('should format distance for date without time component (ISO date only)', () => {
        const dateOnly = '2025-06-17'; // 1 day, date only
        const result = formatDateDistance(dateOnly);
        expect(result.formattedResult).toBe('1 day');
        expect(result.error).toBeUndefined();
      });
    });

    describe('Error Handling Tests', () => {
      it('should return error for empty string input', () => {
        const result = formatDateDistance('');
        expect(result.formattedResult).toBe('');
        expect(result.error).toBeDefined();
        expect(result.error?.title).toBe(
          i18n.t(DATE_ERROR_MESSAGES.PARSE_ERROR),
        );
        expect(result.error?.message).toBe(
          i18n.t(DATE_ERROR_MESSAGES.EMPTY_OR_INVALID),
        );
      });

      it('should return error for invalid date string', () => {
        const result = formatDateDistance('invalid-date');
        expect(result.formattedResult).toBe('');
        expect(result.error).toBeDefined();
        expect(result.error?.title).toBe(
          i18n.t(DATE_ERROR_MESSAGES.PARSE_ERROR),
        );
        expect(result.error?.message).toBe(
          i18n.t(DATE_ERROR_MESSAGES.INVALID_FORMAT),
        );
      });

      it('should return error for null input', () => {
        /* eslint-disable  @typescript-eslint/no-explicit-any */
        const result = formatDateDistance(null as any);
        /* eslint-enable @typescript-eslint/no-explicit-any */
        expect(result.formattedResult).toBe('');
        expect(result.error).toBeDefined();
        expect(result.error?.title).toBe(
          i18n.t(DATE_ERROR_MESSAGES.FORMAT_ERROR),
        );
        expect(result.error?.message).toBe(
          i18n.t(DATE_ERROR_MESSAGES.NULL_OR_UNDEFINED),
        );
      });

      it('should return error for undefined input', () => {
        /* eslint-disable  @typescript-eslint/no-explicit-any */
        const result = formatDateDistance(undefined as any);
        /* eslint-enable @typescript-eslint/no-explicit-any */
        expect(result.formattedResult).toBe('');
        expect(result.error).toBeDefined();
        expect(result.error?.title).toBe(
          i18n.t(DATE_ERROR_MESSAGES.FORMAT_ERROR),
        );
        expect(result.error?.message).toBe(
          i18n.t(DATE_ERROR_MESSAGES.NULL_OR_UNDEFINED),
        );
      });

      it('should handle malformed ISO date strings', () => {
        const result = formatDateDistance('2025-13-32T25:65:70.000Z'); // Invalid month, day, hour, minute, second
        expect(result.formattedResult).toBe('');
        expect(result.error).toBeDefined();
        expect(result.error?.title).toBe(
          i18n.t(DATE_ERROR_MESSAGES.PARSE_ERROR),
        );
        expect(result.error?.message).toBe(
          i18n.t(DATE_ERROR_MESSAGES.INVALID_FORMAT),
        );
      });

      it('should handle non-string input', () => {
        /* eslint-disable  @typescript-eslint/no-explicit-any */
        const result = formatDateDistance(123 as any);
        /* eslint-enable @typescript-eslint/no-explicit-any */
        expect(result.formattedResult).toBe('');
        expect(result.error).toBeDefined();
      });
    });

    describe('Edge Cases', () => {
      it('should handle date from the same day (few seconds)', () => {
        const fewSecondsAgo = '2025-06-18T07:02:35.000Z'; // Just 3 seconds
        const result = formatDateDistance(fewSecondsAgo);
        expect(result.formattedResult).toBe('1 day'); // rounds up to 1 day
        expect(result.error).toBeUndefined();
      });

      it('should handle leap year dates correctly', () => {
        const leapYearDate = '2024-02-29T07:02:38.000Z'; // Feb 29, 2024 (leap year)
        const result = formatDateDistance(leapYearDate);
        expect(result.formattedResult).toBe('1.5 years');
        expect(result.error).toBeUndefined();
      });

      it('should handle very old dates (decades)', () => {
        const decadesAgo = '1990-06-18T07:02:38.000Z'; // 35 years
        const result = formatDateDistance(decadesAgo);
        expect(result.formattedResult).toBe('35 years');
        expect(result.error).toBeUndefined();
      });

      it('should format exactly 11 months as "1 year"', () => {
        const elevenMonthsAgo = '2024-07-18T07:02:38.000Z'; // 11 months before mockCurrentDate
        const result = formatDateDistance(elevenMonthsAgo);
        expect(result.formattedResult).toBe('1 year'); // or whatever localized version "1 year" is
        expect(result.error).toBeUndefined();
      });

      it('should handle end of month dates correctly', () => {
        const endOfMonth = '2025-05-31T07:02:38.000Z'; // End of previous month
        const result = formatDateDistance(endOfMonth);
        expect(result.formattedResult).toBe('18 days');
        expect(result.error).toBeUndefined();
      });
      it('should round up to next month when daysInFraction > 15', () => {
        const date = '2025-05-01'; // ~2 months ago

        const result = formatDateDistance(date);

        expect(result.formattedResult).toBe('2 months');
        expect(result.error).toBeUndefined();
      });

      it('should not round up when daysInFraction <= 15', () => {
        const date = '2025-05-10'; // ~1 month + 8 days ago
        const result = formatDateDistance(date);
        expect(result.formattedResult).toBe('1 month'); // or localized equivalent
        expect(result.error).toBeUndefined();
      });
    });

    describe('Real-world Clinical Scenarios', () => {
      it('should format acute condition onset (few days)', () => {
        const acuteOnset = '2025-06-15T07:02:38.000Z'; // 3 days - typical for acute conditions
        const result = formatDateDistance(acuteOnset);
        expect(result.formattedResult).toBe('3 days');
        expect(result.error).toBeUndefined();
      });

      it('should format chronic condition onset (years)', () => {
        const chronicOnset = '2020-06-18T07:02:38.000Z'; // 5 years - typical for chronic conditions
        const result = formatDateDistance(chronicOnset);
        expect(result.formattedResult).toBe('5 years');
        expect(result.error).toBeUndefined();
      });

      it('should format recent symptoms onset (hours)', () => {
        const recentOnset = '2025-06-18T01:02:38.000Z'; // 6 hours - recent symptoms
        const result = formatDateDistance(recentOnset);
        expect(result.formattedResult).toBe('1 day'); // hours converted to 1 day
        expect(result.error).toBeUndefined();
      });

      it('should format seasonal condition onset (months)', () => {
        const seasonalOnset = '2024-12-18T07:02:38.000Z'; // 6 months - seasonal conditions
        const result = formatDateDistance(seasonalOnset);
        expect(result.formattedResult).toBe('6 months');
        expect(result.error).toBeUndefined();
      });

      it('should format 1 year and 6 months as "1.5 years"', () => {
        const date = '2023-12-18T07:02:38.000Z'; // 1 year, 6 months ago from mockCurrentDate
        const result = formatDateDistance(date);
        expect(result.formattedResult).toBe('1.5 years');
        expect(result.error).toBeUndefined();
      });

      it('should format 2 years and 3 months as "2.5 years"', () => {
        const date = '2023-03-18T07:02:38.000Z'; // 2 years, 3 months ago
        const result = formatDateDistance(date);
        expect(result.formattedResult).toBe('2.5 years');
        expect(result.error).toBeUndefined();
      });

      it('should format 4 years and 11 months as "5 years"', () => {
        const date = '2020-07-18T07:02:38.000Z'; // 4 years, 11 months ago
        const result = formatDateDistance(date);
        expect(result.formattedResult).toBe('5 years');
        expect(result.error).toBeUndefined();
      });

      it('should round down 5 years and 5 months to "5 years"', () => {
        const date = '2020-01-18T07:02:38.000Z'; // 5 years, 5 months ago
        const result = formatDateDistance(date);
        expect(result.formattedResult).toBe('5 years');
        expect(result.error).toBeUndefined();
      });

      it('should round up 5 years and 8 months to "6 years"', () => {
        const date = '2019-10-18T07:02:38.000Z'; // 5 years, 8 months ago
        const result = formatDateDistance(date);
        expect(result.formattedResult).toBe('6 years');
        expect(result.error).toBeUndefined();
      });

      it('should format exactly 5 years as "5 years"', () => {
        const date = '2020-06-18T07:02:38.000Z'; // Exactly 5 years ago
        const result = formatDateDistance(date);
        expect(result.formattedResult).toBe('5 years');
        expect(result.error).toBeUndefined();
      });
    });
  });
});

describe('sortByDate', () => {
  describe('Happy Path Tests', () => {
    it('should sort array by date field in descending order (newest first) by default', () => {
      const testData = [
        { id: 1, createdDate: '2025-01-15T10:00:00Z', name: 'Item 1' },
        { id: 2, createdDate: '2025-01-10T10:00:00Z', name: 'Item 2' },
        { id: 3, createdDate: '2025-01-20T10:00:00Z', name: 'Item 3' },
      ];

      const result = sortByDate(testData, 'createdDate');

      expect(result).toHaveLength(3);
      expect(result[0].id).toBe(3); // Newest first (2025-01-20)
      expect(result[1].id).toBe(1); // Middle (2025-01-15)
      expect(result[2].id).toBe(2); // Oldest last (2025-01-10)
    });

    it('should sort array by date field in ascending order (oldest first) when specified', () => {
      const testData = [
        { id: 1, createdDate: '2025-01-15T10:00:00Z', name: 'Item 1' },
        { id: 2, createdDate: '2025-01-10T10:00:00Z', name: 'Item 2' },
        { id: 3, createdDate: '2025-01-20T10:00:00Z', name: 'Item 3' },
      ];

      const result = sortByDate(testData, 'createdDate', true);

      expect(result).toHaveLength(3);
      expect(result[0].id).toBe(2); // Oldest first (2025-01-10)
      expect(result[1].id).toBe(1); // Middle (2025-01-15)
      expect(result[2].id).toBe(3); // Newest last (2025-01-20)
    });

    it('should handle different date formats correctly', () => {
      const testData = [
        { id: 1, date: '2025-01-15' }, // ISO date
        { id: 2, date: '2025-01-10T10:00:00Z' }, // ISO datetime with Z
        { id: 3, date: '2025-01-20T15:30:00.000Z' }, // ISO datetime with milliseconds
        { id: 4, date: new Date('2025-01-05').toISOString() }, // Date object converted to ISO
      ];

      const result = sortByDate(testData, 'date', true);

      expect(result[0].id).toBe(4); // 2025-01-05
      expect(result[1].id).toBe(2); // 2025-01-10
      expect(result[2].id).toBe(1); // 2025-01-15
      expect(result[3].id).toBe(3); // 2025-01-20
    });

    it('should maintain stable sort for equal dates', () => {
      const testData = [
        { id: 1, date: '2025-01-15T10:00:00Z', name: 'First' },
        { id: 2, date: '2025-01-15T10:00:00Z', name: 'Second' },
        { id: 3, date: '2025-01-15T10:00:00Z', name: 'Third' },
      ];

      const result = sortByDate(testData, 'date');

      // All dates are equal, so original order should be maintained
      expect(result[0].id).toBe(1);
      expect(result[1].id).toBe(2);
      expect(result[2].id).toBe(3);
    });

    it('should handle single item array', () => {
      const testData = [{ id: 1, date: '2025-01-15T10:00:00Z' }];

      const result = sortByDate(testData, 'date');

      expect(result).toHaveLength(1);
      expect(result[0].id).toBe(1);
    });

    it('should handle empty array', () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const testData: any[] = [];

      const result = sortByDate(testData, 'date');

      expect(result).toHaveLength(0);
      expect(Array.isArray(result)).toBe(true);
    });
  });

  describe('Edge Cases and Error Handling', () => {
    it('should return empty array for null input', () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const result = sortByDate(null as any, 'date');

      expect(result).toEqual([]);
    });

    it('should return empty array for non-array input', () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const result = sortByDate('not-an-array' as any, 'date');

      expect(result).toEqual([]);
    });

    it('should handle objects with missing date field', () => {
      const testData = [
        { id: 1, date: '2025-01-15T10:00:00Z' },
        { id: 2, name: 'No date field' }, // Missing date field
        { id: 3, date: '2025-01-10T10:00:00Z' },
      ];

      const result = sortByDate(testData, 'date');

      // Items with invalid dates should be sorted to the end
      expect(result).toHaveLength(3);
      expect(result[0].id).toBe(1); // Valid date (newest)
      expect(result[1].id).toBe(3); // Valid date (oldest)
      expect(result[2].id).toBe(2); // Invalid date (missing field)
    });

    it('should handle mix of valid and invalid dates', () => {
      const testData = [
        { id: 1, date: '2025-01-15T10:00:00Z' },
        { id: 2, date: 'invalid' },
        { id: 3, date: null },
        { id: 4, date: '2025-01-20T10:00:00Z' },
        { id: 5, date: undefined },
        { id: 6, date: '2025-01-10T10:00:00Z' },
      ];

      const result = sortByDate(testData, 'date');

      expect(result).toHaveLength(6);
      // Valid dates should be sorted first
      expect(result[0].id).toBe(4); // 2025-01-20 (newest)
      expect(result[1].id).toBe(1); // 2025-01-15
      expect(result[2].id).toBe(6); // 2025-01-10 (oldest)
      // Invalid dates should be at the end
      expect([2, 3, 5]).toContain(result[3].id);
      expect([2, 3, 5]).toContain(result[4].id);
      expect([2, 3, 5]).toContain(result[5].id);
    });
  });

  describe('Performance and Type Safety', () => {
    it('should handle large arrays efficiently', () => {
      const largeArray = Array.from({ length: 1000 }, (_, index) => ({
        id: index,
        date: new Date(2025, 0, 1 + (index % 30)).toISOString(), // Spread across 30 days
        data: `item-${index}`,
      }));

      const startTime = performance.now();
      const result = sortByDate(largeArray, 'date');
      const endTime = performance.now();

      expect(result).toHaveLength(1000);
      expect(endTime - startTime).toBeLessThan(100); // Should complete within 100ms

      // Verify sorting is correct for first few items
      const firstDate = new Date(result[0].date);
      const secondDate = new Date(result[1].date);
      expect(firstDate.getTime()).toBeGreaterThanOrEqual(secondDate.getTime());
    });

    it('should handle numeric field names', () => {
      const testData = [
        { 0: '2025-01-15T10:00:00Z', id: 1 },
        { 0: '2025-01-10T10:00:00Z', id: 2 },
        { 0: '2025-01-20T10:00:00Z', id: 3 },
      ];

      const result = sortByDate(testData, '0');

      expect(result[0].id).toBe(3); // Newest first
      expect(result[1].id).toBe(1);
      expect(result[2].id).toBe(2); // Oldest last
    });
  });
});
