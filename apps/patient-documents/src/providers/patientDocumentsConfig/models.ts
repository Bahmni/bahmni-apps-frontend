import { PatientDocumentsConfig } from '../../config/documentsConfig';

export interface PatientDocumentsConfigContextType {
  patientDocumentsConfig: PatientDocumentsConfig | null | undefined;
  isLoading: boolean;
  error: Error | null;
}
