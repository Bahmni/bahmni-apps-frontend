export interface ConceptSearch {
  conceptName: string;
  conceptUuid: string;
  matchedName: string;
  disabled?: boolean;
}

export interface ConceptClass {
  uuid: string;
  name: string;
}
