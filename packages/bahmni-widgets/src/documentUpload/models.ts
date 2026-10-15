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
  /** Set by consumers that upload on selection, so the file list can show progress and failure. */
  status?: 'uploading' | 'uploaded' | 'error';
  /** Why the upload failed, when status is 'error'. */
  error?: string;
}

export interface DocumentEntryErrors {
  documentType?: string;
  documentId?: string;
  files?: string;
}

/** One document being added: a type, an optional identifier, a note, and the files that make it up. */
export interface DocumentEntry {
  id: string;
  documentType: DocumentType | null;
  documentId: string;
  note: string;
  files: PendingDocument[];
  /** Translation keys of the messages to show under each field. */
  errors: DocumentEntryErrors;
}

/**
 * Controlled: the consumer owns the documents and saving them. The widget lists them, edits them
 * through onDocumentsChange, and always shows at least one, so it holds no state a remount could lose.
 */
export interface DocumentUploadProps {
  documents: DocumentEntry[];
  onDocumentsChange: (documents: DocumentEntry[]) => void;
  documentTypes?: DocumentType[];
  /** Shown as the type of a document that has none chosen. */
  defaultDocumentType?: DocumentType | null;
  isDocumentTypeRequired?: boolean;
  showDocumentId?: boolean;
  isDocumentIdRequired?: boolean;
  /** Extensions such as ".pdf". Any image, video or PDF is accepted when not set. */
  supportedFileTypes?: string[];
  /** Heading of the box the documents are listed in; they are listed without a box when not set. */
  documentsTitle?: string;
  isSaving?: boolean;
}
