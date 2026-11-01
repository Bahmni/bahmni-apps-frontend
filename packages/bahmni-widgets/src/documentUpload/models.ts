import type { DocumentType } from '@bahmni/services';

export interface PendingDocument {
  id: string;
  file: File;
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
  errors: DocumentEntryErrors;
}

export interface DocumentUploadConfig {
  attributes?: Array<{ name: string; required?: boolean }>;
  metadata?: Record<string, unknown>;
}

export interface DocumentUploadProps {
  documents: DocumentEntry[];
  onDocumentsChange: (documents: DocumentEntry[]) => void;
  config?: DocumentUploadConfig;
  documentsTitle?: string;
  isSaving?: boolean;
  defaultOption?: string | null;
}
