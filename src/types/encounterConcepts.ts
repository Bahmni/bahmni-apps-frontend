export interface Concept {
  name: string;
  uuid: string;
}
export interface EncounterConceptsResponse {
  visitTypes: Record<string, string>;
  encounterTypes: Record<string, string>;
  orderTypes: Record<string, string>;
  conceptData: Record<string, unknown>;
}

export interface EncounterConcepts {
  visitTypes: Concept[];
  encounterTypes: Concept[];
  orderTypes: Concept[];
  conceptData: Concept[];
}
