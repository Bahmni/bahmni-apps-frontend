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
import { enUS, enGB, es, fr, de } from 'date-fns/locale';
import type { Locale } from 'date-fns';
import { Age } from '@types/patient';
import { FormatDateResult } from '@types/date';
import { DATE_FORMAT, DATE_TIME_FORMAT } from '@constants/date';
import { DATE_ERROR_MESSAGES } from '@constants/errors';
import { getUserPreferredLocale } from '@services/translationService';
import i18next from 'i18next';

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
