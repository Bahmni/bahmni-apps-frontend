import { BoxWHeader, Button, SelectedItem } from '@bahmni/design-system';
import {
  getDocumentTypesByConceptUuid,
  useTranslation,
} from '@bahmni/services';
import { useQuery } from '@tanstack/react-query';
import React, { useEffect } from 'react';
import type { InputControl as ClinicalInputControlConfig } from '../../../providers/clinicalConfig/models';
import { DocumentEntryCard } from './components';
import { useDocumentsStore } from './store';
import styles from './styles/DocumentsForm.module.scss';

interface DocumentsFormProps {
  inputControlConfig?: ClinicalInputControlConfig;
}

const DocumentsForm: React.FC<DocumentsFormProps> = ({
  inputControlConfig,
}) => {
  const { t } = useTranslation();
  const { entries, addEntry, removeEntry, setAttributes } = useDocumentsStore();
  const {
    metadata,
    attributes,
    label = 'DOCUMENTS_INPUT_CONTROL_LABEL',
  } = inputControlConfig ?? {};
  const documentTypeConceptSetUuid = metadata?.documentTypeConceptSetUuid as
    | string
    | undefined;
  const supportedFileTypes = metadata?.supportedFileTypes as
    | string[]
    | undefined;

  const { data: documentTypes = [], isError } = useQuery({
    queryKey: ['documentTypes', documentTypeConceptSetUuid],
    queryFn: () => getDocumentTypesByConceptUuid(documentTypeConceptSetUuid!),
    enabled: !!documentTypeConceptSetUuid,
    staleTime: Infinity,
  });

  useEffect(() => {
    setAttributes(attributes);
  }, [attributes, setAttributes]);

  // A document is always being filled in; "Add more" is for the next one.
  useEffect(() => {
    if (entries.length === 0) {
      addEntry();
    }
  }, [entries.length, addEntry]);

  return (
    <div
      id="documents-form"
      data-testid="documents-form"
      className={styles.form}
    >
      <div className={styles.title}>{t(label)}</div>
      {isError && (
        <div role="alert" className={styles.error}>
          {t('DOCUMENTS_ERROR_LOADING_DOCUMENT_TYPES')}
        </div>
      )}
      <BoxWHeader title={t('DOCUMENTS_ADDED_DOCUMENT_TYPE')}>
        {entries.map((entry) => (
          <SelectedItem
            key={entry.id}
            className={styles.selectedItem}
            onClose={() => removeEntry(entry.id)}
          >
            <DocumentEntryCard
              entry={entry}
              documentTypes={documentTypes}
              attributes={attributes}
              supportedFileTypes={supportedFileTypes}
            />
          </SelectedItem>
        ))}
      </BoxWHeader>
      <Button
        kind="tertiary"
        className={styles.addMore}
        testId="documents-add-more"
        onClick={addEntry}
      >
        {t('DOCUMENTS_ADD_MORE')}
      </Button>
    </div>
  );
};

export default DocumentsForm;
