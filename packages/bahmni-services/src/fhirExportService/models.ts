import { Task } from 'fhir/r4';

export interface FhirExportParams {
  startDate: string;
  endDate: string;
  anonymise: boolean;
}

export interface FhirExportTask {
  id: string;
  userName: string;
  triggeredDate: string;
  startDate: string;
  endDate: string;
  anonymised: boolean;
  status: Task['status'];
  downloadUrl?: string;
  /** Failure reason, when the server provides one. */
  statusReason?: string;
}
