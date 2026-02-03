export enum LabInvestigationPriority {
  stat = 'Urgent',
  routine = 'Routine',
}

export interface FormattedLabInvestigations {
  readonly id: string;
  readonly testName: string;
  readonly priority: LabInvestigationPriority;
  readonly orderedBy: string;
  readonly orderedDate: string; // ISO date string
  readonly formattedDate: string; // Formatted date for display
  readonly result?: string | LabTestResult[];
  readonly testType: string; // "Panel" or not
  readonly note?: string;
}

export interface LabInvestigationsByDate {
  readonly date: string; // Formatted date string
  readonly rawDate: string; // Original ISO date string for sorting
  readonly tests: FormattedLabInvestigations[];
}

export interface LabTestResult {
  status: string;
  TestName: string;
  Result: string;
  referenceRange: string;
  reportedOn: string;
  actions: string;
  interpretation?: string;
}
