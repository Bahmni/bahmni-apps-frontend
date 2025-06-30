import type { Coding } from 'fhir/r4';

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

/**
 * Interface representing an allergy input entry for form handling
 */
export interface AllergyInputEntry {
  id: string;
  display: string;
  type: string;
  selectedSeverity: Coding | null;
  selectedReactions: Coding[];
  note?: string;
  errors: {
    severity?: string;
    reactions?: string;
  };
  hasBeenValidated: boolean;
}
