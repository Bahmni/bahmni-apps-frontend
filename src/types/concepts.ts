export interface ConceptSearch {
  conceptName: string;
  conceptUuid: string;
  matchedName: string;
  disabled?: boolean;
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
