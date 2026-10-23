export type ConditionDurationField = 'years' | 'months' | 'days';

export const CONDITION_DURATION_FIELDS: ConditionDurationField[] = [
  'years',
  'months',
  'days',
];

export const CONDITION_DURATION_LIMITS: Record<ConditionDurationField, number> =
  {
    years: 150,
    months: 999,
    days: 999,
  };

export const CONDITION_DURATION_LABELS: Record<ConditionDurationField, string> =
  {
    years: 'CONDITIONS_DURATION_YEARS',
    months: 'CONDITIONS_DURATION_MONTHS',
    days: 'CONDITIONS_DURATION_DAYS',
  };

export const CONDITION_DURATION_REQUIRED_ERROR = 'CONDITIONS_DURATION_REQUIRED';
