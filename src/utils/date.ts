import {
  parseISO,
  isValid,
  differenceInYears,
  differenceInMonths,
  differenceInDays,
  subYears,
  subMonths,
  subDays,
  format,
} from 'date-fns';
import type { Locale } from 'date-fns';
import { enUS, enGB, es, fr, de } from 'date-fns/locale';
import i18next from 'i18next';
import { DATE_FORMAT, DATE_TIME_FORMAT } from '@constants/date';
import { DATE_ERROR_MESSAGES } from '@constants/errors';
import { getUserPreferredLocale } from '@services/translationService';
import { FormatDateResult } from '@types/date';
import { Age } from '@types/patient';

/**
 * Mapping of user locale codes to date-fns locale objects
 */
const LOCALE_MAP: Record<string, Locale> = {
  en: enGB,
  'en-US': enUS,
  'en-GB': enGB,
  es: es,
  'es-ES': es,
  fr: fr,
  'fr-FR': fr,
  de: de,
  'de-DE': de,
};

/**
 * Gets the appropriate date-fns locale object based on user's preferred locale.
 * Falls back to English (GB) if the locale is not supported or if an error occurs.
 * @returns The date-fns locale object to use for formatting
 */
function getDateFnsLocale(): Locale {
  const userLocale = getUserPreferredLocale();
  return LOCALE_MAP[userLocale] || LOCALE_MAP['en'];
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
  const lastBirthday = subYears(today, years);
  const months = differenceInMonths(lastBirthday, birthDate);
  const lastMonth = subMonths(lastBirthday, months);
  const days = differenceInDays(lastMonth, birthDate);

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
function safeParseDate(dateString: string): DateParseResult {
  if (!dateString?.trim()) {
    return {
      date: null,
      error: {
        title: i18next.t(DATE_ERROR_MESSAGES.PARSE_ERROR),
        message: i18next.t(DATE_ERROR_MESSAGES.EMPTY_OR_INVALID),
      },
    };
  }
  const parsedDate = parseISO(dateString);
  if (!isValid(parsedDate)) {
    return {
      date: null,
      error: {
        title: i18next.t(DATE_ERROR_MESSAGES.PARSE_ERROR),
        message: i18next.t(DATE_ERROR_MESSAGES.INVALID_FORMAT),
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
): FormatDateResult {
  if (date === null || date === undefined) {
    return {
      formattedResult: '',
      error: {
        title: i18next.t(DATE_ERROR_MESSAGES.FORMAT_ERROR),
        message: i18next.t(DATE_ERROR_MESSAGES.NULL_OR_UNDEFINED),
      },
    };
  }

  let dateToFormat: Date | null;

  if (typeof date === 'string') {
    const parseResult = safeParseDate(date);
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
        title: i18next.t(DATE_ERROR_MESSAGES.PARSE_ERROR),
        message: i18next.t(DATE_ERROR_MESSAGES.INVALID_FORMAT),
      },
    };
  }

  const locale = getDateFnsLocale();
  return { formattedResult: format(dateToFormat, dateFormat, { locale }) };
}

/**
 * Formats a date string or Date object into the specified date time format.
 * @param date - The date string or Date object to format.
 * @returns A FormatDateResult object containing either a formatted date string or an error.
 */
export function formatDateTime(date: string | Date | number): FormatDateResult {
  return formatDateGeneric(date, DATE_TIME_FORMAT);
}

/**
 * Formats a date string or Date object into the specified date format.
 * @param date - The date string or Date object to format.
 * @param format - The date format to use (default is 'dd/MM/yyyy').
 * @returns A FormatDateResult object containing either a formatted date string or an error.
 */
export function formatDate(
  date: string | Date | number,
  format: string = DATE_FORMAT,
): FormatDateResult {
  return formatDateGeneric(date, format);
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
export function formatDateDistance(date: string): FormatDateResult {
  if (date === null || date === undefined) {
    return {
      formattedResult: '',
      error: {
        title: i18next.t(DATE_ERROR_MESSAGES.FORMAT_ERROR),
        message: i18next.t(DATE_ERROR_MESSAGES.NULL_OR_UNDEFINED),
      },
    };
  }

  if (typeof date !== 'string') {
    return {
      formattedResult: '',
      error: {
        title: i18next.t(DATE_ERROR_MESSAGES.FORMAT_ERROR),
        message: i18next.t(DATE_ERROR_MESSAGES.INVALID_FORMAT),
      },
    };
  }

  const parseResult = safeParseDate(date);
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
    const yearUnit = i18next.t('CLINICAL_YEARS_TRANSLATION_KEY', {
      count: yearValue,
    });
    formattedResult = `${yearValue} ${yearUnit}`;
  } else if (diffInYears >= 1) {
    // Use years for periods >= 1 year
    const monthInFraction = diffInMonths % 12;
    const yearUnit = i18next.t('CLINICAL_YEARS_TRANSLATION_KEY', {
      count: diffInYears + monthInFraction,
    });
    formattedResult =
      monthInFraction === 0
        ? `${diffInYears} ${yearUnit}`
        : monthInFraction > 6
          ? `${diffInYears + 1} ${yearUnit}`
          : `${diffInYears}.5 ${yearUnit}`;
  } else if (diffInMonths >= 11) {
    const yearUnit = i18next.t('CLINICAL_YEARS_TRANSLATION_KEY', {
      count: 1,
    });
    formattedResult = `1 ${yearUnit}`;
  } else if (diffInMonths >= 1) {
    // Use months for periods >= 1 month but < 1 year
    const daysInFraction = diffInDays % 30;
    const monthValue = daysInFraction > 15 ? diffInMonths + 1 : diffInMonths;
    const monthUnit = i18next.t('CLINICAL_MONTHS_TRANSLATION_KEY', {
      count: monthValue,
    });
    formattedResult = `${monthValue} ${monthUnit}`;
  } else {
    // Use days for everything else (including hours, minutes - round up to at least 1 day)
    const days = Math.max(1, diffInDays);
    const dayUnit = i18next.t('CLINICAL_DAYS_TRANSLATION_KEY', {
      count: days,
    });
    formattedResult = `${days} ${dayUnit}`;
  }

  return { formattedResult };
}

export const getTodayDate = (): Date => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return today;
};

/**
 * Sorts an array of objects by a date field
 * @param array - Array of objects to sort
 * @param dateField - The field name containing the date value
 * @param ascending - Sort order: true for ascending (oldest first), false for descending (newest first)
 * @returns sorted array
 */
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
