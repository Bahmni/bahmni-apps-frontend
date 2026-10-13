import {
  Column,
  Dropdown,
  Grid,
  Link,
  TextAreaWClose,
  TextInput,
} from '@bahmni/design-system';
import { useTranslation, type DocumentType } from '@bahmni/services';
import { DocumentUpload, MAX_NOTE_LENGTH } from '@bahmni/widgets';
import React, { useState } from 'react';
import type { InputControlAttributes } from '../../../../providers/clinicalConfig/models';
import { DOCUMENT_ID_ATTRIBUTE, DOCUMENT_TYPE_ATTRIBUTE } from '../constants';
import type { DocumentEntry } from '../models';
import { useDocumentsStore } from '../store';
import styles from '../styles/DocumentsForm.module.scss';

interface DocumentEntryCardProps {
  entry: DocumentEntry;
  documentTypes: DocumentType[];
  attributes: InputControlAttributes[] | undefined;
  supportedFileTypes?: string[];
}

const DocumentEntryCard: React.FC<DocumentEntryCardProps> = ({
  entry,
  documentTypes,
  attributes,
  supportedFileTypes,
}) => {
  const { t } = useTranslation();
  const {
    updateDocumentType,
    updateDocumentId,
    updateNote,
    setFiles,
    showDocumentTypeRequired,
  } = useDocumentsStore();
  const [isNoteVisible, setIsNoteVisible] = useState(!!entry.note);
  const { id, errors } = entry;

  const isRequired = (name: string, requiredByDefault = false) =>
    attributes?.find((attribute) => attribute.name === name)?.required ??
    requiredByDefault;
  const isDocumentTypeRequired = isRequired(DOCUMENT_TYPE_ATTRIBUTE, true);

  // Files are tied to a document type, so choosing one comes before choosing files.
  const canSelectFiles = () => {
    if (isDocumentTypeRequired && !entry.documentType) {
      showDocumentTypeRequired(id);
      return false;
    }
    return true;
  };

  const closeNote = () => {
    setIsNoteVisible(false);
    updateNote(id, '');
  };

  return (
    <Grid data-testid={`document-entry-${id}`}>
      <Column sm={4} md={4} lg={8} className={styles.column}>
        <Dropdown
          id={`document-type-${id}`}
          testId={`document-type-${id}`}
          titleText={`${t('DOCUMENTS_DOCUMENT_TYPE_LABEL')}${isDocumentTypeRequired ? '*' : ''}`}
          label={t('DOCUMENTS_DOCUMENT_TYPE_PLACEHOLDER')}
          items={documentTypes}
          itemToString={(item: DocumentType | null) => item?.label ?? ''}
          selectedItem={entry.documentType}
          onChange={({ selectedItem }: { selectedItem: DocumentType | null }) =>
            updateDocumentType(id, selectedItem)
          }
          autoAlign
          invalid={!!errors.documentType}
          invalidText={errors.documentType ? t(errors.documentType) : ''}
        />
      </Column>
      <Column sm={4} md={4} lg={8} className={styles.column}>
        <TextInput
          id={`document-id-${id}`}
          testId={`document-id-${id}`}
          labelText={t('DOCUMENTS_DOCUMENT_ID_LABEL')}
          value={entry.documentId}
          required={isRequired(DOCUMENT_ID_ATTRIBUTE)}
          onChange={(event) => updateDocumentId(id, event.target.value)}
          invalid={!!errors.documentId}
          invalidText={errors.documentId ? t(errors.documentId) : ''}
        />
      </Column>
      <Column sm={4} md={8} lg={16} className={styles.column}>
        <DocumentUpload
          fileOnly
          documents={entry.files}
          onDocumentsChange={(files) => setFiles(id, files)}
          supportedFileTypes={supportedFileTypes}
          canSelectFiles={canSelectFiles}
        />
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
            onChange={(event) => updateNote(id, event.target.value)}
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
              setIsNoteVisible(true);
            }}
          >
            {t('DOCUMENTS_ADD_NOTE')}
          </Link>
        )}
      </Column>
    </Grid>
  );
};

export default DocumentEntryCard;
