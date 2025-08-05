import type { Coding } from 'fhir/r4';

export enum AllergyStatus {
  Active = 'Active',
  Inactive = 'Inactive',
}

export enum AllergySeverity {
  mild = 'mild',
  moderate = 'moderate',
  severe = 'severe',
}

/**
 * Interface representing a formatted allergy for easier consumption by components
 */
export interface FormattedAllergy {
  readonly id: string;
  readonly display: string;
  readonly category?: ReadonlyArray<string>;
  readonly criticality?: string;
  readonly status: AllergyStatus;
  readonly recordedDate: string;
  readonly recorder?: string;
  readonly reactions?: ReadonlyArray<{
    readonly manifestation: string[];
    readonly severity?: AllergySeverity;
  }>;
  readonly severity?: AllergySeverity;
  readonly note?: string;
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

export type AllergenType = 'food' | 'medication' | 'environment';

export interface AllergenConcept {
  uuid: string;
  display: string;
  type: AllergenType;
  disabled?: boolean;
}

export interface AllergenConceptResponse {
  uuid: string;
  setMembers: {
    uuid: string;
    display: string;
    retired: boolean;
  }[];
}
