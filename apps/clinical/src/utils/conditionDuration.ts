import { calculateOnsetDate } from '@bahmni/services';
import {
  CONDITION_DURATION_LIMITS,
  type ConditionDurationField,
} from '../constants/conditions';

interface ConditionDuration {
  durationYears: number | null;
  durationMonths: number | null;
  durationDays: number | null;
}

/**
 * Checks whether a value can be stored in a condition duration field
 * (null to clear, or a non-negative integer within the field's limit)
 */
export const isValidConditionDurationValue = (
  field: ConditionDurationField,
  value: number | null,
): boolean =>
  value === null ||
  (typeof value === 'number' &&
    Number.isInteger(value) &&
    value >= 0 &&
    value <= CONDITION_DURATION_LIMITS[field]);

/**
 * Parses raw text typed in a condition duration input.
 * @returns null for empty input, the parsed number for valid input,
 * or undefined when the input must be rejected
 */
export const parseConditionDurationInput = (
  field: ConditionDurationField,
  rawValue: string,
): number | null | undefined => {
  const value = rawValue.trim();
  if (value === '') return null;
  if (!/^\d+$/.test(value)) return undefined;
  const numValue = parseInt(value, 10);
  return isValidConditionDurationValue(field, numValue) ? numValue : undefined;
};

/**
 * A condition has a duration when at least one of years, months or days is
 * greater than zero. Empty fields are treated as zero.
 */
export const hasConditionDuration = (condition: ConditionDuration): boolean =>
  (condition.durationYears ?? 0) +
    (condition.durationMonths ?? 0) +
    (condition.durationDays ?? 0) >
  0;

/**
 * Calculates the condition onset date by subtracting the duration from the
 * consultation date. Years and months are subtracted together as a single
 * month offset (clamping to month end), followed by days.
 * @returns The onset date, or undefined when the condition has no duration
 */
export const calculateConditionOnsetDate = (
  consultationDate: Date,
  condition: ConditionDuration,
): Date | undefined => {
  if (!hasConditionDuration(condition)) return undefined;
  const totalMonths =
    (condition.durationYears ?? 0) * 12 + (condition.durationMonths ?? 0);
  const afterMonths = calculateOnsetDate(
    consultationDate,
    totalMonths,
    'months',
  );
  return (
    afterMonths &&
    calculateOnsetDate(afterMonths, condition.durationDays ?? 0, 'days')
  );
};
