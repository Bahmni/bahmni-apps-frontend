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
 * Enum for diagnosis certainty status
 */
export enum DiagnosisCertainty {
  Provisional = 'Provisional',
  Confirmed = 'Confirmed',
  Refuted = 'Refuted',
  EnteredInError = 'Entered in Error',
  Unknown = 'Unknown'
}

/**
 * Interface for FHIR Condition resource specific to diagnoses
 */
export interface FhirDiagnosis {
  resourceType: string;
  id: string;
  meta: {
    versionId: string;
    lastUpdated: string;
  };
  clinicalStatus: {
    coding: {
      system: string;
      code: string;
      display: string;
    }[];
  };
  verificationStatus: {
    coding: {
      system: string;
      code: string;
      display: string;
    }[];
  };
  category: {
    coding: {
      system: string;
      code: string;
      display: string;
    }[];
  }[];
  code: {
    coding: {
      system: string;
      code: string;
      display: string;
    }[];
    text: string;
    display?: string;
  };
  subject: {
    reference: string;
    type: string;
    display: string;
  };
  encounter?: {
    reference: string;
    type: string;
  };
  onsetDateTime?: string;
  recordedDate: string;
  recorder: {
    reference: string;
    type: string;
    display: string;
  };
  note?: {
    text: string;
  }[];
}

/**
 * Interface for FHIR Diagnosis Bundle
 */
export interface FhirDiagnosisBundle {
  resourceType: string;
  id: string;
  meta: {
    lastUpdated: string;
  };
  type: string;
  total: number;
  link: {
    relation: string;
    url: string;
  }[];
  entry?: {
    fullUrl: string;
    resource: FhirDiagnosis;
    search: {
      mode: string;
    };
  }[];
}

/**
 * Interface for formatted diagnosis data
 */
export interface FormattedDiagnosis {
  id: string;
  display: string;
  certainty: DiagnosisCertainty;
  recordedDate: string;
  formattedDate: string;
  recorder: string;
  note?: string[];
}

/**
 * Interface for diagnoses grouped by recorder
 */
export interface DiagnosesByRecorder {
  recorder: string;
  diagnoses: FormattedDiagnosis[];
}

/**
 * Interface for diagnoses grouped by date
 */
export interface DiagnosesByDate {
  date: string;
  rawDate: string;
  diagnoses: FormattedDiagnosis[];
}
