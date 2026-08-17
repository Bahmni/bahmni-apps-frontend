import { Button, Dropdown, IconButton, Link } from '@bahmni/design-system';
import { DocumentType } from '@bahmni/services';
import { Close } from '@carbon/icons-react';
import { TextArea } from '@carbon/react';
import React, { useRef } from 'react';
import { useTranslation } from 'react-i18next';
import styles from './__styles__/DocumentUpload.module.scss';
import { FILE_INPUT_ACCEPT, MAX_NOTE_LENGTH } from './constants';
import { DocumentUploadProps } from './models';
import { renderDocumentTile } from './renderDocumentTile';
import { usePendingDocuments } from './usePendingDocuments';

/**
 * File picker and queued-file list for one visit. The files themselves live in the
 * PendingDocumentsProvider and are committed by its Save action, which covers every visit at once.
 */
export const DocumentUpload: React.FC<DocumentUploadProps> = ({
  sourceId,
  saveTarget,
}) => {
  const { t } = useTranslation();
  const {
    documentTypes,
    maxFileSizeMb,
    isSaving,
    pendingFor,
    addFiles,
    updateRow,
    discardRow,
    effectiveType,
  } = usePendingDocuments();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const rows = pendingFor(sourceId);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files ?? []);
    // Clear the input straight away so picking the same file again still fires a change event; the
    // queued rows keep their own File reference and no longer depend on the input's FileList.
    event.target.value = '';
    if (files.length > 0) {
      addFiles(sourceId, saveTarget, files);
    }
  };

  return (
    <div className={styles.container}>
      {rows.length > 0 && (
        <div className={styles.pending}>
          {rows.map((row, index) => (
            <div
              key={row.id}
              className={styles.pendingItem}
              data-testid="pending-document-row"
            >
              <div className={styles.pendingRow}>
                <div className={styles.fileCell}>
                  {renderDocumentTile({
                    id: row.id,
                    src: row.url,
                    title: row.fileName,
                    contentType: row.contentType,
                  })}
                  {/* Named, so a queue of thumbnails is still tellable apart. */}
                  <span className={styles.fileName} title={row.fileName}>
                    {row.fileName}
                  </span>
                </div>
                <div className={styles.typeCell}>
                  <Dropdown
                    id={`document-type-${row.id}`}
                    testId={`document-type-dropdown-${index}`}
                    titleText=""
                    aria-label={t('DOCUMENT_UPLOAD_CHOOSE_TYPE')}
                    label={t('DOCUMENT_UPLOAD_CHOOSE_TYPE')}
                    items={documentTypes}
                    selectedItem={effectiveType(row)}
                    itemToString={(item: DocumentType | null) =>
                      item?.label ?? ''
                    }
                    onChange={({
                      selectedItem,
                    }: {
                      selectedItem: DocumentType | null;
                    }) => updateRow(row.id, { selectedType: selectedItem })}
                  />
                </div>
                <div className={styles.actionsCell}>
                  <IconButton
                    label={t('DOCUMENT_UPLOAD_DISCARD')}
                    kind="ghost"
                    size="md"
                    disabled={isSaving}
                    onClick={() => discardRow(row.id)}
                  >
                    <Close />
                  </IconButton>
                </div>
              </div>
              <Link
                className={styles.addNoteLink}
                onClick={() => updateRow(row.id, { showNote: !row.showNote })}
              >
                {t('DOCUMENT_UPLOAD_ADD_NOTE')}
              </Link>
              {row.showNote && (
                <TextArea
                  id={`document-note-${row.id}`}
                  data-testid={`document-note-${index}`}
                  className={styles.noteArea}
                  labelText=""
                  aria-label={t('DOCUMENT_UPLOAD_ADD_NOTE')}
                  rows={2}
                  value={row.note}
                  maxLength={MAX_NOTE_LENGTH}
                  placeholder={t('DOCUMENT_UPLOAD_NOTE_PLACEHOLDER')}
                  onChange={(e) => updateRow(row.id, { note: e.target.value })}
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
