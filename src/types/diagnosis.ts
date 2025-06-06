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
  formattedDate: string;
  recorder: string;
}