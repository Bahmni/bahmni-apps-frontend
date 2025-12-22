/**
 * Enum representing the possible priorities of a lab test
 */
export enum LabTestPriority {
  stat = 'Urgent',
  routine = 'Routine',
}

/**
 * Interface representing a formatted lab test for easier consumption by components
 */
export interface FormattedLabTest {
  readonly id: string;
  readonly testName: string;
  readonly priority: LabTestPriority;
  readonly orderedBy: string;
  readonly orderedDate: string; // ISO date string
  readonly formattedDate: string; // Formatted date for display
  readonly result?: string | LabTestResult[];
  readonly testType: string; // "Panel" or not
  readonly note?: string;
}

/**
 * Interface representing lab tests grouped by date
 */
export interface LabTestsByDate {
  readonly date: string; // Formatted date string
  readonly rawDate: string; // Original ISO date string for sorting
  readonly tests: FormattedLabTest[];
}

export interface LabTestResult {
  status: string;
  TestName: string;
  Result: string;
  referenceRange: string;
  reportedOn: string;
  actions: string;
}
