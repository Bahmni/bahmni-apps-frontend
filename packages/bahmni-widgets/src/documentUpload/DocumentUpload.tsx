import {
  BoxWHeader,
  Button,
  Column,
  Dropdown,
  FileUploaderButton,
  FileUploaderItem,
  Grid,
  Link,
  SelectedItem,
  TextAreaWClose,
  TextInput,
} from '@bahmni/design-system';
import { DocumentType, getDocumentUploadMaxSizeMb } from '@bahmni/services';
import { useQuery } from '@tanstack/react-query';
import React, { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import styles from './__styles__/DocumentUpload.module.scss';
import { MAX_NOTE_LENGTH } from './constants';
import {
  DocumentEntry,
  DocumentEntryErrors,
  DocumentUploadProps,
  PendingDocument,
} from './models';
import { useFileSelection } from './useFileSelection';
import {
  createEmptyDocumentEntry,
  formatFileTypes,
  revokeDocumentPreview,
} from './utils';

const DOCUMENT_TYPE_REQUIRED_ERROR = 'DOCUMENTS_SELECT_DOCUMENT_TYPE';

// Module-wide rather than per instance: the consumer keeps the documents across a remount of the
// widget, so a per-instance counter restarting at zero could reissue an id that is still pending.
let nextPendingId = 0;

const withoutError = (
  errors: DocumentEntryErrors,
  field: keyof DocumentEntryErrors,
): DocumentEntryErrors => ({ ...errors, [field]: undefined });

const toPendingDocuments = (files: File[]): PendingDocument[] =>
  files.map((file) => ({
    id: `pending-${nextPendingId++}`,
    file,
    url: URL.createObjectURL(file),
    fileName: file.name,
    contentType: file.type,
  }));

interface DocumentEntryCardProps
  extends Pick<
    DocumentUploadProps,
    | 'documentTypes'
    | 'defaultDocumentType'
    | 'isDocumentTypeRequired'
    | 'showDocumentId'
    | 'isDocumentIdRequired'
    | 'isSaving'
  > {
  entry: DocumentEntry;
  accept: string[];
  uploadHelpText: string;
  selectFiles: (files: File[]) => File[];
  onChange: (patch: Partial<DocumentEntry>) => void;
}

// One document: its type, optional identifier, files and note.
const DocumentEntryCard: React.FC<DocumentEntryCardProps> = ({
  entry,
  documentTypes = [],
  defaultDocumentType = null,
  isDocumentTypeRequired = false,
  showDocumentId = false,
  isDocumentIdRequired = false,
  isSaving = false,
  accept,
  uploadHelpText,
  selectFiles,
  onChange,
}) => {
  const { t } = useTranslation();
  const [isNoteOpened, setIsNoteOpened] = useState(false);
  const { id, errors } = entry;
  const documentType = entry.documentType ?? defaultDocumentType;
  const isNoteVisible = isNoteOpened || entry.note !== '';

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files ?? []);
    // Cleared so picking the same file again still raises a change event.
    event.target.value = '';
    const accepted = toPendingDocuments(selectFiles(files));
    if (accepted.length > 0) {
      onChange({
        files: [...entry.files, ...accepted],
        errors: withoutError(errors, 'files'),
      });
    }
  };

  const discardFile = (fileId: string) => {
    entry.files
      .filter((file) => file.id === fileId)
      .forEach((file) => revokeDocumentPreview(file));
    onChange({ files: entry.files.filter((file) => file.id !== fileId) });
  };

  // The file dialog opens from a click on the hidden input, whether from the button or the
  // keyboard, so that is the one place to hold it back until the document has a type.
  const handleClickCapture = (event: React.MouseEvent) => {
    const target = event.target as HTMLElement;
    if (
      target instanceof HTMLInputElement &&
      target.type === 'file' &&
      isDocumentTypeRequired &&
      !documentType
    ) {
      event.preventDefault();
      onChange({
        errors: { ...errors, documentType: DOCUMENT_TYPE_REQUIRED_ERROR },
      });
    }
  };

  const closeNote = () => {
    setIsNoteOpened(false);
    onChange({ note: '' });
  };

  return (
    <Grid data-testid={`document-entry-${id}`}>
      <Column
        sm={4}
        md={4}
        lg={showDocumentId ? 8 : 16}
        className={`${styles.column} ${showDocumentId ? '' : styles.typeOnly}`}
      >
        <Dropdown
          id={`document-type-${id}`}
          testId={`document-type-${id}`}
          titleText={`${t('DOCUMENTS_DOCUMENT_TYPE_LABEL')}${isDocumentTypeRequired ? '*' : ''}`}
          label={t('DOCUMENTS_DOCUMENT_TYPE_PLACEHOLDER')}
          items={documentTypes}
          disabled={isSaving}
          itemToString={(item: DocumentType | null) => item?.label ?? ''}
          selectedItem={documentType}
          onChange={({ selectedItem }: { selectedItem: DocumentType | null }) =>
            onChange({
              documentType: selectedItem,
              errors: withoutError(errors, 'documentType'),
            })
          }
          autoAlign
          invalid={!!errors.documentType}
          invalidText={errors.documentType ? t(errors.documentType) : ''}
        />
      </Column>
      {showDocumentId && (
        <Column sm={4} md={4} lg={8} className={styles.column}>
          <TextInput
            id={`document-id-${id}`}
            testId={`document-id-${id}`}
            labelText={t('DOCUMENTS_DOCUMENT_ID_LABEL')}
            value={entry.documentId}
            required={isDocumentIdRequired}
            disabled={isSaving}
            onChange={(event) =>
              onChange({
                documentId: event.target.value,
                errors: withoutError(errors, 'documentId'),
              })
            }
            invalid={!!errors.documentId}
            invalidText={errors.documentId ? t(errors.documentId) : ''}
          />
        </Column>
      )}
      <Column sm={4} md={8} lg={16} className={styles.column}>
        <div className={styles.uploader} onClickCapture={handleClickCapture}>
          <p className={styles.uploaderTitle}>{t('DOCUMENT_UPLOAD_TITLE')}</p>
          <p className={styles.uploaderHelp}>{uploadHelpText}</p>
          <FileUploaderButton
            labelText={t('DOCUMENT_UPLOAD_BUTTON')}
            buttonKind="primary"
            accept={accept}
            multiple
            disabled={isSaving}
            disableLabelChanges
            onChange={handleFileSelect}
          />
          {entry.files.map((file) => (
            <FileUploaderItem
              key={file.id}
              uuid={file.id}
              name={file.fileName}
              status={file.status === 'uploading' ? 'uploading' : 'edit'}
              iconDescription={t('DOCUMENT_UPLOAD_REMOVE_FILE')}
              invalid={file.status === 'error'}
              errorSubject={t('DOCUMENT_UPLOAD_FAILED_TITLE')}
              errorBody={file.error}
              onDelete={() => discardFile(file.id)}
            />
          ))}
        </div>
        {errors.files && (
          <p role="alert" className={styles.fileError}>
            {t(errors.files)}
          </p>
        )}
      </Column>
      <Column sm={4} md={8} lg={16} className={styles.column}>
        {isNoteVisible ? (
          <TextAreaWClose
            id={`document-note-${id}`}
            data-testid={`document-note-${id}`}
            labelText={t('NOTE_LABEL')}
            placeholder={t('DOCUMENTS_NOTE_PLACEHOLDER')}
            value={entry.note}
            onChange={(event) => onChange({ note: event.target.value })}
            onClose={closeNote}
            enableCounter
            maxCount={MAX_NOTE_LENGTH}
            className={styles.textArea}
          />
        ) : (
          <Link
            href="#"
            data-testid={`document-add-note-${id}`}
            onClick={(event) => {
              event.preventDefault();
              setIsNoteOpened(true);
            }}
          >
            {t('DOCUMENTS_ADD_NOTE')}
          </Link>
        )}
      </Column>
    </Grid>
  );
};

/**
 * The documents being added: one card per document (type, optional identifier, files, note), and
 * an "Add more" button for the next one. Picks, validates, previews and removes the files of each
 * document but never uploads them; whoever saves owns the files and decides when to upload.
 */
export const DocumentUpload: React.FC<DocumentUploadProps> = ({
  documents,
  onDocumentsChange,
  documentTypes = [],
  defaultDocumentType = null,
  isDocumentTypeRequired = false,
  showDocumentId = false,
  isDocumentIdRequired = false,
  supportedFileTypes,
  documentsTitle,
  isSaving = false,
}) => {
  const { t, i18n } = useTranslation();

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

  // A document is always being filled in; "Add more" is for the next one. Replacing the list rather
  // than appending to it keeps this to a single empty document when React runs the effect twice on
  // mount (StrictMode).
  const onDocumentsChangeRef = useRef(onDocumentsChange);
  useEffect(() => {
    onDocumentsChangeRef.current = onDocumentsChange;
  });
  useEffect(() => {
    if (documents.length === 0) {
      onDocumentsChangeRef.current([createEmptyDocumentEntry()]);
    }
  }, [documents.length]);

  const uploadHelpText = (() => {
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
  })();

  const updateEntry = (id: string, patch: Partial<DocumentEntry>) =>
    onDocumentsChange(
      documents.map((entry) =>
        entry.id === id ? { ...entry, ...patch } : entry,
      ),
    );

  const removeEntry = (entry: DocumentEntry) => {
    entry.files.forEach((file) => revokeDocumentPreview(file));
    onDocumentsChange(documents.filter(({ id }) => id !== entry.id));
  };

  const cards = documents.map((entry) => {
    const card = (
      <DocumentEntryCard
        entry={entry}
        documentTypes={documentTypes}
        defaultDocumentType={defaultDocumentType}
        isDocumentTypeRequired={isDocumentTypeRequired}
        showDocumentId={showDocumentId}
        isDocumentIdRequired={isDocumentIdRequired}
        isSaving={isSaving}
        accept={accept}
        uploadHelpText={uploadHelpText}
        selectFiles={selectFiles}
        onChange={(patch) => updateEntry(entry.id, patch)}
      />
    );
    return documents.length > 1 ? (
      <SelectedItem
        key={entry.id}
        className={styles.selectedItem}
        onClose={() => removeEntry(entry)}
      >
        {card}
      </SelectedItem>
    ) : (
      <div key={entry.id} className={styles.singleEntry}>
        {card}
      </div>
    );
  });

  return (
    <div className={styles.container}>
      {documentsTitle ? (
        <BoxWHeader title={documentsTitle}>{cards}</BoxWHeader>
      ) : (
        cards
      )}
      <Button
        kind="tertiary"
        className={styles.addMore}
        disabled={isSaving}
        testId="document-upload-add-more"
        onClick={() =>
          onDocumentsChange([...documents, createEmptyDocumentEntry()])
        }
      >
        {t('DOCUMENTS_ADD_MORE')}
      </Button>
    </div>
  );
};

export default DocumentUpload;
