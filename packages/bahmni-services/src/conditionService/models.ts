export interface ConditionErrors {
  durationValue?: string;
  durationUnit?: string;
}

export interface ConditionInputEntry {
  id: string;
  display: string;
  durationValue: number | null;
  durationUnit: 'days' | 'months' | 'years' | null;
  conceptSystem?: string;
  errors: ConditionErrors;
  hasBeenValidated: boolean;
}
