// utils/ageUtils.ts

export interface Age {
  years: number;
  months: number;
  days: number;
}

export const AgeUtils = {
  /**
   * Calculate difference in years, months, days between two dates
   */
  diffInYearsMonthsDays(dateFrom: Date, dateTo: Date = new Date()): Age {
    const from = {
      y: dateFrom.getFullYear(),
      m: dateFrom.getMonth(),
      d: dateFrom.getDate(),
    };
    const to = {
      y: dateTo.getFullYear(),
      m: dateTo.getMonth(),
      d: dateTo.getDate(),
    };

    let years = to.y - from.y;
    let months = to.m - from.m;
    let days = to.d - from.d;

    // Adjust negative days
    if (days < 0) {
      months -= 1;
      const prevMonthLastDay = new Date(to.y, to.m, 0).getDate(); // last day of previous month
      days += prevMonthLastDay;
    }

    // Adjust negative months
    if (months < 0) {
      years -= 1;
      months += 12;
    }

    return { years, months, days };
  },

  /**
   * Calculate age based on birth date string (yyyy-mm-dd)
   */
  fromBirthDate(dob: string): Age {
    const birthDate = new Date(dob);
    return this.diffInYearsMonthsDays(birthDate, new Date());
  },

  /**
   * Calculate DOB from age
   */
  calculateBirthDate(age: Age): string {
    const dob = new Date();
    dob.setFullYear(dob.getFullYear() - (age.years || 0));
    dob.setMonth(dob.getMonth() - (age.months || 0));
    dob.setDate(dob.getDate() - (age.days || 0));
    return dob.toISOString().split('T')[0]; // yyyy-mm-dd
  },
};

/**
 * Convert ISO date string (yyyy-mm-dd) to display format dd/mm/yyyy
 */
export const formatToDisplay = (isoDate: string): string => {
  if (!isoDate) return '';
  const [year, month, day] = isoDate.split('-');
  return `${day.padStart(2, '0')}/${month.padStart(2, '0')}/${year}`;
};

/**
 * Convert Date object to ISO string (yyyy-mm-dd)
 */
export const formatToISO = (date: Date): string => {
  return date.toISOString().split('T')[0];
};

/**
 * Parse display string (dd/mm/yyyy) or ISO string (yyyy-mm-dd) to Date object
 */
export const parseDateStringToDate = (s: string): Date | null => {
  if (!s) return null;
  const trimmed = s.trim();

  // dd/mm/yyyy
  const dmY = trimmed.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (dmY) {
    const d = Number(dmY[1]);
    const m = Number(dmY[2]);
    const y = Number(dmY[3]);
    return new Date(y, m - 1, d);
  }

  // yyyy-mm-dd
  const ymd = trimmed.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
  if (ymd) {
    const y = Number(ymd[1]);
    const m = Number(ymd[2]);
    const d = Number(ymd[3]);
    return new Date(y, m - 1, d);
  }

  return null;
};
