/**
 * Enum representing the possible clinical statuses of an allergy
 */
export enum AllergyStatus {
  Active = 'active',
  Inactive = 'inactive',
}

/**
 * Interface representing a FHIR R4 AllergyIntolerance Bundle
 */
export interface FhirAllergyIntoleranceBundle {
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
    readonly resource: FhirAllergyIntolerance;
  }>;
}

/**
 * Interface representing a FHIR R4 AllergyIntolerance resource
 */
export interface FhirAllergyIntolerance {
  readonly resourceType: string;
  readonly id: string;
  readonly meta: {
    readonly versionId: string;
    readonly lastUpdated: string;
  };
  readonly clinicalStatus: {
    readonly coding: ReadonlyArray<{
      readonly system: string;
      readonly code: string;
      readonly display: string;
    }>;
  };
  readonly type?: string;
  readonly category?: ReadonlyArray<string>;
  readonly criticality?: string;
  readonly code: {
    readonly coding: ReadonlyArray<{
      readonly system: string;
      readonly code: string;
      readonly display: string;
    }>;
    readonly text: string;
  };
  readonly patient: {
    readonly reference: string;
    readonly display: string;
  };
  readonly recordedDate: string;
  readonly recorder?: {
    readonly reference: string;
    readonly display: string;
  };
  readonly reaction?: ReadonlyArray<{
    readonly manifestation: ReadonlyArray<{
      readonly coding: ReadonlyArray<{
        readonly system?: string;
        readonly code: string;
        readonly display: string;
      }>;
    }>;
    readonly severity?: string;
  }>;
  readonly note?: ReadonlyArray<{
    readonly text: string;
  }>;
}

/**
 * Interface representing a formatted allergy for easier consumption by components
 */
export interface FormattedAllergy {
  readonly id: string;
  readonly display: string;
  readonly category?: ReadonlyArray<string>;
  readonly criticality?: string;
  readonly status: string;
  readonly recordedDate: string;
  readonly recorder?: string;
  readonly reactions?: ReadonlyArray<{
    readonly manifestation: string[];
    readonly severity?: string;
  }>;
  readonly severity?: string;
  readonly note?: string[];
}
