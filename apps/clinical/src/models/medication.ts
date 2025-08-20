import { Frequency } from '@bahmni-frontend/bahmni-services';
import { Medication } from 'fhir/r4';
import { Concept } from './encounterConcepts';

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

  startDate?: Date;

  dispenseQuantity: number;
  dispenseUnit: Concept | null;

  // Validation
  errors: {
    dosage?: string;
    dosageUnit?: string;
    frequency?: string;
    route?: string;
    duration?: string;
    durationUnit?: string;
    startDate?: string;
    dispenseQuantity?: string;
    dispenseUnit?: string;
  };
  hasBeenValidated: boolean;
}

export interface DurationUnitOption {
  code: 'a' | 's' | 'min' | 'd' | 'mo' | 'h' | 'wk' | undefined;
  display: string;
  daysMultiplier: number;
}
