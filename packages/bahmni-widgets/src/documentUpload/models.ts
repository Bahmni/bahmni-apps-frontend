import type { DocumentSaveTarget, DocumentType } from '@bahmni/services';

// Re-export so consumers/tests of this widget can reference the shared type.
export type { DocumentSaveTarget } from '@bahmni/services';

export interface DocumentSaveFailure {
  fileName: string;
  message: string;
}

export interface DocumentSaveSummary {
  savedCount: number;
  failures: DocumentSaveFailure[];
}

export interface DocumentUploadRef {
  save: () => Promise<DocumentSaveSummary>;
}

export interface DocumentUploadProps {
  patientUuid: string;
  encounterTypeName: string;
  saveTarget: DocumentSaveTarget;
  documentTypes?: DocumentType[];
  defaultOption?: string | null;
  onSaved?: () => void;
  onPendingChange?: (hasPendingDocument: boolean) => void;
}

export interface PendingDocument {
  id: string;
  file: File;
  url: string;
  fileName: string;
  contentType: string;
  documentType: DocumentType | null;
  note: string;
  isNoteVisible: boolean;
  uploadedUrl?: string;
}
