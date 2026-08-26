import { Encounter } from 'fhir/r4';

/**
 * Interface representing a single attachment within a document
 */
export interface Attachment {
  readonly url: string;
  readonly contentType?: string;
}

/**
 * Interface representing a formatted document for easier consumption by components
 */
export interface DocumentViewModel {
  readonly id: string;
  readonly documentIdentifier: string;
  readonly documentType?: string;
  readonly uploadedOn: string;
  readonly uploadedBy?: string;
  readonly contentType?: string;
  readonly documentUrl: string;
  readonly attachments: Attachment[];
  readonly encounterId?: string;
  readonly description?: string;
}

// url comes from the prior visitDocument upload call.
export interface CreateDocumentReferenceInput {
  patientUuid: string;
  encounterUuid: string;
  url: string;
  contentType?: string;
  title?: string;
  typeCode?: string;
  typeDisplay?: string;
  description?: string;
  authorPractitionerUuid?: string;
}

/** A configurable document type (a set member of the document-type concept). */
export interface DocumentType {
  id: string;
  label: string;
}

/** Details for lazily creating a dedicated document encounter within a visit. */
export interface CreateEncounterInVisit {
  visitUuid: string;
  encounterTypeUuid: string;
  encounterTypeDisplay?: string;
}

/** An existing document encounter to attach a batch to. */
export interface AttachToExistingEncounter {
  encounterUuid: string;
  existingEncounter: Encounter;
}

/** Where a batch of documents is attached: an existing encounter, or a new one in a visit. */
export type DocumentSaveTarget =
  | AttachToExistingEncounter
  | { createEncounterInVisit: CreateEncounterInVisit };

/** A single document. url comes from the prior visitDocument upload call. */
export interface DocumentPayload {
  url: string;
  contentType?: string;
  title?: string;
  typeCode?: string;
  typeDisplay?: string;
  description?: string;
  authorPractitionerUuid?: string;
}

/**
 * The save target is held once for the whole batch rather than repeated on every document, so a
 * batch cannot describe two different targets and no runtime check is needed to reject one.
 */
export interface SaveDocumentsInput {
  patientUuid: string;
  target: DocumentSaveTarget;
  documents: DocumentPayload[];
}
