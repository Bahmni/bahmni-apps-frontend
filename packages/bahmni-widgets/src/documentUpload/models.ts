import type { DocumentSaveTarget, DocumentType } from '@bahmni/services';

// Re-export so consumers/tests of this widget can reference the shared type.
export type { DocumentSaveTarget } from '@bahmni/services';

/** A document that could not be saved, named so the consumer can list it. */
export interface DocumentSaveFailure {
  fileName: string;
  message: string;
}

// The outcome of one save() run. The widget raises no notification of its own for a save; it hands
// back the numbers so the consumer can report a whole Save — across every visit — in one message.
export interface DocumentSaveSummary {
  savedCount: number;
  failures: DocumentSaveFailure[];
}

// Saving is driven by the consumer (e.g. a page-level footer Save), not by the widget itself.
export interface DocumentUploadHandle {
  // Uploads and saves every pending document; resolves to an empty summary when none are pending.
  save: () => Promise<DocumentSaveSummary>;
}

export interface DocumentUploadProps {
  patientUuid: string;
  encounterTypeName: string;
  saveTarget: DocumentSaveTarget;
  documentTypes?: DocumentType[];
  defaultOption?: string | null;
  onSaved?: () => void;
  // Lets the consumer enable/disable its own Save control as files are picked or discarded.
  onPendingChange?: (hasPendingDocument: boolean) => void;
}

// Chosen but not yet uploaded or saved. `url` is a blob URL used for the preview only; the File is
// kept so saving (or retrying a failed save) never depends on the input still holding a selection.
export interface PendingDocument {
  id: string;
  file: File;
  url: string;
  fileName: string;
  contentType: string;
  documentType: DocumentType | null;
  note: string;
  isNoteVisible: boolean;
  // Set once the bytes are stored server-side, so retrying a failed save does not upload the file a
  // second time and leave the first copy orphaned.
  uploadedUrl?: string;
}
