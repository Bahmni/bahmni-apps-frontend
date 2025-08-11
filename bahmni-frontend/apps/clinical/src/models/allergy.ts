import type { Coding } from 'fhir/r4';

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
  type: AllergenType | null;
  disabled?: boolean;
}
