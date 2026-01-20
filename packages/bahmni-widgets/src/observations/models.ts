export interface EncounterDetails {
  id: string;
  type: string;
  date: string;
  provider?: string;
  location?: string;
}

export interface ObservationValue {
  value: string | number | boolean;
  unit?: string;
  type:
    | 'quantity'
    | 'codeable'
    | 'string'
    | 'boolean'
    | 'integer'
    | 'range'
    | 'ratio'
    | 'time'
    | 'dateTime'
    | 'period'
    | 'sampledData';
}

export interface ExtractedObservation {
  id: string;
  display: string;
  observationValue?: ObservationValue;
  effectiveDateTime?: string;
  issued?: string;
  encounter?: EncounterDetails;
  members?: ExtractedObservation[];
}

export interface GroupedObservation {
  id: string;
  display: string;
  observationValue?: ObservationValue;
  effectiveDateTime?: string;
  issued?: string;
  encounter?: EncounterDetails;
  children: ExtractedObservation[];
}

export interface ExtractedObservationsResult {
  observations: ExtractedObservation[];
  groupedObservations: GroupedObservation[];
}

export interface ObservationsByEncounter {
  encounterId: string;
  observations: ExtractedObservation[];
  groupedObservations: GroupedObservation[];
}
