import type { DocumentType } from '@bahmni/services';
import type { PendingDocument } from '@bahmni/widgets';
import type { Reference } from 'fhir/r4';
import type { InputControlAttributes } from '../../../providers/clinicalConfig/models';

export interface DocumentEntryErrors {
  documentType?: string;
  documentId?: string;
  files?: string;
}

/** One document: a type, an optional identifier and note, and the files that make it up. */
export interface DocumentEntry {
  id: string;
  documentType: DocumentType | null;
  documentId: string;
  note: string;
  files: PendingDocument[];
  errors: DocumentEntryErrors;
}

export interface DocumentsState {
  entries: DocumentEntry[];
  attributes: InputControlAttributes[] | undefined;
  setAttributes: (attributes: InputControlAttributes[] | undefined) => void;
  addEntry: () => string;
  removeEntry: (id: string) => void;
  updateDocumentType: (id: string, type: DocumentType | null) => void;
  updateDocumentId: (id: string, documentId: string) => void;
  updateNote: (id: string, note: string) => void;
  /** Replaces an entry's files; files not seen before start uploading straight away. */
  setFiles: (id: string, files: PendingDocument[]) => void;
  showDocumentTypeRequired: (id: string) => void;
  validateAll: () => boolean;
  hasData: () => boolean;
  reset: () => void;
}

export interface CreateDocumentBundleEntriesParams {
  entries: DocumentEntry[];
  encounterSubject: Reference;
  encounterReference: string;
  practitionerUUID: string;
}
