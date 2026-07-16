import { Button, Dropdown, IconButton, Link } from '@bahmni/design-system';
import {
  AUDIT_LOG_EVENT_DETAILS,
  AuditEventType,
  dispatchAuditEvent,
  DocumentType,
  getDocumentUploadMaxSizeMb,
  saveDocument,
  uploadDocument,
} from '@bahmni/services';
import { Close } from '@carbon/icons-react';
import { InlineLoading, TextArea } from '@carbon/react';
import { useQuery } from '@tanstack/react-query';
import React, { useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useActivePractitioner } from '../activePractitioner';
import { useNotification } from '../notification';
import styles from './__styles__/DocumentUpload.module.scss';
import { FILE_INPUT_ACCEPT, MAX_NOTE_LENGTH } from './constants';
import { DocumentUploadProps, PendingDocument } from './models';
import { renderDocumentTile } from './renderDocumentTile';
import { isAcceptedFileType } from './utils';

export const DocumentUpload: React.FC<DocumentUploadProps> = ({
  patientUuid,
  encounterTypeName,
  saveTarget,
  documentTypes = [],
  onSaved,
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

  const [pending, setPending] = useState<PendingDocument | null>(null);
  const [selectedType, setSelectedType] = useState<DocumentType | null>(null);
  const [note, setNote] = useState('');
  const [showNote, setShowNote] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const selectedOrDefaultType = selectedType ?? documentTypes[0] ?? null;

  const resetPending = () => {
    setPending(null);
    setSelectedType(null);
    setNote('');
    setShowNote(false);
  };

  const handleFileSelect = async (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) {
      return;
    }
    if (!isAcceptedFileType(file.type)) {
      addNotification({
        title: t('DOCUMENT_UPLOAD_INVALID_TYPE_TITLE'),
        message: t('DOCUMENT_UPLOAD_INVALID_TYPE_MESSAGE'),
        type: 'error',
      });
      return;
    }
    if (
      maxFileSizeMb !== undefined &&
      file.size > maxFileSizeMb * 1000 * 1000
    ) {
      addNotification({
        title: t('DOCUMENT_UPLOAD_SIZE_EXCEEDED_TITLE'),
        message: t('DOCUMENT_UPLOAD_SIZE_EXCEEDED_MESSAGE', {
          size: maxFileSizeMb,
        }),
        type: 'error',
      });
      return;
    }

    setIsUploading(true);
    try {
      const { url } = await uploadDocument(
        file,
        encounterTypeName,
        patientUuid,
      );
      setPending({ url, fileName: file.name, contentType: file.type });
    } catch (error) {
      addNotification({
        title: t('DOCUMENT_UPLOAD_FAILED_TITLE'),
        message: error instanceof Error ? error.message : String(error),
        type: 'error',
      });
    } finally {
      setIsUploading(false);
    }
  };

  const handleSave = async () => {
    if (!pending) {
      return;
    }
    setIsSaving(true);
    try {
      await saveDocument({
        patientUuid,
        url: pending.url,
        contentType: pending.contentType,
        title: pending.fileName,
        typeCode: selectedOrDefaultType?.id,
        typeDisplay: selectedOrDefaultType?.label,
        description: note.trim() || undefined,
        authorPractitionerUuid: practitioner?.uuid,
        ...saveTarget,
      });
      dispatchAuditEvent({
        eventType: AUDIT_LOG_EVENT_DETAILS.UPLOAD_PATIENT_DOCUMENT
          .eventType as AuditEventType,
        patientUuid,
        messageParams: { encounterType: encounterTypeName },
        module: encounterTypeName,
      });
      addNotification({
        title: t('DOCUMENT_UPLOAD_SAVE_SUCCESS_TITLE'),
        message: t('DOCUMENT_UPLOAD_SAVE_SUCCESS_MESSAGE'),
        type: 'success',
      });
      resetPending();
      onSaved?.();
    } catch (error) {
      addNotification({
        title: t('DOCUMENT_UPLOAD_SAVE_FAILED_TITLE'),
        message: error instanceof Error ? error.message : String(error),
        type: 'error',
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className={styles.container}>
      {pending && (
        <div className={styles.pending} data-testid="pending-document-row">
          <div className={styles.pendingRow}>
            <div className={styles.fileCell}>
              {renderDocumentTile({
                id: pending.url,
                src: pending.url,
                title: pending.fileName,
                contentType: pending.contentType,
              })}
            </div>
            <div className={styles.typeCell}>
              <Dropdown
                id="document-type"
                testId="document-type-dropdown"
                titleText=""
                aria-label={t('DOCUMENT_UPLOAD_CHOOSE_TYPE')}
                label={t('DOCUMENT_UPLOAD_CHOOSE_TYPE')}
                items={documentTypes}
                selectedItem={selectedOrDefaultType}
                itemToString={(item: DocumentType | null) => item?.label ?? ''}
                onChange={({
                  selectedItem,
                }: {
                  selectedItem: DocumentType | null;
                }) => setSelectedType(selectedItem)}
              />
            </div>
            <div className={styles.actionsCell}>
              {isSaving ? (
                <InlineLoading description={t('DOCUMENT_UPLOAD_SAVING')} />
              ) : (
                <Button kind="tertiary" size="md" onClick={handleSave}>
                  {t('DOCUMENT_UPLOAD_SAVE')}
                </Button>
              )}
              <IconButton
                label={t('DOCUMENT_UPLOAD_DISCARD')}
                kind="ghost"
                size="md"
                onClick={resetPending}
              >
                <Close />
              </IconButton>
            </div>
          </div>
          <Link
            className={styles.addNoteLink}
            onClick={() => setShowNote((show) => !show)}
          >
            {t('DOCUMENT_UPLOAD_ADD_NOTE')}
          </Link>
          {showNote && (
            <TextArea
              id="document-note"
              data-testid="document-note"
              className={styles.noteArea}
              labelText=""
              aria-label={t('DOCUMENT_UPLOAD_ADD_NOTE')}
              rows={2}
              value={note}
              maxLength={MAX_NOTE_LENGTH}
              placeholder={t('DOCUMENT_UPLOAD_NOTE_PLACEHOLDER')}
              onChange={(e) => setNote(e.target.value)}
            />
          )}
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
          accept={FILE_INPUT_ACCEPT}
          className={styles.hiddenInput}
          data-testid="document-file-input"
          onChange={handleFileSelect}
        />
        {isUploading ? (
          <InlineLoading
            data-testid="document-uploading"
            description={t('DOCUMENT_UPLOAD_UPLOADING')}
          />
        ) : (
          <Button
            disabled={!!pending}
            onClick={() => fileInputRef.current?.click()}
          >
            {t('DOCUMENT_UPLOAD_BUTTON')}
          </Button>
        )}
      </div>
    </div>
  );
};

export default DocumentUpload;
