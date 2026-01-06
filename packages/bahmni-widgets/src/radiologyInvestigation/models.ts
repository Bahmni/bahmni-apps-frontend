export interface RadiologyInvestigationViewModel {
  readonly id: string;
  readonly testName: string;
  readonly priority: string;
  readonly orderedBy: string;
  readonly orderedDate: string;
  readonly replaces?: string[];
  readonly note?: string;
}
