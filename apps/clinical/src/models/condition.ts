export interface ConditionInputEntry {
  id: string;
  display: string;
  durationValue: number | null;
  durationUnit: 'days' | 'months' | 'years' | null;
  errors: ConditionErrors;
  hasBeenValidated: boolean;
}

export interface ConditionErrors {
  durationValue?: string;
  durationUnit?: string;
}
