import type { DocumentType } from '@bahmni/services';

/** A file picked for a document, previewable locally before and after it is uploaded. */
export interface PendingDocument {
  id: string;
  file: File;
  /** Local object URL used to preview the file. */
  url: string;
  fileName: string;
  contentType: string;
  uploadedUrl?: string;
  status?: 'uploading' | 'uploaded' | 'error';
  error?: string;
}

export interface DocumentEntryErrors {
  documentType?: string;
  documentId?: string;
  files?: string;
}
export interface DocumentEntry {
  id: string;
  documentType: DocumentType | null;
  documentId: string;
  note: string;
  files: PendingDocument[];
  /** Translation keys of the messages to show under each field. */
  errors: DocumentEntryErrors;
}

export interface DocumentUploadConfig {
  attributes?: Array<{ name: string; required?: boolean }>;
  metadata?: Record<string, unknown>;
}

/**
 * Controlled: the consumer owns the documents and saving them. The widget lists them, edits them
 * through onDocumentsChange, and always shows at least one, so it holds no state a remount could lose.
 */
export interface DocumentUploadProps {
  documents: DocumentEntry[];
  onDocumentsChange: (documents: DocumentEntry[]) => void;
  config?: DocumentUploadConfig;
  documentTypes?: DocumentType[];
  defaultDocumentType?: DocumentType | null;
  documentsTitle?: string;
  isSaving?: boolean;
}
