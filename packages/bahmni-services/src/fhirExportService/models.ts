export interface FhirExportRequest {
  /** Start of the export range, formatted `yyyy-MM-dd`. */
  startDate?: string;
  /** End of the export range, formatted `yyyy-MM-dd`. */
  endDate?: string;
  anonymise: boolean;
}

export interface FhirExportSubmitResponse {
  status: string;
  taskId: string;
  link: string;
}

export interface FhirExportTask {
  id: string;
  /** FHIR Task status code, e.g. `requested`, `accepted`, `completed`. */
  status: string;
  userName?: string;
  /** ISO timestamp at which the export was requested. */
  authoredOn?: string;
  startDate?: string;
  endDate?: string;
  anonymised: boolean;
  /** Download URL, only present once the export has completed. */
  downloadUrl?: string;
  /** Server-provided failure reason, when available. */
  errorMessage?: string;
}
