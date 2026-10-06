import { Button, Dropdown, IconButton, Link } from '@bahmni/design-system';
import { DocumentType, getDocumentUploadMaxSizeMb } from '@bahmni/services';
import { Close } from '@carbon/icons-react';
import { InlineLoading, TextArea } from '@carbon/react';
import { useQuery } from '@tanstack/react-query';
import React, { useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { useNotification } from '../notification';
import styles from './__styles__/DocumentUpload.module.scss';
import { FILE_INPUT_ACCEPT, MAX_NOTE_LENGTH } from './constants';
import { DocumentUploadProps, PendingDocument } from './models';
import { renderDocumentTile } from './renderDocumentTile';
import {
  getDefaultDocumentType,
  isAcceptedFileType,
  revokeDocumentPreview,
} from './utils';

// Module-wide rather than per instance: the consumer keeps the documents across a remount of the
// widget, so a per-instance counter restarting at zero could reissue an id that is still pending.
let nextPendingId = 0;

export const DocumentUpload: React.FC<DocumentUploadProps> = ({
  documents,
  onDocumentsChange,
  documentTypes = [],
  defaultOption,
  isSaving = false,
}) => {
  const { t } = useTranslation();
  const { addNotification } = useNotification();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Max size comes solely from the bahmni.documentUpload.maxFileSizeInMB setting; when it is not
  // set there is no client-side size limit (the backend remains the authority).
  const { data: maxFileSizeMb } = useQuery({
    queryKey: ['documentUploadMaxSizeMb'],
    queryFn: getDocumentUploadMaxSizeMb,
  });

  const defaultDocumentType = getDefaultDocumentType(
    documentTypes,
    defaultOption,
  );

  // Resolved on use, so a file chosen before the type list arrived still gets the default.
  const typeOf = (document: PendingDocument): DocumentType | null =>
    document.documentType ?? defaultDocumentType;

  const updatePending = (id: string, patch: Partial<PendingDocument>) =>
    onDocumentsChange(
      documents.map((document) =>
        document.id === id ? { ...document, ...patch } : document,
      ),
    );

  const discardPending = (id: string) => {
    documents
      .filter((pending) => pending.id === id)
      .forEach((pending) => revokeDocumentPreview(pending));
    onDocumentsChange(documents.filter((pending) => pending.id !== id));
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
        id: `pending-${nextPendingId++}`,
        file,
        url: URL.createObjectURL(file),
        fileName: file.name,
        contentType: file.type,
        documentType: null,
        note: '',
        isNoteVisible: false,
      });
    });

    if (unsupported.length > 0) {
      addNotification({
        title: t('DOCUMENT_UPLOAD_INVALID_TYPE_TITLE'),
        message: t('DOCUMENT_UPLOAD_INVALID_TYPE_MESSAGE'),
        type: 'error',
        timeout: 5000,
      });
    }
    if (tooLarge.length > 0) {
      addNotification({
        title: t('DOCUMENT_UPLOAD_SIZE_EXCEEDED_TITLE'),
        message: t('DOCUMENT_UPLOAD_SIZE_EXCEEDED_MESSAGE', {
          size: maxFileSizeMb,
        }),
        type: 'error',
        timeout: 5000,
      });
    }

    if (accepted.length > 0) {
      onDocumentsChange([...documents, ...accepted]);
    }
  };

  return (
    <div className={styles.container}>
      {documents.length > 0 && (
        <div className={styles.pending}>
          {documents.map((document) => (
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
                    id={`document-type-${document.id}`}
                    testId="document-type-dropdown"
                    titleText=""
                    aria-label={t('DOCUMENT_UPLOAD_CHOOSE_TYPE')}
                    label={t('DOCUMENT_UPLOAD_CHOOSE_TYPE')}
                    items={documentTypes}
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
};

export default DocumentUpload;
