import {
  parseISO,
  isValid,
  differenceInYears,
  differenceInMonths,
  differenceInDays,
  subYears,
  subMonths,
  format,
} from 'date-fns';
import { Age } from '@types/age';
import { FormatDateResult } from '@types/date';
import { MONTH_DATE_YEAR_FORMAT, DATE_TIME_FORMAT,DATE_FORMAT } from '@constants/date';
import { DATE_ERROR_MESSAGES } from '@constants/errors';
import i18next from 'i18next';

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
 * Formats a date string or Date object into the specified date format.
 * @param date - The date string or Date object to format.
 * @param dateFormat - The date format to use (e.g., 'yyyy-MM-dd', 'dd/MM/yyyy').
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

  return { formattedResult: format(dateToFormat, dateFormat) };
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
 * @returns A FormatDateResult object containing either a formatted date string or an error.
 */
export function formatDate(date: string | Date | number): FormatDateResult {
  return formatDateGeneric(date, MONTH_DATE_YEAR_FORMAT);
}
