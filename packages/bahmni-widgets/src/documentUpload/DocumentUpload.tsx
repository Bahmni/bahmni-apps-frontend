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
import React, {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from 'react';
import { useTranslation } from 'react-i18next';
import { useActivePractitioner } from '../activePractitioner';
import { useNotification } from '../notification';
import styles from './__styles__/DocumentUpload.module.scss';
import { FILE_INPUT_ACCEPT, MAX_NOTE_LENGTH } from './constants';
import {
  DocumentSaveFailure,
  DocumentSaveSummary,
  DocumentUploadHandle,
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

// forwardRef rather than React 19's ref-as-prop: this package's peer range allows React 18, where a
// `ref` prop never reaches a function component and the handle would silently stay empty.
export const DocumentUpload = forwardRef<
  DocumentUploadHandle,
  DocumentUploadProps
>(function DocumentUpload(
  {
    patientUuid,
    encounterTypeName,
    saveTarget,
    documentTypes = [],
    defaultOption,
    onSaved,
    onPendingChange,
  },
  ref,
) {
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

  // Every mutation goes through a functional update, so a change that lands while a save is in
  // flight is never clobbered by a list captured before the await.
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
    setPendingDocuments((current) => {
      current
        .filter((pending) => pending.id === id)
        .forEach((pending) => revokePreview(pending));
      return current.filter((pending) => pending.id !== id);
    });
  };

  // Reported from an effect keyed on the flag itself: the consumer hears about a transition once,
  // and never re-renders us into a loop however it declares its callback.
  const hasPendingDocuments = pendingDocuments.length > 0;
  const onPendingChangeRef = useRef(onPendingChange);
  useEffect(() => {
    onPendingChangeRef.current = onPendingChange;
  });
  useEffect(() => {
    onPendingChangeRef.current?.(hasPendingDocuments);
  }, [hasPendingDocuments]);

  // Previews left over when the widget goes away (a visit dropping out of the list, say) would
  // otherwise hold their blobs until the page is closed.
  const pendingDocumentsRef = useRef(pendingDocuments);
  useEffect(() => {
    pendingDocumentsRef.current = pendingDocuments;
  });
  useEffect(
    () => () => pendingDocumentsRef.current.forEach(revokePreview),

    [],
  );

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
      setPendingDocuments((current) => [...current, ...accepted]);
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
          // A retry after a failed save reuses the bytes already stored, rather than uploading the
          // file again and orphaning the first copy.
          document.uploadedUrl
            ? Promise.resolve({ url: document.uploadedUrl })
            : uploadDocument(document.file, encounterTypeName, patientUuid),
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
      const uploadedUrlById = new Map(
        uploaded.map(({ document, url }) => [document.id, url]),
      );
      setPendingDocuments((current) =>
        current.map((document) => {
          const url = uploadedUrlById.get(document.id);
          return url ? { ...document, uploadedUrl: url } : document;
        }),
      );

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
        // Dropped from the live list rather than from the snapshot taken before the await, so
        // anything the user changed meanwhile survives. Whatever failed stays listed, preview
        // intact, ready for a retry.
        setPendingDocuments((current) => {
          current
            .filter((document) => savedIds.has(document.id))
            .forEach(revokePreview);
          return current.filter((document) => !savedIds.has(document.id));
        });
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
          {pendingDocuments.map((document) => (
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
                    // Keyed on the row's own id, not its position, so discarding one row does not
                    // renumber the ids of the rows React keeps.
                    id={`document-type-${document.id}`}
                    testId="document-type-dropdown"
                    titleText=""
                    aria-label={t('DOCUMENT_UPLOAD_CHOOSE_TYPE')}
                    label={t('DOCUMENT_UPLOAD_CHOOSE_TYPE')}
                    items={documentTypes}
                    // Locked while saving: the payload is built when the save starts, so a change
                    // made after that would be accepted on screen and never reach the server.
                    disabled={isSaving}
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
                  id={`document-note-${document.id}`}
                  data-testid="document-note"
                  className={styles.noteArea}
                  labelText=""
                  aria-label={t('DOCUMENT_UPLOAD_ADD_NOTE')}
                  rows={2}
                  disabled={isSaving}
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
});

export default DocumentUpload;
