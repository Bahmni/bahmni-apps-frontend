import type { DocumentSaveTarget, DocumentType } from '@bahmni/services';
import type { ReactNode } from 'react';

// Re-export so consumers/tests of this widget can reference the shared type.
export type { DocumentSaveTarget } from '@bahmni/services';

export interface DocumentUploadProps {
  /** Groups queued files by the visit they belong to — the visit's uuid. */
  sourceId: string;
  saveTarget: DocumentSaveTarget;
}

// A file the user picked but has not saved as a DocumentReference yet. Pending documents live in
// the PendingDocumentsProvider rather than in each upload widget, so a single Save can commit files
// queued under several visits at once.
export interface PendingDocument {
  id: string;
  sourceId: string;
  /** Where this row's document is attached, captured when the file was picked. */
  saveTarget: DocumentSaveTarget;
  file: File;
  /** Local blob: preview URL, revoked when the row leaves the list. */
  url: string;
  fileName: string;
  contentType: string;
  selectedType: DocumentType | null;
  note: string;
  showNote: boolean;
}

export interface PendingDocumentsProviderProps {
  patientUuid: string;
  encounterTypeName: string;
  documentTypes?: DocumentType[];
  defaultOption?: string | null;
  /** Called once per save in which at least one document was stored. */
  onSaved?: () => void;
  children: ReactNode;
}

export interface PendingDocumentsContextValue {
  documentTypes: DocumentType[];
  /** undefined when bahmni.documentUpload.maxFileSizeInMB is unset — no client-side limit. */
  maxFileSizeMb?: number;
  /** Files queued across every visit, so the Save action knows whether it has work. */
  pendingCount: number;
  isSaving: boolean;
  pendingFor: (sourceId: string) => PendingDocument[];
  addFiles: (
    sourceId: string,
    saveTarget: DocumentSaveTarget,
    files: File[],
  ) => void;
  updateRow: (id: string, changes: Partial<PendingDocument>) => void;
  discardRow: (id: string) => void;
  /** The row's own choice, else the configured default, else the first type. */
  effectiveType: (row: PendingDocument) => DocumentType | null;
  saveAll: () => Promise<void>;
}
