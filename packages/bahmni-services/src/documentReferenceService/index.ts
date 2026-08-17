export {
  getDocumentReferences,
  getFormattedDocumentReferences,
  getDocumentReferencePage,
  getDocumentTypes,
  getDocumentUploadMaxSizeMb,
  type DocumentReferencePage,
} from './documentReferenceService';
export {
  createDocumentReference,
  saveDocument,
  saveDocuments,
} from './documentWriteService';
export type {
  DocumentViewModel,
  DocumentType,
  DocumentSaveTarget,
  CreateEncounterInVisit,
  CreateDocumentReferenceInput,
  SaveDocumentInput,
  DocumentToSave,
  SaveDocumentsInput,
  SaveDocumentsResult,
} from './models';
export type { DocumentReference } from 'fhir/r4';
