/**
 * Interface representing a formatted program for easier consumption by components
 */
export interface PatientProgramViewModel {
  readonly id: string;
  readonly uuid: string;
  readonly programName: string;
  readonly dateEnrolled: string;
  readonly dateCompleted: string | null;
  readonly outcomeName: string | null;
  readonly outcomeDetails: string | null;
  readonly currentStateName: string | null;
  readonly attributes: Record<string, string | Date | null>;
  readonly careManagerDisplay?: string | null;
}

export interface ProgramField {
  name: string;
  enableTranslation?: boolean;
}

export interface ProgramNavigationConfigEntry {
  program: string;
  navigationURL: string;
}
