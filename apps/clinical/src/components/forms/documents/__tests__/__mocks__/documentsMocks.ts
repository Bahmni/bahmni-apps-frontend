import {
  createEmptyDocumentEntry,
  type DocumentEntry,
  type PendingDocument,
} from '@bahmni/widgets';
import type { InputControl } from '../../../../../providers/clinicalConfig/models';

export const CONSENT_FORM_TYPE = { id: 'type-uuid', label: 'Consent form' };
export const LAB_REPORT_TYPE = { id: 'type-1', label: 'Lab Report' };

export const DOCUMENT_TYPES = [
  { id: 'type-1', label: 'Consent form' },
  { id: 'type-2', label: 'Lab report' },
];

export const PATIENT_UUID = 'patient-uuid';
export const PRACTITIONER_UUID = 'practitioner-uuid';
export const ENCOUNTER_REFERENCE = 'urn:uuid:encounter';

export const documentsControlConfig: InputControl = {
  type: 'documents',
  label: 'DOCUMENTS_INPUT_CONTROL_LABEL',
  encounterTypes: ['Patient Document'],
  privileges: ['Add Encounters'],
  attributes: [
    { name: 'documentType', required: true },
    { name: 'documentId', required: true },
  ],
  metadata: {
    documentTypeConceptName: 'Document Type',
    supportedFileTypes: ['.pdf', '.png'],
  },
};

export const createFile = (name = 'scan.png', type = 'image/png'): File =>
  new File(['x'], name, { type });

export const createPendingDocument = (
  name = 'scan.png',
  contentType = 'image/png',
): PendingDocument => ({
  id: `pending-${name}`,
  file: createFile(name, contentType),
  url: 'blob:preview',
  fileName: name,
  contentType,
});

export const createUploadedDocument = (
  name: string,
  contentType: string,
): PendingDocument => ({
  ...createPendingDocument(name, contentType),
  id: `id-${name}`,
  status: 'uploaded',
  uploadedUrl: `100/${name}`,
});

export const createDocumentEntry = (
  overrides: Partial<DocumentEntry> = {},
): DocumentEntry => ({
  ...createEmptyDocumentEntry(),
  documentType: CONSENT_FORM_TYPE,
  documentId: ' DOC-1 ',
  note: ' signed ',
  files: [
    createUploadedDocument('a.png', 'image/png'),
    createUploadedDocument('b.pdf', 'application/pdf'),
  ],
  ...overrides,
});

export const createBlankDocumentEntry = (documentId = ''): DocumentEntry => ({
  ...createEmptyDocumentEntry(),
  documentId,
});
