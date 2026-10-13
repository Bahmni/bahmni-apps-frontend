import {
  buildDocumentReference,
  createBundleEntry,
  generateUUID,
} from '@bahmni/services';
import type { BundleEntry, Reference } from 'fhir/r4';
import type { InputControlAttributes } from '../../../providers/clinicalConfig/models';
import {
  DOCUMENT_ID_ATTRIBUTE,
  DOCUMENT_TYPE_ATTRIBUTE,
  DOCUMENTS_ID_REQUIRED_ERROR,
  DOCUMENTS_SELECT_TYPE_ERROR,
  DOCUMENTS_UPLOAD_FAILED_ERROR,
  DOCUMENTS_UPLOAD_IN_PROGRESS_ERROR,
  DOCUMENTS_UPLOAD_REQUIRED_ERROR,
} from './constants';
import type {
  CreateDocumentBundleEntriesParams,
  DocumentEntry,
  DocumentEntryErrors,
} from './models';

export const withoutError = (
  errors: DocumentEntryErrors,
  field: keyof DocumentEntryErrors,
): DocumentEntryErrors => ({ ...errors, [field]: undefined });

export const createEmptyEntry = (): DocumentEntry => ({
  id: generateUUID(),
  documentType: null,
  documentId: '',
  note: '',
  files: [],
  errors: {},
});

/** An entry the user has not touched is ignored rather than validated or saved. */
export const isEntryEmpty = (entry: DocumentEntry): boolean =>
  !entry.documentType &&
  !entry.documentId.trim() &&
  !entry.note.trim() &&
  entry.files.length === 0;

const isRequired = (
  name: string,
  attributes: InputControlAttributes[] | undefined,
  requiredByDefault: boolean,
): boolean =>
  attributes?.find((attribute) => attribute.name === name)?.required ??
  requiredByDefault;

const validateFiles = (entry: DocumentEntry): string | undefined => {
  if (entry.files.some((file) => file.status === 'uploading')) {
    return DOCUMENTS_UPLOAD_IN_PROGRESS_ERROR;
  }
  if (entry.files.some((file) => file.status === 'error')) {
    return DOCUMENTS_UPLOAD_FAILED_ERROR;
  }
  return entry.files.length === 0 ? DOCUMENTS_UPLOAD_REQUIRED_ERROR : undefined;
};

export const validateEntry = (
  entry: DocumentEntry,
  attributes: InputControlAttributes[] | undefined,
): DocumentEntryErrors => {
  const errors: DocumentEntryErrors = {};
  if (
    isRequired(DOCUMENT_TYPE_ATTRIBUTE, attributes, true) &&
    !entry.documentType
  ) {
    errors.documentType = DOCUMENTS_SELECT_TYPE_ERROR;
  }
  if (
    isRequired(DOCUMENT_ID_ATTRIBUTE, attributes, false) &&
    !entry.documentId.trim()
  ) {
    errors.documentId = DOCUMENTS_ID_REQUIRED_ERROR;
  }
  const filesError = validateFiles(entry);
  if (filesError) {
    errors.files = filesError;
  }
  return errors;
};

const patientUuidOf = (subject: Reference): string =>
  subject.reference?.split('/').pop() ?? '';

export const createDocumentBundleEntries = ({
  entries,
  encounterSubject,
  encounterReference,
  practitionerUUID,
}: CreateDocumentBundleEntriesParams): BundleEntry[] =>
  entries
    .filter((entry) => !isEntryEmpty(entry))
    .map((entry) =>
      createBundleEntry(
        `urn:uuid:${generateUUID()}`,
        buildDocumentReference(
          patientUuidOf(encounterSubject),
          {
            files: entry.files
              .filter((file) => file.uploadedUrl)
              .map(({ uploadedUrl, contentType, fileName }) => ({
                url: uploadedUrl!,
                contentType,
                title: fileName,
              })),
            masterIdentifier: entry.documentId.trim() || undefined,
            typeCode: entry.documentType?.id,
            typeDisplay: entry.documentType?.label,
            description: entry.note.trim() || undefined,
            authorPractitionerUuid: practitionerUUID || undefined,
          },
          encounterReference,
        ),
        'POST',
      ),
    );
