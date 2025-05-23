/**
 * Enum representing the possible statuses of a lab test
 */
export enum LabTestStatus {
  Pending = 'Pending',
  Abnormal = 'Abnormal',
  Normal = 'Normal',
}

/**
 * Enum representing the possible priorities of a lab test
 */
export enum LabTestPriority {
  stat = 'Urgent',
  routine = 'Routine',
}

/**
 * Interface representing a FHIR R4 ServiceRequest Bundle for lab tests
 */
export interface FhirLabTestBundle {
  readonly resourceType: string;
  readonly id: string;
  readonly meta: {
    readonly lastUpdated: string;
  };
  readonly type: string;
  readonly total: number;
  readonly link: ReadonlyArray<{
    readonly relation: string;
    readonly url: string;
  }>;
  readonly entry?: ReadonlyArray<{
    readonly fullUrl: string;
    readonly resource: FhirLabTest;
  }>;
}

/**
 * Interface representing a FHIR R4 ServiceRequest resource for lab tests
 */
export interface FhirLabTest {
  readonly resourceType: string;
  readonly id: string;
  readonly meta: {
    readonly versionId: string;
    readonly lastUpdated: string;
  };
  readonly text?: {
    readonly status: string;
    readonly div: string;
  };
  readonly extension?: ReadonlyArray<{
    readonly url: string;
    readonly valueString: string;
  }>;
  readonly status: string;
  readonly intent: string;
  readonly category: ReadonlyArray<{
    readonly coding: ReadonlyArray<{
      readonly system: string;
      readonly code: string;
      readonly display: string;
    }>;
    readonly text: string;
  }>;
  readonly priority: string;
  readonly code: {
    readonly coding: ReadonlyArray<{
      readonly system?: string;
      readonly code: string;
      readonly display?: string;
    }>;
    readonly text: string;
  };
  readonly subject: {
    readonly reference: string;
    readonly type: string;
    readonly display: string;
  };
  readonly encounter: {
    readonly reference: string;
    readonly type: string;
  };
  readonly occurrencePeriod: {
    readonly start: string;
    readonly end: string;
  };
  readonly requester: {
    readonly reference: string;
    readonly type: string;
    readonly identifier?: {
      readonly value: string;
    };
    readonly display: string;
  };
}

/**
 * Interface representing a formatted lab test for easier consumption by components
 */
export interface FormattedLabTest {
  readonly id: string;
  readonly testName: string;
  readonly status: LabTestStatus;
  readonly priority: LabTestPriority;
  readonly orderedBy: string;
  readonly orderedDate: string; // ISO date string
  readonly formattedDate: string; // Formatted date for display
  readonly result?: string | LabTestResult[];
  readonly testType: string; // "Panel" or "Single Test"
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
