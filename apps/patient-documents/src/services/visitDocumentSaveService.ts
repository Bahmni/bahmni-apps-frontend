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

export interface DocumentSaveFailure {
  fileName: string;
  message: string;
}

/** One file of a document, as the save needs it. */
export interface DocumentSaveFile {
  /** Identifies the file in the caller's state and in {@link VisitDocumentSaveResult}. */
  id: string;
  file: File;
  fileName: string;
  contentType: string;
  /** Upload url when the bytes were already uploaded, so a retry does not upload again. */
  uploadedUrl?: string;
}

/**
 * The data the save needs per document: one type and note shared by all of its files. Deliberately
 * owned here rather than reusing an upload widget's view model, so this service stays reusable by
 * any caller with files and owes nothing to the widget package; callers map their own state into
 * this shape.
 */
export interface DocumentSaveInput {
  /** Identifies the document in the caller's state and in {@link VisitDocumentSaveResult}. */
  id: string;
  files: DocumentSaveFile[];
  documentType: DocumentType | null;
  note: string;
}

export interface VisitDocumentSaveResult {
  /** Ids of the input documents that are now saved. */
  savedIds: string[];
  /** Upload url per file id, so a retry after a failed save does not upload again. */
  uploadedUrls: Record<string, string>;
  failures: DocumentSaveFailure[];
}

interface SaveVisitDocumentsInput {
  patientUuid: string;
  encounterTypeName: string;
  target: DocumentSaveTarget;
  documents: DocumentSaveInput[];
  defaultDocumentType: DocumentType | null;
  authorPractitionerUuid?: string;
}

const messageOf = (error: unknown): string =>
  error instanceof Error ? error.message : String(error);

/**
 * Uploads the bytes of every file, then saves the documents whose files all uploaded against the
 * visit in one transaction, one DocumentReference per document holding all of its files. A failed
 * upload fails its document, which stays unsaved for a retry; a rejected transaction fails the
 * whole batch, since nothing in it was written.
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

  const files = documents.flatMap((document) => document.files);
  const uploads = await Promise.allSettled(
    files.map((file) =>
      file.uploadedUrl
        ? Promise.resolve({ url: file.uploadedUrl })
        : uploadDocument(file.file, encounterTypeName, patientUuid),
    ),
  );
  files.forEach((file, index) => {
    const upload = uploads[index];
    if (upload.status === 'fulfilled') {
      uploadedUrls[file.id] = upload.value.url;
    } else {
      failures.push({
        fileName: file.fileName,
        message: messageOf(upload.reason),
      });
    }
  });

  const uploaded = documents.filter((document) =>
    document.files.every((file) => uploadedUrls[file.id]),
  );

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
          files: document.files.map((file) => ({
            url: uploadedUrls[file.id],
            contentType: file.contentType,
            title: file.fileName,
          })),
          typeCode: type?.id,
          typeDisplay: type?.label,
          description: document.note.trim() || undefined,
          authorPractitionerUuid,
        } satisfies DocumentPayload;
      }),
    });
  } catch (error) {
    uploaded.forEach((document) =>
      document.files.forEach((file) =>
        failures.push({ fileName: file.fileName, message: messageOf(error) }),
      ),
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
