export interface ProgramDetailsViewModel {
  readonly id: string;
  readonly uuid: string;
  readonly programName: string;
  readonly dateEnrolled: string;
  readonly dateCompleted: string | null;
  readonly outcomeName: string | null;
  readonly outcomeDetails: string | null;
  readonly currentStateName: string | null;
  readonly attributes: Record<string, string | null>;
}
