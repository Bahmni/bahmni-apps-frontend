import { format, formatDistanceToNow, sub } from 'date-fns';

export const parseLongDateToServerFormat = (
  date: Date | string | undefined,
): string | null => {
  if (!date) {
    return null;
  }
  return format(new Date(date), "yyyy-MM-dd'T'HH:mm:ss.SSSZZ");
};

export const calculateAge = (
  birthdate: string,
): { years: number; months: number; days: number } | null => {
  if (!birthdate) {
    return null;
  }
  const today = new Date();
  const birthDate = new Date(birthdate);
  let years = today.getFullYear() - birthDate.getFullYear();
  let months = today.getMonth() - birthDate.getMonth();
  let days = today.getDate() - birthDate.getDate();
  if (months < 0 || (months === 0 && days < 0)) {
    years--;
    months += 12;
  }
  if (days < 0) {
    const prevMonth = new Date(today.getFullYear(), today.getMonth(), 0);
    days += prevMonth.getDate();
    months--;
  }
  return { years, months, days };
};

export const calculateBirthDate = (age: {
  years: number;
  months: number;
  days: number;
}): string => {
  const today = new Date();
  const birthDate = new Date(
    today.getFullYear() - age.years,
    today.getMonth() - age.months,
    today.getDate() - age.days,
  );
  return format(birthDate, 'yyyy-MM-dd');
};

export const formatDate = (date: Date | string | undefined): string | null => {
  if (!date) {
    return null;
  }
  return format(new Date(date), 'dd/MM/yyyy');
};

export const getTodayDate = (): Date => {
  return new Date();
};

export const formatDateDistance = (
  date: Date | string | undefined,
): string | null => {
  if (!date) {
    return null;
  }
  return formatDistanceToNow(new Date(date), { addSuffix: true });
};

export const calculateOnsetDate = (
  consultationDate: Date,
  durationValue: number,
  durationUnit: string,
): Date | null => {
  if (!consultationDate || !durationValue || !durationUnit) {
    return null;
  }

  const duration = { [durationUnit.toLowerCase()]: durationValue };
  return sub(consultationDate, duration);
};
