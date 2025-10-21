// utils/ageUtils.ts
import { intervalToDuration, sub, format, parse } from 'date-fns';

export interface Age {
  years: number;
  months: number;
  days: number;
}

export const AgeUtils = {
  /**
   * Calculate difference in years, months, days between two dates using date-fns
   * Handles leap years, negative values, and timezones correctly
   */
  diffInYearsMonthsDays(dateFrom: Date, dateTo: Date = new Date()): Age {
    const duration = intervalToDuration({ start: dateFrom, end: dateTo });
    return {
      years: duration.years ?? 0,
      months: duration.months ?? 0,
      days: duration.days ?? 0,
    };
  },

  /**
   * Calculate age based on birth date string (yyyy-mm-dd)
   * Uses date-fns parse for proper timezone handling
   */
  fromBirthDate(dob: string): Age {
    const birthDate = parse(dob, 'yyyy-MM-dd', new Date());
    return this.diffInYearsMonthsDays(birthDate, new Date());
  },

  /**
   * Calculate DOB from age using date-fns sub function
   * Handles month/day overflow correctly
   */
  calculateBirthDate(age: Age): string {
    const dob = sub(new Date(), {
      years: age.years || 0,
      months: age.months || 0,
      days: age.days || 0,
    });
    return format(dob, 'yyyy-MM-dd');
  },
};

/**
 * Convert ISO date string (yyyy-mm-dd) to display format dd/mm/yyyy
 */
export const formatToDisplay = (isoDate: string): string => {
  if (!isoDate) return '';
  const date = parse(isoDate, 'yyyy-MM-dd', new Date());
  return format(date, 'dd/MM/yyyy');
};

/**
 * Convert Date object to ISO string (yyyy-mm-dd)
 */
export const formatToISO = (date: Date): string => {
  return format(date, 'yyyy-MM-dd');
};

/**
 * Parse display string (dd/mm/yyyy) or ISO string (yyyy-mm-dd) to Date object
 * Uses date-fns parse for proper handling
 */
export const parseDateStringToDate = (s: string): Date | null => {
  if (!s) return null;

  try {
    // Try dd/mm/yyyy format
    if (s.includes('/')) {
      return parse(s, 'dd/MM/yyyy', new Date());
    }
    // Try yyyy-mm-dd format
    return parse(s, 'yyyy-MM-dd', new Date());
  } catch {
    return null;
  }
};
