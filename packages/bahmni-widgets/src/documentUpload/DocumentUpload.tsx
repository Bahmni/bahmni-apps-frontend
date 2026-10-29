import {
  BoxWHeader,
  Button,
  Column,
  DocumentView,
  Dropdown,
  FileUploaderButton,
  FileUploaderItem,
  Grid,
  Link,
  SelectedItem,
  TextAreaWClose,
  TextInput,
} from '@bahmni/design-system';
import {
  DocumentType,
  getDocumentTypes,
  getDocumentTypesByConceptUuid,
  getDocumentUploadMaxSizeMb,
  useTranslation,
} from '@bahmni/services';
import { useQuery } from '@tanstack/react-query';
import React, { useEffect, useMemo, useRef, useState } from 'react';
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
  getDefaultDocumentType,
  revokeDocumentPreview,
} from './utils';

const DOCUMENT_TYPE_REQUIRED_ERROR = 'DOCUMENTS_SELECT_DOCUMENT_TYPE';

let nextPendingId = 0;

const withoutError = (
  errors: DocumentEntryErrors,
  field: keyof DocumentEntryErrors,
): DocumentEntryErrors => ({ ...errors, [field]: undefined });

const FieldLabel: React.FC<{ text: string; isRequired: boolean }> = ({
  text,
  isRequired,
}) => (
  <>
    {text}
    {isRequired && (
      <span className={styles.requiredAsterisk} aria-hidden="true">
        *
      </span>
    )}
  </>
);

const FileThumbnail: React.FC<{ file: PendingDocument }> = ({ file }) =>
  file.contentType.startsWith('image/') ? (
    <img src={file.url} alt="" />
  ) : (
    <DocumentView size={24} aria-hidden="true" />
  );

const toPendingDocuments = (files: File[]): PendingDocument[] =>
  files.map((file) => ({
    id: `pending-${nextPendingId++}`,
    file,
    url: URL.createObjectURL(file),
    fileName: file.name,
    contentType: file.type,
  }));

interface DocumentEntryCardProps extends Pick<DocumentUploadProps, 'isSaving'> {
  documentTypes: DocumentType[];
  isDocumentTypeRequired: boolean;
  showDocumentId: boolean;
  isDocumentIdRequired: boolean;
  entry: DocumentEntry;
  accept: string[];
  uploadHelpText: string;
  selectFiles: (files: File[]) => File[];
  onChange: (patch: Partial<DocumentEntry>) => void;
}

const DocumentEntryCard: React.FC<DocumentEntryCardProps> = ({
  entry,
  documentTypes,
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
  const documentType = entry.documentType;
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
          titleText={
            <FieldLabel
              text={t('DOCUMENTS_DOCUMENT_TYPE_LABEL')}
              isRequired={isDocumentTypeRequired}
            />
          }
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
            labelText={
              <FieldLabel
                text={t('DOCUMENTS_DOCUMENT_ID_LABEL')}
                isRequired={isDocumentIdRequired}
              />
            }
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
          {uploadHelpText && (
            <p className={styles.uploaderHelp}>{uploadHelpText}</p>
          )}
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
              thumbnail={<FileThumbnail file={file} />}
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

export const DocumentUpload: React.FC<DocumentUploadProps> = ({
  documents,
  onDocumentsChange,
  config,
  documentsTitle,
  isSaving = false,
  defaultOption,
}) => {
  const { t, i18n } = useTranslation();

  const { data: maxFileSizeMb } = useQuery({
    queryKey: ['documentUploadMaxSizeMb'],
    queryFn: getDocumentUploadMaxSizeMb,
  });

  const attributes = config?.attributes;
  const attribute = (name: string) => attributes?.find((a) => a.name === name);
  const isDocumentTypeRequired =
    attribute('documentType')?.required ?? !!config;
  const showDocumentId = !!attribute('documentId');
  const isDocumentIdRequired = attribute('documentId')?.required ?? false;
  const conceptUuid = config?.metadata?.documentTypeConceptSetUuid as
    | string
    | undefined;
  const conceptName = config?.metadata?.documentTypeConceptName as
    | string
    | undefined;
  const supportedFileTypes = config?.metadata?.supportedFileTypes as
    | string[]
    | undefined;

  const { data: loadedDocumentTypes, isError } = useQuery({
    queryKey: ['documentTypes', conceptUuid ?? conceptName],
    queryFn: () =>
      conceptUuid
        ? getDocumentTypesByConceptUuid(conceptUuid)
        : getDocumentTypes(conceptName!),
    enabled: !!(conceptUuid ?? conceptName),
  });
  const documentTypes = loadedDocumentTypes ?? [];
  const defaultDocumentType = useMemo(
    () =>
      defaultOption && loadedDocumentTypes
        ? getDefaultDocumentType(loadedDocumentTypes, defaultOption)
        : null,
    [loadedDocumentTypes, defaultOption],
  );
  const createDocumentEntry = (): DocumentEntry => ({
    ...createEmptyDocumentEntry(),
    documentType: defaultDocumentType,
  });

  const { accept, selectFiles } = useFileSelection({
    supportedFileTypes,
    maxFileSizeMb,
  });

  const onDocumentsChangeRef = useRef(onDocumentsChange);
  useEffect(() => {
    onDocumentsChangeRef.current = onDocumentsChange;
  });
  useEffect(() => {
    if (documents.length === 0) {
      onDocumentsChangeRef.current([createEmptyDocumentEntry()]);
    }
  }, [documents.length]);
  // Document types load after the first card is created, so preselect then.
  useEffect(() => {
    if (defaultDocumentType && documents.some((entry) => !entry.documentType)) {
      onDocumentsChangeRef.current(
        documents.map((entry) =>
          entry.documentType
            ? entry
            : { ...entry, documentType: defaultDocumentType },
        ),
      );
    }
  }, [defaultDocumentType, documents]);

  const uploadHelpText = [
    maxFileSizeMb !== undefined &&
      t('DOCUMENT_UPLOAD_MAX_SIZE', { size: maxFileSizeMb }),
    supportedFileTypes?.length &&
      t('DOCUMENT_UPLOAD_SUPPORTED_TYPES_LIST', {
        types: formatFileTypes(accept, i18n.language),
      }),
  ]
    .filter(Boolean)
    .join(' ');

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

  const errorKey = !config
    ? undefined
    : !conceptUuid && !conceptName
      ? 'DOCUMENTS_ERROR_INVALID_CONFIGURATION'
      : isError
        ? 'DOCUMENTS_ERROR_LOADING_DOCUMENT_TYPES'
        : undefined;
  if (errorKey) {
    return (
      <div role="alert" className={styles.error}>
        {t(errorKey)}
      </div>
    );
  }

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
        onClick={() => onDocumentsChange([...documents, createDocumentEntry()])}
      >
        {t('DOCUMENTS_ADD_MORE')}
      </Button>
    </div>
  );
};

export default DocumentUpload;
