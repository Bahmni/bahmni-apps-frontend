export interface VisitType {
  name: string;
  uuid: string;
}

export interface VisitTypes {
  visitTypes: Record<string, string>;
}

export interface VisitData {
  patient: string;
  visitType: string;
  location: string;
}

export interface VisitLocationResponse {
  uuid: string;
}

export interface ActiveVisit {
  results: string[];
}
