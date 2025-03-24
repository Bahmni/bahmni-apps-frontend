import {
  parseISO,
  isValid,
  differenceInYears,
  differenceInMonths,
  differenceInDays,
  subYears,
  subMonths,
} from 'date-fns';
import { Age } from '@types/patient';

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
