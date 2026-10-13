import {
  Button,
  Dropdown,
  IconButton,
  Link,
  ThumbnailFileUploader,
} from '@bahmni/design-system';
import { DocumentType, getDocumentUploadMaxSizeMb } from '@bahmni/services';
import { Close } from '@carbon/icons-react';
import { InlineLoading, TextArea } from '@carbon/react';
import { useQuery } from '@tanstack/react-query';
import React, { useRef } from 'react';
import { useTranslation } from 'react-i18next';
import styles from './__styles__/DocumentUpload.module.scss';
import { MAX_NOTE_LENGTH } from './constants';
import { DocumentUploadProps, PendingDocument } from './models';
import { renderDocumentTile } from './renderDocumentTile';
import { useFileSelection } from './useFileSelection';
import {
  formatFileTypes,
  getDefaultDocumentType,
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
  fileOnly = false,
  supportedFileTypes,
  canSelectFiles,
}) => {
  const { t, i18n } = useTranslation();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Max size comes solely from the bahmni.documentUpload.maxFileSizeInMB setting; when it is not
  // set there is no client-side size limit (the backend remains the authority).
  const { data: maxFileSizeMb } = useQuery({
    queryKey: ['documentUploadMaxSizeMb'],
    queryFn: getDocumentUploadMaxSizeMb,
  });

  const { accept, selectFiles } = useFileSelection({
    supportedFileTypes,
    maxFileSizeMb,
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

  const uploadHelpText = () => {
    const types = supportedFileTypes?.length
      ? formatFileTypes(accept, i18n.language)
      : undefined;
    if (types && maxFileSizeMb !== undefined) {
      return t('DOCUMENT_UPLOAD_HELP_WITH_TYPES', {
        size: maxFileSizeMb,
        types,
      });
    }
    if (types) {
      return t('DOCUMENT_UPLOAD_SUPPORTED_TYPES_LIST', { types });
    }
    return maxFileSizeMb === undefined
      ? t('DOCUMENT_UPLOAD_SUPPORTED_TYPES')
      : t('DOCUMENT_UPLOAD_HELP', { size: maxFileSizeMb });
  };

  const fileStatusText = (document: PendingDocument) => {
    if (document.status === 'uploading') return t('DOCUMENT_UPLOAD_UPLOADING');
    if (document.status === 'error') {
      return document.error ?? t('DOCUMENT_UPLOAD_FAILED_TITLE');
    }
    return undefined;
  };

  const toPendingDocuments = (files: File[]): PendingDocument[] =>
    files.map((file) => ({
      id: `pending-${nextPendingId++}`,
      file,
      url: URL.createObjectURL(file),
      fileName: file.name,
      contentType: file.type,
      documentType: null,
      note: '',
      isNoteVisible: false,
    }));

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files ?? []);
    // Cleared so picking the same file again still raises a change event.
    event.target.value = '';
    if (files.length === 0) {
      return;
    }

    const accepted = toPendingDocuments(selectFiles(files));

    if (accepted.length > 0) {
      onDocumentsChange([...documents, ...accepted]);
    }
  };

  if (fileOnly) {
    return (
      <ThumbnailFileUploader
        id="document-upload"
        testId="document-upload"
        title={t('DOCUMENT_UPLOAD_TITLE')}
        description={uploadHelpText()}
        buttonLabel={t('DOCUMENT_UPLOAD_BUTTON')}
        listLabel={t('DOCUMENT_UPLOAD_FILES_LIST')}
        accept={accept}
        disabled={isSaving}
        canBrowse={canSelectFiles}
        onFilesSelected={(files) => {
          const accepted = toPendingDocuments(selectFiles(files));
          if (accepted.length > 0) {
            onDocumentsChange([...documents, ...accepted]);
          }
        }}
        onRemove={discardPending}
        getRemoveLabel={(name) => t('DOCUMENT_UPLOAD_REMOVE_FILE', { name })}
        items={documents.map((document) => ({
          id: document.id,
          name: document.fileName,
          status: document.status === 'uploaded' ? undefined : document.status,
          statusText: fileStatusText(document),
          thumbnail: renderDocumentTile({
            id: document.id,
            src: document.url,
            title: document.fileName,
            contentType: document.contentType,
            ariaLabel: t('DOCUMENT_UPLOAD_PREVIEW_FILE', {
              name: document.fileName,
            }),
          }),
        }))}
      />
    );
  }

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
          accept={accept.join(',')}
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
