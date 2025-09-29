export interface VitalFlowSheetData {
  tabularData: Record<string, Record<string, VitalFlowSheetObservation>>;
  conceptDetails: VitalFlowSheetConceptDetail[];
}

export interface VitalFlowSheetConceptDetail {
  name: string;
  fullName: string;
  units: string;
  hiNormal: number;
  lowNormal: number;
  attributes: Record<string, unknown>;
}

export interface VitalFlowSheetObservation {
  value: string;
  abnormal: boolean;
}

export interface VitalFlowSheetConfig {
  latestCount?: number;
  numberOfVisits?: number;
  obsConcepts: string[];
}
