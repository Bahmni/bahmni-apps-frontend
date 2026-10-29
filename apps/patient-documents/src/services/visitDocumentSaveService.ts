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
export interface DocumentSaveFile {
  id: string;
  file: File;
  fileName: string;
  contentType: string;
  uploadedUrl?: string;
}

export interface DocumentSaveInput {
  id: string;
  files: DocumentSaveFile[];
  documentType: DocumentType | null;
  note: string;
}

export interface VisitDocumentSaveResult {
  savedIds: string[];
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

interface UploadDocumentFilesInput {
  patientUuid: string;
  encounterTypeName: string;
  documents: DocumentSaveInput[];
}

export interface DocumentFilesUploadResult {
  uploadedUrls: Record<string, string>;
  failures: DocumentSaveFailure[];
}

const messageOf = (error: unknown): string =>
  error instanceof Error ? error.message : String(error);

export async function saveVisitDocuments({
  patientUuid,
  encounterTypeName,
  target,
  documents,
  defaultDocumentType,
  authorPractitionerUuid,
}: SaveVisitDocumentsInput): Promise<VisitDocumentSaveResult> {
  const { uploadedUrls, failures } = await uploadDocumentFiles({
    patientUuid,
    encounterTypeName,
    documents,
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

export async function uploadDocumentFiles({
  patientUuid,
  encounterTypeName,
  documents,
}: UploadDocumentFilesInput): Promise<DocumentFilesUploadResult> {
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

  return { uploadedUrls, failures };
}
