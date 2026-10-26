export {
  getDocumentReferences,
  getFormattedDocumentReferences,
  getDocumentReferencePage,
  getDocumentTypes,
  getDocumentTypesByConceptUuid,
  getDocumentUploadMaxSizeMb,
  type DocumentReferencePage,
} from './documentReferenceService';
export { buildDocumentReference, saveDocuments } from './documentWriteService';
export type {
  DocumentViewModel,
  DocumentType,
  DocumentSaveTarget,
  CreateEncounterInVisit,
  DocumentFile,
  DocumentPayload,
  SaveDocumentsInput,
  AttachToExistingEncounter,
} from './models';
export type { DocumentReference } from 'fhir/r4';
