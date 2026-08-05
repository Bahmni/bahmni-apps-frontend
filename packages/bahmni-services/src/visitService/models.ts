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

export interface ActiveVisitResult {
  uuid: string;
  visitType: { uuid: string; name: string };
  startDatetime: string;
  stopDatetime: string | null;
}

export interface ActiveVisit {
  results: ActiveVisitResult[];
}

/**
 * Minimal shape of the visit object returned by POST /visit.
 * Reuses the fields already modelled on ActiveVisitResult so the two stay in sync.
 */
export type CreatedVisit = Pick<ActiveVisitResult, 'uuid' | 'startDatetime'>;
