import type { AllergyIntolerance, Coding } from 'fhir/r4';

/**
 * Interface representing an allergy input entry for form handling
 */
export interface AllergyInputEntry {
  id: string;
  /** FHIR AllergyIntolerance resource UUID. When set, bundle uses PUT to update the existing resource. */
  resourceId?: string;
  /** True when the user has changed severity, reactions, or note since the allergy was pre-loaded. */
  isModified?: boolean;
  /** Full raw FHIR AllergyIntolerance resource — used as the PUT base to preserve clinicalStatus, verificationStatus, etc. */
  rawFhirResource?: AllergyIntolerance;
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
  type: AllergenType | null;
  disabled?: boolean;
}
