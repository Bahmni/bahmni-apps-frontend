import { calculateOnsetDate, type ConditionInputEntry } from '@bahmni/services';
import {
  CONDITION_DURATION_LIMITS,
  type ConditionDurationField,
} from '../constants/conditions';

type ConditionDuration = Pick<
  ConditionInputEntry,
  'durationYears' | 'durationMonths' | 'durationDays'
>;

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
  const numValue = Number.parseInt(value, 10);
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
 * consultation date, applied in order — years, then months, then days, each
 * step clamping to month end (per the AC's "applied in that order" wording).
 * @returns The onset date, or undefined when the condition has no duration
 */
export const calculateConditionOnsetDate = (
  consultationDate: Date,
  condition: ConditionDuration,
): Date | undefined => {
  if (!hasConditionDuration(condition)) return undefined;
  const afterYears = calculateOnsetDate(
    consultationDate,
    condition.durationYears ?? 0,
    'years',
  );
  const afterMonths =
    afterYears &&
    calculateOnsetDate(afterYears, condition.durationMonths ?? 0, 'months');
  return (
    afterMonths &&
    calculateOnsetDate(afterMonths, condition.durationDays ?? 0, 'days')
  );
};
