import { Coding } from 'fhir/r4';

export interface DiagnosisInputEntry {
  id: string;
  title: string;
  selectedCertainty: Coding | null;

  errors: {
    certainty?: string;
  };
  hasBeenValidated: boolean;
}
