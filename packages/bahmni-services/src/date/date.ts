import {
  parseISO,
  isValid,
  differenceInYears,
  differenceInMonths,
  differenceInDays,
  addYears,
  addMonths,
  subYears,
  subMonths,
  subDays,
  format,
} from 'date-fns';
import type { Locale } from 'date-fns';
import { enUS, enGB, es, fr, de } from 'date-fns/locale';
import { getUserPreferredLocale } from '../i18n/translationService';
import { Age } from '../patientService/models';
import { DATE_FORMAT, DATE_TIME_FORMAT } from './constants';
import { DATE_ERROR_MESSAGES } from './errors';

export interface FormatDateResult {
  formattedResult: string;
  error?: {
    title: string;
    message: string;
  };
}

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

  const locale = getDateFnsLocale();
  return { formattedResult: format(dateToFormat, dateFormat, { locale }) };
}

/**
 * Formats a date string or Date object into the specified date time format.
 * @param date - The date string or Date object to format.
 * @returns A FormatDateResult object containing either a formatted date string or an error.
 */
export function formatDateTime(
  date: string | Date | number,
  t: (key: string, options?: { count?: number }) => string,
): FormatDateResult {
  return formatDateGeneric(date, DATE_TIME_FORMAT, t);
}

/**
 * Formats a date string or Date object into the specified date format.
 * @param date - The date string or Date object to format.
 * @param format - The date format to use (default is 'dd/MM/yyyy').
 * @returns A FormatDateResult object containing either a formatted date string or an error.
 */
export function formatDate(
  date: string | Date | number,
  t: (key: string, options?: { count?: number }) => string,
  format: string = DATE_FORMAT,
): FormatDateResult {
  return formatDateGeneric(date, format, t);
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
    const yearUnit = t('CLINICAL_YEARS_TRANSLATION_KEY', {
      count: yearValue,
    });
    formattedResult = `${yearValue} ${yearUnit}`;
  } else if (diffInYears >= 1) {
    // Use years for periods >= 1 year
    const monthInFraction = diffInMonths % 12;
    const yearUnit = t('CLINICAL_YEARS_TRANSLATION_KEY', {
      count: diffInYears + monthInFraction,
    });
    formattedResult =
      monthInFraction === 0
        ? `${diffInYears} ${yearUnit}`
        : monthInFraction > 6
          ? `${diffInYears + 1} ${yearUnit}`
          : `${diffInYears}.5 ${yearUnit}`;
  } else if (diffInMonths >= 11) {
    const yearUnit = t('CLINICAL_YEARS_TRANSLATION_KEY', {
      count: 1,
    });
    formattedResult = `1 ${yearUnit}`;
  } else if (diffInMonths >= 1) {
    // Use months for periods >= 1 month but < 1 year
    const daysInFraction = diffInDays % 30;
    const monthValue = daysInFraction > 15 ? diffInMonths + 1 : diffInMonths;
    const monthUnit = t('CLINICAL_MONTHS_TRANSLATION_KEY', {
      count: monthValue,
    });
    formattedResult = `${monthValue} ${monthUnit}`;
  } else {
    // Use days for everything else (including hours, minutes - round up to at least 1 day)
    const days = Math.max(1, diffInDays);
    const dayUnit = t('CLINICAL_DAYS_TRANSLATION_KEY', {
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

export function formatDateAndTime(date: number, includeTime: boolean): string {
  const d = new Date(date);

  const formatter = new Intl.DateTimeFormat('en-US', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
  const parts = formatter.formatToParts(d);
  const day = parts.find((p) => p.type === 'day')?.value;
  const month = parts.find((p) => p.type === 'month')?.value;
  const year = parts.find((p) => p.type === 'year')?.value;
  let formattedDate = `${day} ${month} ${year}`;

  if (includeTime) {
    let hours = d.getHours();
    const minutes = String(d.getMinutes()).padStart(2, '0');
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12 || 12;
    const formattedTime = `${hours}:${minutes} ${ampm}`;
    formattedDate += ` ${formattedTime}`;
  }

  return formattedDate;
}
/**
 * Calculate and format age for display in patient search results.
 * For infants under 3 months, displays age in total days only.
 * For all others, displays age in years, months, and days format.
 *
 * @param birthDateMillis - Birth date in milliseconds
 * @param t - Optional translation function for Y/M/D labels
 * @returns Formatted age string (e.g., "45d" for infants, "25y 6m 15d" for others)
 */
export function calculateAgeinYearsAndMonths(
  birthDateMillis: number,
  t?: (key: string, options?: { count?: number }) => string,
): string {
  const birthDate = new Date(birthDateMillis);
  const today = new Date();

  const years = differenceInYears(today, birthDate);
  const lastBirthday = addYears(birthDate, years);
  const months = differenceInMonths(today, lastBirthday);
  const lastMonthAnniversary = addMonths(lastBirthday, months);
  const days = differenceInDays(today, lastMonthAnniversary);

  if (years === 0 && months < 3) {
    const totalDays = differenceInDays(today, birthDate);
    if (!t) {
      return `${totalDays} days`;
    }
    const dayUnit = t('REGISTRATION_DAYS_SHORT', { count: totalDays });
    return `${totalDays}${dayUnit}`;
  }
  if (!t) {
    return `${years} years ${months} months ${days} days`;
  }

  const ageComponents: Array<[number, string]> = [
    [years, 'REGISTRATION_YEARS_SHORT'],
    [months, 'REGISTRATION_MONTHS_SHORT'],
    [days, 'REGISTRATION_DAYS_SHORT'],
  ];

  const parts = ageComponents
    .filter(([value]) => value > 0)
    .map(([value, key]) => `${value}${t(key, { count: value })}`);

  return parts.join(' ') || '0d';
}
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
