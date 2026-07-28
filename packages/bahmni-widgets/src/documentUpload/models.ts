import type { DocumentSaveTarget, DocumentType } from '@bahmni/services';

// Re-export so consumers/tests of this widget can reference the shared type.
export type { DocumentSaveTarget } from '@bahmni/services';

export interface DocumentUploadProps {
  patientUuid: string;
  encounterTypeName: string;
  saveTarget: DocumentSaveTarget;
  documentTypes?: DocumentType[];
  defaultOption?: string | null;
  onSaved?: () => void;
}

// Uploaded (bytes stored, url returned) but not yet saved as a DocumentReference.
export interface PendingDocument {
  url: string;
  fileName: string;
  contentType: string;
}
