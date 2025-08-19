export interface ConceptSearch {
  conceptUuid: string;
  conceptName: string;
  matchedName: string;
  disabled?: boolean;
}

export interface ConceptClass {
  uuid: string;
  name: string;
}
