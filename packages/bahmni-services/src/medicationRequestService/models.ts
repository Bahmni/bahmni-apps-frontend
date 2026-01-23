import { ConceptClass } from '../conceptService';

/**
 * Enum representing canonical statuses of a medication request
 */
export enum MedicationStatus {
  Active = 'active',
  OnHold = 'on-hold',
  Completed = 'completed',
  Stopped = 'stopped',
  Cancelled = 'cancelled',
  EnteredInError = 'entered-in-error',
  Draft = 'draft',
  Unknown = 'unknown',
}

/**
 * Interface representing a formatted medication for easier consumption by components
 */
export interface MedicationRequest {
  readonly id: string;
  readonly name: string;
  readonly dose?: {
    readonly value: number;
    readonly unit: string;
  };
  readonly frequency?: string;
  readonly route?: string;
  readonly duration?: {
    readonly duration: number;
    readonly durationUnit?: string;
  };
  readonly quantity: {
    readonly value: number;
    readonly unit: string;
  };
  readonly status: MedicationStatus;
  readonly priority: string;
  readonly startDate: string;
  readonly orderDate: string;
  readonly orderedBy: string;
  readonly instructions: string;
  readonly additionalInstructions?: string;
  readonly asNeeded: boolean;
  readonly isImmediate: boolean;
  readonly note?: string;
}

export interface FormattedMedicationRequest {
  readonly id: string;
  readonly name: string;
  readonly dosage: string;
  readonly dosageUnit: string;
  readonly quantity: string;
  readonly instruction: string;
  readonly startDate: string;
  readonly orderDate: string;
  readonly orderedBy: string;
  readonly status: MedicationStatus;
  readonly asNeeded: boolean;
  readonly isImmediate: boolean;
  readonly note?: string;
}

/**
 * Interface for frequency configuration
 */
export interface Frequency extends ConceptClass {
  frequencyPerDay: number;
}

/**
 * Interface for order attributes
 */
export interface OrderAttribute {
  uuid: string;
  name: string;
  dataType: string;
  shortName: string;
  units: string | null;
  conceptClass: string;
  hiNormal: string | null;
  lowNormal: string | null;
  set: boolean;
}

/**
 * Interface for medication orders metadata response
 */
export interface MedicationOrdersMetadataResponse {
  doseUnits: ConceptClass[];
  routes: ConceptClass[];
  durationUnits: ConceptClass[];
  dispensingUnits: ConceptClass[];
  dosingRules: string[];
  dosingInstructions: ConceptClass[];
  orderAttributes: OrderAttribute[];
  frequencies: Frequency[];
}
