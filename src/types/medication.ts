export interface MedicationConcept {
  uuid: string;
  display: string;
  strength?: string;
  dosageForm?: string;
  disabled?: boolean;
}

export interface MedicationInputEntry {
  id: string;
  display: string;
  strength?: string;
  dosageForm?: string;
  
  // Dosage controls
  dosage: number;
  dosageUnit: string;
  
  // Frequency and timing
  frequency: string;
  timing?: string; // Before meals, After meals, etc.
  
  // Route and duration
  route: string;
  duration: number;
  durationUnit: string;
  
  // Flags
  isSTAT: boolean;
  isPRN: boolean;
  
  // Additional fields
  startDate?: string;
  instructions?: string;
  
  // Validation
  errors: Record<string, string>;
  hasBeenValidated: boolean;
}

export interface FrequencyOption {
  code: string;
  display: string;
  timesPerDay: number;
}

export interface RouteOption {
  code: string;
  display: string;
}

export interface TimingOption {
  code: string;
  display: string;
}

export interface DosageUnitOption {
  code: string;
  display: string;
}

export interface DurationUnitOption {
  code: string;
  display: string;
  daysMultiplier: number;
}
