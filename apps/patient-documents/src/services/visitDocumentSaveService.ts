import {
  AUDIT_LOG_EVENT_DETAILS,
  AuditEventType,
  dispatchAuditEvent,
  DocumentPayload,
  DocumentSaveTarget,
  DocumentType,
  saveDocuments,
  uploadDocument,
} from '@bahmni/services';
import type { PendingDocument } from '@bahmni/widgets';

export interface DocumentSaveFailure {
  fileName: string;
  message: string;
}

export interface VisitDocumentSaveResult {
  /** Ids of the pending documents that are now saved. */
  savedIds: string[];
  /** Upload url per pending document id, so a retry after a failed save does not upload again. */
  uploadedUrls: Record<string, string>;
  failures: DocumentSaveFailure[];
}

interface SaveVisitDocumentsInput {
  patientUuid: string;
  encounterTypeName: string;
  target: DocumentSaveTarget;
  documents: PendingDocument[];
  defaultDocumentType: DocumentType | null;
  authorPractitionerUuid?: string;
}

const messageOf = (error: unknown): string =>
  error instanceof Error ? error.message : String(error);

/**
 * Uploads each document's bytes, then saves the uploaded batch against the visit in one
 * transaction. A failed upload fails only its own document; a rejected transaction fails the whole
 * batch, since nothing in it was written.
 */
export async function saveVisitDocuments({
  patientUuid,
  encounterTypeName,
  target,
  documents,
  defaultDocumentType,
  authorPractitionerUuid,
}: SaveVisitDocumentsInput): Promise<VisitDocumentSaveResult> {
  const failures: DocumentSaveFailure[] = [];
  const uploadedUrls: Record<string, string> = {};

  const uploads = await Promise.allSettled(
    documents.map((document) =>
      document.uploadedUrl
        ? Promise.resolve({ url: document.uploadedUrl })
        : uploadDocument(document.file, encounterTypeName, patientUuid),
    ),
  );
  const uploaded: PendingDocument[] = [];
  documents.forEach((document, index) => {
    const upload = uploads[index];
    if (upload.status === 'fulfilled') {
      uploadedUrls[document.id] = upload.value.url;
      uploaded.push(document);
    } else {
      failures.push({
        fileName: document.fileName,
        message: messageOf(upload.reason),
      });
    }
  });

  if (uploaded.length === 0) {
    return { savedIds: [], uploadedUrls, failures };
  }

  try {
    await saveDocuments({
      patientUuid,
      target,
      documents: uploaded.map((document) => {
        const type = document.documentType ?? defaultDocumentType;
        return {
          url: uploadedUrls[document.id],
          contentType: document.contentType,
          title: document.fileName,
          typeCode: type?.id,
          typeDisplay: type?.label,
          description: document.note.trim() || undefined,
          authorPractitionerUuid,
        } satisfies DocumentPayload;
      }),
    });
  } catch (error) {
    uploaded.forEach((document) =>
      failures.push({ fileName: document.fileName, message: messageOf(error) }),
    );
    return { savedIds: [], uploadedUrls, failures };
  }

  uploaded.forEach(() =>
    dispatchAuditEvent({
      eventType: AUDIT_LOG_EVENT_DETAILS.UPLOAD_PATIENT_DOCUMENT
        .eventType as AuditEventType,
      patientUuid,
      messageParams: { encounterType: encounterTypeName },
      module: encounterTypeName,
    }),
  );

  return {
    savedIds: uploaded.map((document) => document.id),
    uploadedUrls,
    failures,
  };
}
