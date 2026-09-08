import { Period } from 'fhir/r4';

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
  visitPeriod?: Period;
}

/** Where a document is attached: an existing encounter, or a new one created within a visit. */
export type DocumentSaveTarget =
  | { encounterUuid: string }
  | { createEncounterInVisit: CreateEncounterInVisit };

// Provide encounterUuid to attach to an existing encounter, or createEncounterInVisit to create one.
export interface SaveDocumentInput {
  patientUuid: string;
  url: string;
  contentType?: string;
  title?: string;
  typeCode?: string;
  typeDisplay?: string;
  description?: string;
  authorPractitionerUuid?: string;
  encounterUuid?: string;
  createEncounterInVisit?: CreateEncounterInVisit;
}
