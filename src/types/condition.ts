/**
 * Enum representing the possible clinical statuses of a condition
 */
export enum ConditionStatus {
  Active = 'active',
  Inactive = 'inactive',
}

/**
 * Interface representing a FHIR R4 Condition Bundle
 */
export interface FhirConditionBundle {
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
    readonly resource: FhirCondition;
  }>;
}

/**
 * Interface representing a FHIR R4 Condition resource
 */
export interface FhirCondition {
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
  readonly clinicalStatus?: {
    readonly coding: ReadonlyArray<{
      readonly system: string;
      readonly code: string;
      readonly display: string;
    }>;
  };
  readonly code: {
    readonly coding: ReadonlyArray<{
      readonly system?: string;
      readonly code: string;
      readonly display: string;
    }>;
    readonly text: string;
  };
  readonly subject: {
    readonly reference: string;
    readonly type: string;
    readonly display: string;
  };
  readonly onsetDateTime?: string;
  readonly recordedDate?: string;
  readonly recorder?: {
    readonly reference: string;
    readonly type: string;
    readonly display: string;
  };
  readonly note?: ReadonlyArray<{
    readonly text: string;
    readonly authorString: string;
    readonly time: string;
  }>;
}

/**
 * Interface representing a formatted condition for easier consumption by components
 */
export interface FormattedCondition {
  readonly id: string;
  readonly display: string;
  readonly status: ConditionStatus;
  readonly onsetDate?: string;
  readonly recordedDate?: string;
  readonly recorder?: string;
  readonly code: string;
  readonly codeDisplay: string;
  readonly note?: string[];
}
