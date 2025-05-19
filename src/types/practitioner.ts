/**
 * Interface representing a FHIR R4 Practitioner resource
 */
export interface FhirPractitioner {
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
  readonly identifier?: ReadonlyArray<{
    readonly system: string;
    readonly value: string;
  }>;
  readonly active?: boolean;
  readonly name?: ReadonlyArray<{
    readonly id?: string;
    readonly text?: string;
    readonly family?: string;
    readonly given?: ReadonlyArray<string>;
  }>;
  readonly gender?: string;
}

/**
 * Interface representing a formatted practitioner for easier consumption by components
 */
export interface FormattedPractitioner {
  readonly id: string;
  readonly identifier?: string;
  readonly active?: boolean;
  readonly fullName?: string;
  readonly familyName?: string;
  readonly givenName?: string;
  readonly gender?: string;
  readonly lastUpdated?: string;
}
