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
import { Age } from '@types/patient';
import { DATE_FORMAT, DATE_TIME_FORMAT } from '@constants/date';
import notificationService from '@services/notificationService';
import { getFormattedError } from './common';

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
 * Safely parses a date string into a Date object.
 * @param dateString - The date string to parse.
 * @returns A Date object if the parsing is successful, or null if the input is invalid or empty.
 */
function safeParseDate(dateString: string): Date | null {
  if (!dateString?.trim()) {
    const { title, message } = getFormattedError(
      new Error('Date string is empty or invalid'),
    );
    notificationService.showError(title, message);
    return null;
  }
  const parsedDate = parseISO(dateString);
  if (!isValid(parsedDate)) {
    const { title, message } = getFormattedError(
      new Error(`Invalid date format: ${dateString}`),
    );
    notificationService.showError(title, message);
    return null;
  }
  return parsedDate;
}

/**
 * Formats a date string or Date object into the specified date format.
 * @param date - The date string or Date object to format.
 * @param dateFormat - The date format to use (e.g., 'yyyy-MM-dd', 'dd/MM/yyyy').
 * @returns A formatted date string or an empty string if the input is invalid.
 */
function formatDateGeneric(
  date: string | Date | number,
  dateFormat: string,
): string {
  const parsedDate =
    typeof date === 'string' ? safeParseDate(date) : new Date(date);
  if (!isValid(parsedDate) || !parsedDate) {
    const { title, message: errorMessage } = getFormattedError(
      new Error(`Invalid date format: ${date}`),
    );
    notificationService.showError(title, errorMessage);
    return '';
  }
  return format(parsedDate, dateFormat);
}

/**
 * Formats a date string or Date object into the specified date format.
 * @param date - The date string or Date object to format.
 * @returns A formatted date string or an empty string if the input is invalid.
 */
export function formatDateTime(date: string | Date | number): string {
  return formatDateGeneric(date, DATE_TIME_FORMAT);
}

/**
 * Formats a date string or Date object into the specified date format.
 * @param date - The date string or Date object to format.
 * @returns A formatted date string or an empty string if the input is invalid.
 */
export function formatDate(date: string | Date | number): string {
  return formatDateGeneric(date, DATE_FORMAT);
}
