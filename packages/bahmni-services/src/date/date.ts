import {
  parseISO,
  isValid,
  differenceInYears,
  differenceInMonths,
  differenceInDays,
  addDays,
  addYears,
  addMonths,
  subYears,
  subMonths,
  subDays,
  format,
} from 'date-fns';
import { Age } from '../patientService/models';
import {
  DEFAULT_BROWSER_DATE_FORMAT,
  DEFAULT_DATE_FORMAT,
  DEFAULT_DATE_FORMAT_STORAGE_KEY,
} from './constants';
import { DATE_ERROR_MESSAGES } from './errors';

export interface FormatDateResult {
  formattedResult: string;
  error?: {
    title: string;
    message: string;
  };
}

/**
 * Calculates age based on a date string in the format yyyy-mm-dd
 * Returns age as an object with years, months, and days properties
 *
 * @param dateString - Birth date string in the format yyyy-mm-dd
 * @returns Age object containing years, months, and days or null if the input is invalid
 */
export function calculateAge(dateString: string): Age | null {
  if (
    typeof dateString !== 'string' ||
    !/^\d{4}-\d{2}-\d{2}$/.test(dateString)
  ) {
    return null; // Ensure input is a valid ISO date format
  }

  const birthDate = parseISO(dateString);
  if (!isValid(birthDate)) return null; // Invalid date check
  const today = new Date();
  if (birthDate > today) return null; // Future dates are invalid

  const years = differenceInYears(today, birthDate);
  const lastBirthday = addYears(birthDate, years);

  const months = differenceInMonths(today, lastBirthday);
  const lastMonthAnniversary = addMonths(lastBirthday, months);

  const days = differenceInDays(today, lastMonthAnniversary);

  return { years, months, days };
}

/**
 * Interface for date parsing results
 */
interface DateParseResult {
  date: Date | null;
  error?: {
    title: string;
    message: string;
  };
}

/**
 * Safely parses a date string into a Date object.
 * @param dateString - The date string to parse.
 * @returns A DateParseResult object containing either a valid Date or an error.
 */
function safeParseDate(
  dateString: string,
  t: (key: string, options?: { count?: number }) => string,
): DateParseResult {
  if (!dateString?.trim()) {
    return {
      date: null,
      error: {
        title: t(DATE_ERROR_MESSAGES.PARSE_ERROR),
        message: t(DATE_ERROR_MESSAGES.EMPTY_OR_INVALID),
      },
    };
  }
  const parsedDate = parseISO(dateString);
  if (!isValid(parsedDate)) {
    return {
      date: null,
      error: {
        title: t(DATE_ERROR_MESSAGES.PARSE_ERROR),
        message: t(DATE_ERROR_MESSAGES.INVALID_FORMAT),
      },
    };
  }
  return { date: parsedDate };
}

/**
 * Formats a date string or Date object into the specified date format with locale support.
 * Automatically uses the user's preferred locale from getUserPreferredLocale() for language-specific
 * formatting such as month names and day names. Falls back to English (GB) if locale retrieval fails
 * or if the locale is not supported.
 *
 * @param date - The date string or Date object to format.
 * @param dateFormat - The date format to use (e.g., 'yyyy-MM-dd', 'dd/MM/yyyy', 'MMMM dd, yyyy').
 * @returns A FormatDateResult object containing either a formatted date string or an error.
 */
function formatDateGeneric(
  date: string | Date | number,
  dateFormat: string,
  t: (key: string, options?: { count?: number }) => string,
): FormatDateResult {
  if (date === null || date === undefined) {
    return {
      formattedResult: '',
      error: {
        title: t(DATE_ERROR_MESSAGES.FORMAT_ERROR),
        message: t(DATE_ERROR_MESSAGES.NULL_OR_UNDEFINED),
      },
    };
  }

  let dateToFormat: Date | null;

  if (typeof date === 'string') {
    const parseResult = safeParseDate(date, t);
    if (parseResult.error) {
      return {
        formattedResult: '',
        error: parseResult.error,
      };
    }
    dateToFormat = parseResult.date;
  } else {
    dateToFormat = new Date(date);
  }

  if (!isValid(dateToFormat) || !dateToFormat) {
    return {
      formattedResult: '',
      error: {
        title: t(DATE_ERROR_MESSAGES.PARSE_ERROR),
        message: t(DATE_ERROR_MESSAGES.INVALID_FORMAT),
      },
    };
  }

  return { formattedResult: format(dateToFormat, dateFormat) };
}

/**
 * Universal date/time formatting method that retrieves the date format with intelligent fallback.
 *
 * Fallback priority:
 * 1. localStorage (user-configured format)
 * 2. In date-fns, the token P represents the localized date. It automatically adjusts based on the user's locale.
 * 3. DATE_FORMAT constant (final fallback)
 *
 * @param date - The date to format (string, Date object, or timestamp in milliseconds)
 * @param t - Translation function for error messages (default: identity function)
 * @param includeTime - Whether to append time to the format (default: false)
 *                      When true, always adds 12-hour time format (h:mm a)
 * @returns FormatDateResult with formatted string or error
 *
 * @example
 * // Date only (uses localStorage or browser locale)
 * formatDateTime(date) // "28/03/2024" (UK) or "03/28/2024" (US)
 *
 * @example
 * // Date with time (always 12-hour format)
 * formatDateTime(date, t, true) // "28/03/2024 2:30 PM"
 */
export function formatDateTime(
  date: string | Date | number,
  t?: (key: string, options?: { count?: number }) => string,
  includeTime: boolean = false,
  dateFormat?: string,
): FormatDateResult {
  const translationFn = t ?? ((key: string) => key);

  let finalFormat: string;
  try {
    finalFormat =
      dateFormat ??
      localStorage.getItem(DEFAULT_DATE_FORMAT_STORAGE_KEY) ??
      DEFAULT_BROWSER_DATE_FORMAT;
  } catch {
    finalFormat = DEFAULT_DATE_FORMAT;
  }

  if (includeTime && !dateFormat) {
    finalFormat = `${finalFormat} h:mm a`;
  }

  return formatDateGeneric(date, finalFormat, translationFn);
}

/**
 * Calculates onset date by subtracting duration from given date
 * @param givenDate - The given date as baseline
 * @param durationValue - The duration value to subtract
 * @param durationUnit - The unit of duration ('days', 'months', 'years')
 * @returns Calculated onset date or undefined if inputs are invalid
 */
export function calculateOnsetDate(
  givenDate: Date,
  durationValue: number | null,
  durationUnit: 'days' | 'months' | 'years' | null,
): Date | undefined {
  if (
    !givenDate ||
    !isValid(givenDate) ||
    durationValue === null ||
    durationValue === undefined ||
    !durationUnit ||
    typeof durationValue !== 'number'
  ) {
    return undefined;
  }

  const onsetDate = new Date(givenDate);

  switch (durationUnit) {
    case 'days':
      return subDays(onsetDate, durationValue);
    case 'months':
      return subMonths(onsetDate, durationValue);
    case 'years':
      return subYears(onsetDate, durationValue);
    default:
      return undefined;
  }
}

/**
 * Formats a date string into a clean relative time format for use with i18n templates.
 * Converts all time periods to days/months/years only and removes qualifiers like "about", "almost", "ago".
 * Minutes and hours are rounded up to "1 day".
 *
 * @param date - ISO date string to format (e.g., "2025-06-17T07:02:38.000Z" or "2025-06-17")
 * @returns FormatDateResult with clean time format (e.g., "3 days", "1 month", "2 years")
 */
export function formatDateDistance(
  date: string,
  t: (key: string, options?: { count?: number }) => string,
): FormatDateResult {
  if (date === null || date === undefined) {
    return {
      formattedResult: '',
      error: {
        title: t(DATE_ERROR_MESSAGES.FORMAT_ERROR),
        message: t(DATE_ERROR_MESSAGES.NULL_OR_UNDEFINED),
      },
    };
  }

  if (typeof date !== 'string') {
    return {
      formattedResult: '',
      error: {
        title: t(DATE_ERROR_MESSAGES.FORMAT_ERROR),
        message: t(DATE_ERROR_MESSAGES.INVALID_FORMAT),
      },
    };
  }

  const parseResult = safeParseDate(date, t);
  if (parseResult.error) {
    return {
      formattedResult: '',
      error: parseResult.error,
    };
  }

  const now = new Date();

  // Calculate differences in various units
  const diffInMilliseconds = now.getTime() - parseResult.date!.getTime();
  const diffInDays = Math.floor(diffInMilliseconds / (1000 * 60 * 60 * 24));
  const diffInMonths = differenceInMonths(now, parseResult.date!);
  const diffInYears = differenceInYears(now, parseResult.date!);

  let formattedResult: string;

  if (diffInYears >= 5) {
    const monthInFraction = diffInMonths % 12;
    const yearValue = monthInFraction > 6 ? diffInYears + 1 : diffInYears;
    const yearUnit = t('YEARS', {
      count: yearValue,
    });
    formattedResult = `${yearValue}${yearUnit}`;
  } else if (diffInYears >= 1) {
    // Use years for periods >= 1 year
    const monthInFraction = diffInMonths % 12;
    const yearUnit = t('YEARS', {
      count: diffInYears + monthInFraction,
    });
    const newLocal = diffInYears + 1;
    formattedResult =
      monthInFraction === 0
        ? `${diffInYears}${yearUnit}`
        : monthInFraction > 6
          ? `${newLocal}${yearUnit}`
          : `${diffInYears}.5${yearUnit}`;
  } else if (diffInMonths >= 11) {
    const yearUnit = t('YEARS', {
      count: 1,
    });
    formattedResult = `1${yearUnit}`;
  } else if (diffInMonths >= 1) {
    // Use months for periods >= 1 month but < 1 year
    const daysInFraction = diffInDays % 30;
    const monthValue = daysInFraction > 15 ? diffInMonths + 1 : diffInMonths;
    const monthUnit = t('MONTHS', {
      count: monthValue,
    });
    formattedResult = `${monthValue}${monthUnit}`;
  } else {
    // Use days for everything else (including hours, minutes - round up to at least 1 day)
    const days = Math.max(1, diffInDays);
    const dayUnit = t('DAYS', {
      count: days,
    });
    formattedResult = `${days}${dayUnit}`;
  }

  return { formattedResult };
}

export const getTodayDate = (): Date => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return today;
};

/**
 * Calculate and format age for display with age-appropriate formatting.
 *
 * Display rules:
 * - ≤ 90 days: Shows days only (e.g., "45 Days")
 * - 91 days to < 1 year: Shows months + days only (e.g., "3 Months 15 Days")
 * - ≥ 1 year: Shows years + months + days (e.g., "2 Years 3 Months 15 Days")
 *
 * @param birthDate - Birth date in milliseconds (timestamp) or ISO date string (yyyy-mm-dd)
 * @param t - Optional translation function for Y/M/D labels
 * @returns Formatted age string
 */
export function getFormattedAge(
  birthDate: number | string,
  t?: (key: string, options?: { count?: number }) => string,
): string {
  const birthDateObj =
    typeof birthDate === 'string' ? parseISO(birthDate) : new Date(birthDate);
  const today = new Date();

  const years = differenceInYears(today, birthDateObj);
  const lastBirthday = addYears(birthDateObj, years);
  const months = differenceInMonths(today, lastBirthday);
  const lastMonthAnniversary = addMonths(lastBirthday, months);
  const days = differenceInDays(today, lastMonthAnniversary);

  const translationKeys = {
    years: 'YEARS',
    months: 'MONTHS',
    days: 'DAYS',
  };

  const fallbackUnits = {
    years: ' years',
    months: ' months',
    days: ' days',
  };

  const totalDays = differenceInDays(today, birthDateObj);

  if (totalDays <= 90) {
    const dayUnit = t
      ? t(translationKeys.days, { count: totalDays })
      : fallbackUnits.days;
    return `${totalDays}${dayUnit}`;
  }

  const ageComponents: Array<[number, string, string]> =
    years >= 1
      ? [
          [years, translationKeys.years, fallbackUnits.years],
          [months, translationKeys.months, fallbackUnits.months],
          [days, translationKeys.days, fallbackUnits.days],
        ]
      : [
          [months, translationKeys.months, fallbackUnits.months],
          [days, translationKeys.days, fallbackUnits.days],
        ];

  const parts = ageComponents.map(([value, key, fallback]) => {
    const unit = t ? t(key, { count: value }) : fallback;
    return `${value}${unit}`;
  });

  return parts.join(' ');
}
/**
 * Sorts an array of objects by a date field
 * @param array - Array of objects to sort
 * @param dateField - The field name containing the date value
 * @param ascending - Sort order: true for ascending (oldest first), false for descending (newest first)
 * @returns sorted array
 */
/**
 * Mapping of FHIR/UCUM duration unit codes to their equivalent in days.
 * Used to convert duration values into a common unit for date calculations.
 */
export const DURATION_UNIT_TO_DAYS: Record<string, number> = {
  d: 1,
  wk: 7,
  mo: 30,
  a: 365,
  h: 1 / 24,
  min: 1 / 1440,
  s: 1 / 86400,
};

/**
 * Calculates an end date by adding a duration to a start date.
 * @param startDate - The start date (Date object or ISO string)
 * @param duration - The duration value
 * @param durationUnit - The FHIR/UCUM duration unit code (e.g., 'd', 'wk', 'mo')
 * @returns The calculated end date
 * @throws Error if the start date is invalid
 */
export const calculateEndDate = (
  startDate: Date | string,
  duration: number,
  durationUnit: string,
): Date => {
  const start = typeof startDate === 'string' ? new Date(startDate) : startDate;
  // Validate that the date is valid
  if (isNaN(start.getTime())) {
    throw new Error(`Invalid date: ${startDate}`);
  }
  const daysMultiplier = DURATION_UNIT_TO_DAYS[durationUnit] ?? 1;
  const totalDays = duration * daysMultiplier;
  return addDays(start, totalDays);
};

/**
 * Checks whether two date ranges overlap.
 * Uses inclusive comparison: ranges that share an endpoint are considered overlapping.
 */
export const doDateRangesOverlap = (
  start1: Date,
  end1: Date,
  start2: Date,
  end2: Date,
): boolean => {
  return start1 <= end2 && start2 <= end1;
};

export function sortByDate(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  array: any[],
  dateField: string,
  ascending: boolean = false,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
): any[] {
  if (!array || !Array.isArray(array)) return [];

  return array.sort((a, b) => {
    const dateA = new Date(a[dateField]);
    const dateB = new Date(b[dateField]);

    // Handle invalid dates
    if (isNaN(dateA.getTime()) && isNaN(dateB.getTime())) return 0;
    if (isNaN(dateA.getTime())) return 1;
    if (isNaN(dateB.getTime())) return -1;

    const diff = dateA.getTime() - dateB.getTime();
    return ascending ? diff : -diff;
  });
}
