import { Coding } from 'fhir/r4';

export interface DiagnosisInputEntry {
  id: string;
  display: string;
  selectedCertainty: Coding | null;

  errors: {
    certainty?: string;
  };
  hasBeenValidated: boolean;
}

export interface Diagnosis {
  id: string;
  display: string;
  certainty: Coding;
  recordedDate: string;
  recorder: string;
}

export interface DiagnosesByDate {
  date: string;
  diagnoses: Diagnosis[];
}
