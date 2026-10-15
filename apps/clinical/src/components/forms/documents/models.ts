import type { DocumentEntry } from '@bahmni/widgets';
import type { Reference } from 'fhir/r4';
import type { InputControlAttributes } from '../../../providers/clinicalConfig/models';

export interface DocumentsState {
  entries: DocumentEntry[];
  attributes: InputControlAttributes[] | undefined;
  setAttributes: (attributes: InputControlAttributes[] | undefined) => void;
  /** Replaces the documents; files not seen before start uploading straight away. */
  setEntries: (entries: DocumentEntry[]) => void;
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
