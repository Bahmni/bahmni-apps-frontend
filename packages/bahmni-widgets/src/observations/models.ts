export interface ObservationConfig {
  conceptNames?: string[];
  conceptCodes?: string[];
  displayNameType?: 'FSN' | 'SHORT' | 'FULLY_SPECIFIED';
}

export interface ChildObservation {
  id: string;
  conceptName: string;
  value: string;
  unit?: string;
}

export interface Observation {
  id: string;
  date: string;
  conceptName: string;
  value: string;
  unit?: string;
  recordedBy?: string;
  children: ChildObservation[];
}

export interface ObservationRow {
  id: string;
  conceptName: string;
  value: string;
  recordedBy: string;
  isChild?: boolean;
}

export interface GroupedObservations {
  date: string;
  rows: ObservationRow[];
}

export interface RenderedObservationRow {
  id: string;
  conceptName: React.ReactNode;
  value: React.ReactNode;
  recordedBy: React.ReactNode;
}

export interface FormattedObservationGroup {
  date: string;
  headers: Array<{ key: string; header: string }>;
  rows: RenderedObservationRow[];
}
