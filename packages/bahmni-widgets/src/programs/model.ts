export enum ProgramStatus {
  InProgress = 'in-progress',
  Submitted = 'submitted',
  Finalised = 'finalised',
  Completed = 'completed',
  OnHold = 'on-hold',
  Cancelled = 'cancelled',
  Abandoned = 'abandoned',
}

/**
 * Interface representing a formatted program for easier consumption by components
 */
export interface formattedProgram {
  readonly id: string;
  readonly uuid: string;
  readonly programName: string;
  readonly referenceNumber: string;
  readonly destination: string | null;
  readonly dateEnrolled: string;
  readonly dateEnded: string | null;
  readonly outcome: string | null;
  readonly outcomeDetails: string | null;
  readonly status: ProgramStatus;
  readonly statusKey: string;
  readonly statusClassName: string;
  readonly attributes: Record<string, string>;
}
