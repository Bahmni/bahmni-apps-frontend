export interface ConditionErrors {
  duration?: string;
}

export interface ConditionInputEntry {
  id: string;
  display: string;
  durationYears: number | null;
  durationMonths: number | null;
  durationDays: number | null;
  conceptSystem?: string;
  errors: ConditionErrors;
  hasBeenValidated: boolean;
}
