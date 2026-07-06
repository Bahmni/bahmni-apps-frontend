import {
  Button,
  Dropdown,
  FileTile,
  IconButton,
  ImageTile,
  Link,
  VideoTile,
} from '@bahmni/design-system';
import {
  AUDIT_LOG_EVENT_DETAILS,
  AuditEventType,
  dispatchAuditEvent,
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
import { FILE_INPUT_ACCEPT, isAcceptedFileType, MAX_NOTE_LENGTH } from './constants';
import {
  DocumentTypeOption,
  DocumentUploadProps,
  PendingDocument,
} from './models';

const renderTile = (pending: PendingDocument) => {
  const type = pending.contentType.toLowerCase();
  if (type.includes('image')) {
    return (
      <ImageTile
        id={pending.url}
        imageSrc={pending.url}
        alt={pending.fileName}
      />
    );
  }
  if (type.includes('video')) {
    return (
      <VideoTile
        id={pending.url}
        videoSrc={pending.url}
        modalTitle={pending.fileName}
      />
    );
  }
  return (
    <FileTile
      id={pending.url}
      src={pending.url}
      modalTitle={pending.fileName}
    />
  );
};

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
  const [selectedType, setSelectedType] = useState<DocumentTypeOption | null>(
    null,
  );
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
        title: t('DOCUMENT_UPLOAD_INVALID_TYPE_TITLE', {
          defaultValue: 'Unsupported file type',
        }),
        message: t('DOCUMENT_UPLOAD_INVALID_TYPE_MESSAGE', {
          defaultValue: 'Supported file types are images, videos and PDF.',
        }),
        type: 'error',
      });
      return;
    }
    if (maxFileSizeMb !== undefined && file.size > maxFileSizeMb * 1000 * 1000) {
      addNotification({
        title: t('DOCUMENT_UPLOAD_SIZE_EXCEEDED_TITLE', {
          defaultValue: 'File too large',
        }),
        message: t('DOCUMENT_UPLOAD_SIZE_EXCEEDED_MESSAGE', {
          size: maxFileSizeMb,
          defaultValue:
            'File size exceeds the maximum allowed limit of {{size}}MB.',
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
        title: t('DOCUMENT_UPLOAD_FAILED_TITLE', {
          defaultValue: 'Upload failed',
        }),
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
        eventType: AUDIT_LOG_EVENT_DETAILS.EDIT_ENCOUNTER
          .eventType as AuditEventType,
        patientUuid,
        messageParams: { encounterType: encounterTypeName },
        module: encounterTypeName,
      });
      addNotification({
        title: t('DOCUMENT_UPLOAD_SAVE_SUCCESS_TITLE', {
          defaultValue: 'Document saved',
        }),
        message: t('DOCUMENT_UPLOAD_SAVE_SUCCESS_MESSAGE', {
          defaultValue: 'The document was saved successfully.',
        }),
        type: 'success',
      });
      resetPending();
      onSaved?.();
    } catch (error) {
      addNotification({
        title: t('DOCUMENT_UPLOAD_SAVE_FAILED_TITLE', {
          defaultValue: 'Save failed',
        }),
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
            <div className={styles.fileCell}>{renderTile(pending)}</div>
            <div className={styles.typeCell}>
              <Dropdown
                id="document-type"
                testId="document-type-dropdown"
                titleText=""
                label={t('DOCUMENT_UPLOAD_CHOOSE_TYPE', {
                  defaultValue: 'Choose an option',
                })}
                items={documentTypes}
                selectedItem={selectedOrDefaultType}
                itemToString={(item: DocumentTypeOption | null) =>
                  item?.label ?? ''
                }
                onChange={({
                  selectedItem,
                }: {
                  selectedItem: DocumentTypeOption | null;
                }) => setSelectedType(selectedItem)}
              />
            </div>
            <div className={styles.actionsCell}>
              {isSaving ? (
                <InlineLoading
                  description={t('DOCUMENT_UPLOAD_SAVING', {
                    defaultValue: 'Saving…',
                  })}
                />
              ) : (
                <Button kind="tertiary" size="md" onClick={handleSave}>
                  {t('DOCUMENT_UPLOAD_SAVE', { defaultValue: 'Save' })}
                </Button>
              )}
              <IconButton
                label={t('DOCUMENT_UPLOAD_DISCARD', {
                  defaultValue: 'Discard',
                })}
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
            {t('DOCUMENT_UPLOAD_ADD_NOTE', { defaultValue: 'Add note' })}
          </Link>
          {showNote && (
            <TextArea
              id="document-note"
              data-testid="document-note"
              className={styles.noteArea}
              labelText=""
              rows={2}
              value={note}
              maxLength={MAX_NOTE_LENGTH}
              placeholder={t('DOCUMENT_UPLOAD_NOTE_PLACEHOLDER', {
                defaultValue: 'Add note',
              })}
              onChange={(e) => setNote(e.target.value)}
            />
          )}
        </div>
      )}

      <div className={styles.uploader}>
        <p className={styles.uploaderTitle}>
          {t('DOCUMENT_UPLOAD_TITLE', { defaultValue: 'Upload files' })}
        </p>
        <p className={styles.uploaderHelp}>
          {maxFileSizeMb !== undefined
            ? t('DOCUMENT_UPLOAD_HELP', {
                size: maxFileSizeMb,
                defaultValue:
                  'Max file size is {{size}}MB. Supported file types are images, videos and PDF.',
              })
            : t('DOCUMENT_UPLOAD_INVALID_TYPE_MESSAGE', {
                defaultValue:
                  'Supported file types are images, videos and PDF.',
              })}
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
            description={t('DOCUMENT_UPLOAD_UPLOADING', {
              defaultValue: 'Uploading…',
            })}
          />
        ) : (
          <Button onClick={() => fileInputRef.current?.click()}>
            {t('DOCUMENT_UPLOAD_BUTTON', { defaultValue: 'Upload' })}
          </Button>
        )}
      </div>
    </div>
  );
};

export default DocumentUpload;
