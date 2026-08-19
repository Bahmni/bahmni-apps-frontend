import { Button, Dropdown, IconButton, Link } from '@bahmni/design-system';
import {
  AUDIT_LOG_EVENT_DETAILS,
  AuditEventType,
  dispatchAuditEvent,
  DocumentType,
  getDocumentUploadMaxSizeMb,
  SaveDocumentInput,
  saveDocument,
  saveDocuments,
  uploadDocument,
} from '@bahmni/services';
import { Close } from '@carbon/icons-react';
import { InlineLoading, TextArea } from '@carbon/react';
import { useQuery } from '@tanstack/react-query';
import React, { useImperativeHandle, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useActivePractitioner } from '../activePractitioner';
import { useNotification } from '../notification';
import styles from './__styles__/DocumentUpload.module.scss';
import { FILE_INPUT_ACCEPT, MAX_NOTE_LENGTH } from './constants';
import {
  DocumentSaveFailure,
  DocumentSaveSummary,
  DocumentUploadProps,
  PendingDocument,
} from './models';
import { renderDocumentTile } from './renderDocumentTile';
import { isAcceptedFileType } from './utils';

// An uploaded file (bytes stored, url returned) waiting for its DocumentReference.
interface UploadedDocument {
  document: PendingDocument;
  url: string;
}

const messageOf = (error: unknown): string =>
  error instanceof Error ? error.message : String(error);

export const DocumentUpload: React.FC<DocumentUploadProps> = ({
  patientUuid,
  encounterTypeName,
  saveTarget,
  documentTypes = [],
  defaultOption,
  onSaved,
  onPendingChange,
  ref,
}) => {
  const { t } = useTranslation();
  const { addNotification } = useNotification();
  const { practitioner } = useActivePractitioner();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Max size comes solely from the bahmni.documentUpload.maxFileSizeInMB setting; when it is not
  // set there is no client-side size limit (the backend remains the authority).
  const { data: maxFileSizeMb } = useQuery({
    queryKey: ['documentUploadMaxSizeMb'],
    queryFn: getDocumentUploadMaxSizeMb,
  });

  const [pendingDocuments, setPendingDocuments] = useState<PendingDocument[]>(
    [],
  );
  const [isSaving, setIsSaving] = useState(false);
  // Own counter rather than the blob URL or the file name: the same file can be picked twice, and
  // rows must stay tellable apart while they are edited, saved and removed.
  const nextPendingId = useRef(0);

  const defaultDocumentType =
    documentTypes.find(
      (type) =>
        type.label?.toLowerCase().trim() ===
        defaultOption?.toLowerCase().trim(),
    ) ??
    documentTypes[0] ??
    null;

  // Resolved on use, so a file chosen before the type list arrived still gets the default.
  const typeOf = (document: PendingDocument): DocumentType | null =>
    document.documentType ?? defaultDocumentType;

  const replacePending = (next: PendingDocument[]) => {
    setPendingDocuments(next);
    onPendingChange?.(next.length > 0);
  };

  const updatePending = (id: string, patch: Partial<PendingDocument>) =>
    setPendingDocuments((current) =>
      current.map((document) =>
        document.id === id ? { ...document, ...patch } : document,
      ),
    );

  const revokePreview = (document: PendingDocument) => {
    if (document.url.startsWith('blob:')) {
      URL.revokeObjectURL(document.url);
    }
  };

  const discardPending = (id: string) => {
    const document = pendingDocuments.find((pending) => pending.id === id);
    if (document) {
      revokePreview(document);
    }
    replacePending(pendingDocuments.filter((pending) => pending.id !== id));
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files ?? []);
    // Cleared so picking the same file again still raises a change event.
    event.target.value = '';
    if (files.length === 0) {
      return;
    }

    const accepted: PendingDocument[] = [];
    const unsupported: string[] = [];
    const tooLarge: string[] = [];

    files.forEach((file) => {
      if (!isAcceptedFileType(file.type)) {
        unsupported.push(file.name);
        return;
      }
      if (
        maxFileSizeMb !== undefined &&
        file.size > maxFileSizeMb * 1000 * 1000
      ) {
        tooLarge.push(file.name);
        return;
      }
      accepted.push({
        id: `pending-${nextPendingId.current++}`,
        file,
        url: URL.createObjectURL(file),
        fileName: file.name,
        contentType: file.type,
        documentType: null,
        note: '',
        isNoteVisible: false,
      });
    });

    // One notification per reason, no matter how many files a selection got rejected for.
    if (unsupported.length > 0) {
      addNotification({
        title: t('DOCUMENT_UPLOAD_INVALID_TYPE_TITLE'),
        message: t('DOCUMENT_UPLOAD_INVALID_TYPE_MESSAGE'),
        type: 'error',
      });
    }
    if (tooLarge.length > 0) {
      addNotification({
        title: t('DOCUMENT_UPLOAD_SIZE_EXCEEDED_TITLE'),
        message: t('DOCUMENT_UPLOAD_SIZE_EXCEEDED_MESSAGE', {
          size: maxFileSizeMb,
        }),
        type: 'error',
      });
    }

    if (accepted.length > 0) {
      replacePending([...pendingDocuments, ...accepted]);
    }
  };

  const toSaveInput = ({ document, url }: UploadedDocument) => {
    const type = typeOf(document);
    return {
      patientUuid,
      url,
      contentType: document.contentType,
      title: document.fileName,
      typeCode: type?.id,
      typeDisplay: type?.label,
      description: document.note.trim() || undefined,
      authorPractitionerUuid: practitioner?.uuid,
      ...saveTarget,
    } satisfies SaveDocumentInput;
  };

  // With an existing encounter every document is an independent POST, so they are saved one by one
  // and only the ones that really failed stay pending — a retry cannot duplicate the rest. A visit
  // with no document encounter yet must instead go in a single transaction (one encounter for the
  // batch), which is atomic: either all of its documents are saved or none are.
  const saveUploaded = async (
    uploaded: UploadedDocument[],
  ): Promise<Array<{ uploaded: UploadedDocument; error?: unknown }>> => {
    if ('encounterUuid' in saveTarget) {
      const results = await Promise.allSettled(
        uploaded.map((entry) => saveDocument(toSaveInput(entry))),
      );
      return uploaded.map((entry, index) => {
        const result = results[index];
        return result.status === 'rejected'
          ? { uploaded: entry, error: result.reason }
          : { uploaded: entry };
      });
    }

    try {
      await saveDocuments(uploaded.map(toSaveInput));
      return uploaded.map((entry) => ({ uploaded: entry }));
    } catch (error) {
      return uploaded.map((entry) => ({ uploaded: entry, error }));
    }
  };

  const handleSave = async (): Promise<DocumentSaveSummary> => {
    const documents = pendingDocuments;
    if (documents.length === 0 || isSaving) {
      return { savedCount: 0, failures: [] };
    }

    setIsSaving(true);
    try {
      const failures: DocumentSaveFailure[] = [];

      const uploads = await Promise.allSettled(
        documents.map((document) =>
          uploadDocument(document.file, encounterTypeName, patientUuid),
        ),
      );
      const uploaded: UploadedDocument[] = [];
      documents.forEach((document, index) => {
        const upload = uploads[index];
        if (upload.status === 'fulfilled') {
          uploaded.push({ document, url: upload.value.url });
        } else {
          failures.push({
            fileName: document.fileName,
            message: messageOf(upload.reason),
          });
        }
      });

      const outcomes = uploaded.length > 0 ? await saveUploaded(uploaded) : [];
      const savedIds = new Set<string>();
      outcomes.forEach(({ uploaded: entry, error }) => {
        if (error) {
          failures.push({
            fileName: entry.document.fileName,
            message: messageOf(error),
          });
          return;
        }
        savedIds.add(entry.document.id);
        dispatchAuditEvent({
          eventType: AUDIT_LOG_EVENT_DETAILS.UPLOAD_PATIENT_DOCUMENT
            .eventType as AuditEventType,
          patientUuid,
          messageParams: { encounterType: encounterTypeName },
          module: encounterTypeName,
        });
      });

      if (savedIds.size > 0) {
        // Anything that failed stays listed, with its preview intact, so it can be retried.
        documents
          .filter((document) => savedIds.has(document.id))
          .forEach(revokePreview);
        replacePending(
          documents.filter((document) => !savedIds.has(document.id)),
        );
        onSaved?.();
      }

      return { savedCount: savedIds.size, failures };
    } finally {
      setIsSaving(false);
    }
  };

  // No deps: the handle is rebuilt every render so save() always closes over the current pending
  // documents.
  useImperativeHandle(ref, () => ({ save: handleSave }));

  return (
    <div className={styles.container}>
      {pendingDocuments.length > 0 && (
        <div className={styles.pending}>
          {pendingDocuments.map((document, index) => (
            <div
              key={document.id}
              className={styles.pendingDocument}
              data-testid="pending-document-row"
            >
              <div className={styles.pendingRow}>
                <div className={styles.fileCell}>
                  {renderDocumentTile({
                    id: document.id,
                    src: document.url,
                    title: document.fileName,
                    contentType: document.contentType,
                  })}
                </div>
                <div className={styles.typeCell}>
                  <Dropdown
                    id={`document-type-${index}`}
                    testId="document-type-dropdown"
                    titleText=""
                    aria-label={t('DOCUMENT_UPLOAD_CHOOSE_TYPE')}
                    label={t('DOCUMENT_UPLOAD_CHOOSE_TYPE')}
                    items={documentTypes}
                    selectedItem={typeOf(document)}
                    itemToString={(item: DocumentType | null) =>
                      item?.label ?? ''
                    }
                    onChange={({
                      selectedItem,
                    }: {
                      selectedItem: DocumentType | null;
                    }) =>
                      updatePending(document.id, { documentType: selectedItem })
                    }
                  />
                </div>
                <div className={styles.actionsCell}>
                  {isSaving && (
                    <InlineLoading description={t('DOCUMENT_UPLOAD_SAVING')} />
                  )}
                  <IconButton
                    label={t('DOCUMENT_UPLOAD_DISCARD')}
                    kind="ghost"
                    size="md"
                    disabled={isSaving}
                    onClick={() => discardPending(document.id)}
                  >
                    <Close />
                  </IconButton>
                </div>
              </div>
              <Link
                className={styles.addNoteLink}
                onClick={() =>
                  updatePending(document.id, {
                    isNoteVisible: !document.isNoteVisible,
                  })
                }
              >
                {t('DOCUMENT_UPLOAD_ADD_NOTE')}
              </Link>
              {document.isNoteVisible && (
                <TextArea
                  id={`document-note-${index}`}
                  data-testid="document-note"
                  className={styles.noteArea}
                  labelText=""
                  aria-label={t('DOCUMENT_UPLOAD_ADD_NOTE')}
                  rows={2}
                  value={document.note}
                  maxLength={MAX_NOTE_LENGTH}
                  placeholder={t('DOCUMENT_UPLOAD_NOTE_PLACEHOLDER')}
                  onChange={(e) =>
                    updatePending(document.id, { note: e.target.value })
                  }
                />
              )}
            </div>
          ))}
        </div>
      )}

      <div className={styles.uploader}>
        <p className={styles.uploaderTitle}>{t('DOCUMENT_UPLOAD_TITLE')}</p>
        <p className={styles.uploaderHelp}>
          {maxFileSizeMb !== undefined
            ? t('DOCUMENT_UPLOAD_HELP', { size: maxFileSizeMb })
            : t('DOCUMENT_UPLOAD_SUPPORTED_TYPES')}
        </p>
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept={FILE_INPUT_ACCEPT}
          className={styles.hiddenInput}
          data-testid="document-file-input"
          onChange={handleFileSelect}
        />
        <Button
          disabled={isSaving}
          onClick={() => fileInputRef.current?.click()}
        >
          {t('DOCUMENT_UPLOAD_BUTTON')}
        </Button>
      </div>
    </div>
  );
};

export default DocumentUpload;
