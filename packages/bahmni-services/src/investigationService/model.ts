export interface FlattenedInvestigations {
  code: string;
  display: string;
  category: string;
  categoryCode: string;
  disabled?: boolean;
}

export interface ConceptClass {
  uuid: string;
  name: string;
}

export interface OrderType {
  uuid: string;
  display: string;
  conceptClasses: ConceptClass[];
}

export interface OrderTypeResponse {
  results: OrderType[];
}

export interface ExistingServiceRequest {
  conceptCode: string;
  categoryUuid: string;
  display: string;
  requesterUuid: string;
}
