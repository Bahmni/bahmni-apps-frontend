export {
  getDocumentReferences,
  getFormattedDocumentReferences,
  getDocumentReferencePage,
  getDocumentTypes,
  getDocumentUploadMaxSizeMb,
  type DocumentReferencePage,
} from './documentReferenceService';
export { saveDocuments } from './documentWriteService';
export type {
  DocumentViewModel,
  DocumentType,
  DocumentSaveTarget,
  CreateEncounterInVisit,
  DocumentPayload,
  SaveDocumentsInput,
  AttachToExistingEncounter,
} from './models';
export type { DocumentReference } from 'fhir/r4';
