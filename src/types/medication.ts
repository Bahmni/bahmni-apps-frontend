/**
 * Enum representing the possible statuses of a medication request
 */
export enum MedicationStatus {
  Active = 'active',
  Scheduled = 'scheduled',
  Completed = 'completed',
  Stopped = 'stopped',
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
    readonly durationUnit: string;
  };
  readonly status: MedicationStatus;
  readonly priority?: string;
  readonly startDate?: string;
  readonly orderDate?: string;
  readonly orderedBy?: string;
  readonly notes?: string;
  readonly isActive: boolean;
  readonly isScheduled: boolean;
}
