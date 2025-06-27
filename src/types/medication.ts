import { Medication } from "fhir/r4";
import { Concept } from "./encounterConcepts";
import { Frequency } from "./medicationConfig";

export interface MedicationFilterResult {
  displayName: string;
  medication?: Medication;
  disabled: boolean;
}

export interface MedicationInputEntry {
  id: string;
  medication: Medication;
  display: string;
  
  // Dosage controls
  dosage: number;
  dosageUnit: Concept | null;
  
  // Frequency and timing
  frequency: Frequency | null;
  instruction: Concept | null;
  
  // Route and duration
  route: Concept | null;
  duration: number;
  durationUnit: DurationUnitOption | null;
  
  // Flags
  isSTAT: boolean;
  isPRN: boolean;
  
  startDate?: string;
  
  // Validation
  errors: {
    dosage?: string;
    dosageUnit?: string;
    frequency?: string;
    route?: string;
    duration?: string;
    durationUnit?: string;
    timing?: string;
    startDate?: string;
    instructions?: string;
  }
  hasBeenValidated: boolean;
}

export interface DurationUnitOption {
  code: string;
  display: string;
  daysMultiplier: number;
}
