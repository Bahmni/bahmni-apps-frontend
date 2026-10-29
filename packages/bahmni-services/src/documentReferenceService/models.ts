import { Encounter, Period } from 'fhir/r4';

export interface Attachment {
  readonly url: string;
  readonly contentType?: string;
}

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

export interface DocumentType {
  id: string;
  label: string;
}

export interface CreateEncounterInVisit {
  visitUuid: string;
  encounterTypeUuid: string;
  encounterTypeDisplay?: string;
  visitPeriod?: Period;
}

export interface AttachToExistingEncounter {
  encounterUuid: string;
  existingEncounter: Encounter;
}

export type DocumentSaveTarget =
  | AttachToExistingEncounter
  | { createEncounterInVisit: CreateEncounterInVisit };

export interface DocumentFile {
  url: string;
  contentType?: string;
  title?: string;
}
export interface DocumentPayload {
  files: DocumentFile[];
  masterIdentifier?: string;
  typeCode?: string;
  typeDisplay?: string;
  description?: string;
  authorPractitionerUuid?: string;
}
export interface SaveDocumentsInput {
  patientUuid: string;
  target: DocumentSaveTarget;
  documents: DocumentPayload[];
}
