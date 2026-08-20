export interface ProgramDetailsViewModel {
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
  readonly allowedStates: {
    uuid: string;
    display: string;
  }[];
}
export interface ProgramField {
  name: string;
  enableTranslation?: boolean;
}
