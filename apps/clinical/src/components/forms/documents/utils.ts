import {
  buildDocumentReference,
  createBundleEntry,
  generateUUID,
} from '@bahmni/services';
import { isDocumentEntryEmpty } from '@bahmni/widgets';
import type { DocumentEntry, DocumentEntryErrors } from '@bahmni/widgets';
import type { BundleEntry, Reference } from 'fhir/r4';
import type { InputControlAttributes } from '../../../providers/clinicalConfig/models';
import {
  DOCUMENT_ID_ATTRIBUTE,
  DOCUMENT_ID_PATTERN,
  DOCUMENT_TYPE_ATTRIBUTE,
  DOCUMENTS_ID_ALPHANUMERIC_ERROR,
  DOCUMENTS_ID_REQUIRED_ERROR,
  DOCUMENTS_SELECT_TYPE_ERROR,
  DOCUMENTS_UPLOAD_REQUIRED_ERROR,
} from './constants';
import type { CreateDocumentBundleEntriesParams } from './models';

const isRequired = (
  name: string,
  attributes: InputControlAttributes[] | undefined,
  requiredByDefault: boolean,
): boolean =>
  attributes?.find((attribute) => attribute.name === name)?.required ??
  requiredByDefault;

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
  const documentId = entry.documentId.trim();
  if (!documentId) {
    if (isRequired(DOCUMENT_ID_ATTRIBUTE, attributes, false)) {
      errors.documentId = DOCUMENTS_ID_REQUIRED_ERROR;
    }
  } else if (!DOCUMENT_ID_PATTERN.test(documentId)) {
    errors.documentId = DOCUMENTS_ID_ALPHANUMERIC_ERROR;
  }
  if (entry.files.length === 0) {
    errors.files = DOCUMENTS_UPLOAD_REQUIRED_ERROR;
  }
  return errors;
};

const patientUuidOf = (subject: Reference): string =>
  subject.reference?.split('/').pop() ?? '';

export const isDocumentUploaded = (entry: DocumentEntry): boolean =>
  entry.files.every((file) => !!file.uploadedUrl);

export const createDocumentBundleEntries = ({
  entries,
  encounterSubject,
  encounterReference,
  practitionerUUID,
}: CreateDocumentBundleEntriesParams): BundleEntry[] =>
  entries
    .filter(
      (entry) => !isDocumentEntryEmpty(entry) && isDocumentUploaded(entry),
    )
    .map((entry) =>
      createBundleEntry(
        `urn:uuid:${generateUUID()}`,
        buildDocumentReference(
          patientUuidOf(encounterSubject),
          {
            files: entry.files.map(
              ({ uploadedUrl, contentType, fileName }) => ({
                url: uploadedUrl!,
                contentType,
                title: fileName,
              }),
            ),
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
