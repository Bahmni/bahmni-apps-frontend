import type { DocumentType } from '@bahmni/services';

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

/**
 * Controlled: the consumer owns the pending documents and saving them. The widget only selects,
 * edits and discards them, so it holds no state a remount could lose.
 */
export interface DocumentUploadProps {
  documents: PendingDocument[];
  onDocumentsChange: (documents: PendingDocument[]) => void;
  documentTypes?: DocumentType[];
  defaultOption?: string | null;
  isSaving?: boolean;
}
