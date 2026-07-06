export {
  getDocumentReferences,
  getFormattedDocumentReferences,
  getDocumentReferencePage,
  getDocumentTypes,
  getDocumentUploadMaxSizeMb,
  type DocumentReferencePage,
} from './documentReferenceService';
export { createDocumentReference, saveDocument } from './documentWriteService';
export type {
  DocumentViewModel,
  DocumentType,
  CreateDocumentReferenceInput,
  SaveDocumentInput,
} from './models';
export type { DocumentReference } from 'fhir/r4';
