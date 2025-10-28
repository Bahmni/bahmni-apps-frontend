import { NAME_REGEX, PHONE_REGEX } from './constants';

export const validateName = (value: string): boolean => {
  return NAME_REGEX.test(value);
};

export const validatePhone = (value: string): boolean => {
  return PHONE_REGEX.test(value);
};

export const isValidDateRange = (
  day: number,
  month: number,
  year: number,
): boolean => {
  if (day < 1 || day > 31 || month < 1 || month > 12) {
    return false;
  }

  const parsedDate = new Date(year, month - 1, day);

  // Check if date is valid (e.g., not 31st Feb)
  if (
    parsedDate.getDate() !== day ||
    parsedDate.getMonth() !== month - 1 ||
    parsedDate.getFullYear() !== year
  ) {
    return false;
  }

  return true;
};

export const isFutureDate = (date: Date): boolean => {
  return date > new Date();
};

export const formatDateForDisplay = (date: Date): string => {
  return `${String(date.getDate()).padStart(2, '0')}/${String(date.getMonth() + 1).padStart(2, '0')}/${date.getFullYear()}`;
};
