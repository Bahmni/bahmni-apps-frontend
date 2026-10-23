export interface ConditionInputEntry {
  id: string;
  display: string;
  durationYears: number | null;
  durationMonths: number | null;
  durationDays: number | null;
  errors: ConditionErrors;
  hasBeenValidated: boolean;
}

export interface ConditionErrors {
  duration?: string;
}
