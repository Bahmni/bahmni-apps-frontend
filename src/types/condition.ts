/**
 * Enum representing the possible clinical statuses of a condition
 */
export enum ConditionStatus {
  Active = 'active',
  Inactive = 'inactive',
}

/**
 * Interface representing a formatted condition for easier consumption by components
 */
export interface FormattedCondition {
  readonly id: string;
  readonly display: string;
  readonly status: ConditionStatus;
  readonly onsetDate?: string;
  readonly recordedDate?: string;
  readonly recorder?: string;
  readonly code: string;
  readonly codeDisplay: string;
  readonly note?: string[];
}

export interface ConditionErrors {
  durationValue?: string;
  durationUnit?: string;
}

export interface ConditionInputEntry {
  id: string;
  display: string;
  durationValue: number | null;
  durationUnit: 'days' | 'months' | 'years' | null;
  errors: ConditionErrors;
  hasBeenValidated: boolean;
}
