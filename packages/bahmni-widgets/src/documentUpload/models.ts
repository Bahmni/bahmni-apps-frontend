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
  /** Set by consumers that upload on selection, so the file list can show progress and failure. */
  status?: 'uploading' | 'uploaded' | 'error';
  /** Why the upload failed, when status is 'error'. */
  error?: string;
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
  /**
   * Shows only the files (thumbnail, name, remove) without a type or note per file, for consumers
   * that describe the files elsewhere, such as one document made of several files.
   */
  fileOnly?: boolean;
  /** Extensions such as ".pdf". Any image, video or PDF is accepted when not set. */
  supportedFileTypes?: string[];
  /** Return false to keep the file dialog from opening, e.g. while a precondition is unmet. */
  canSelectFiles?: () => boolean;
}
