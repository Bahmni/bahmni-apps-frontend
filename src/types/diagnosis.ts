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

/**
 * Interface for formatted diagnosis data
 */
export interface FormattedDiagnosis {
  id: string;
  display: string;
  certainty: Coding;
  recordedDate: string;
  recorder: string;
}

/**
 * Interface for diagnoses grouped by date
 */
export interface DiagnosesByDate {
  date: string;
  diagnoses: FormattedDiagnosis[];
}
