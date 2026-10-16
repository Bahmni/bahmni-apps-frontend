import {
  getDocumentTypesByConceptUuid,
  useTranslation,
} from '@bahmni/services';
import { DocumentUpload } from '@bahmni/widgets';
import { useQuery } from '@tanstack/react-query';
import React, { useEffect } from 'react';
import type { InputControl as ClinicalInputControlConfig } from '../../../providers/clinicalConfig/models';
import { DOCUMENT_ID_ATTRIBUTE, DOCUMENT_TYPE_ATTRIBUTE } from './constants';
import { useDocumentsStore } from './store';
import styles from './styles/DocumentsForm.module.scss';

interface DocumentsFormProps {
  inputControlConfig?: ClinicalInputControlConfig;
}

const DocumentsForm: React.FC<DocumentsFormProps> = ({
  inputControlConfig,
}) => {
  const { t } = useTranslation();
  const { entries, setEntries, setAttributes } = useDocumentsStore();
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
  const isRequired = (name: string, requiredByDefault = false) =>
    attributes?.find((attribute) => attribute.name === name)?.required ??
    requiredByDefault;

  const { data: documentTypes = [], isError } = useQuery({
    queryKey: ['documentTypes', documentTypeConceptSetUuid],
    queryFn: () => getDocumentTypesByConceptUuid(documentTypeConceptSetUuid!),
    enabled: !!documentTypeConceptSetUuid,
    staleTime: Infinity,
  });

  useEffect(() => {
    setAttributes(attributes);
  }, [attributes, setAttributes]);

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
      <DocumentUpload
        documents={entries}
        onDocumentsChange={setEntries}
        documentTypes={documentTypes}
        isDocumentTypeRequired={isRequired(DOCUMENT_TYPE_ATTRIBUTE, true)}
        showDocumentId
        isDocumentIdRequired={isRequired(DOCUMENT_ID_ATTRIBUTE)}
        supportedFileTypes={supportedFileTypes}
        documentsTitle={t('DOCUMENTS_ADDED_DOCUMENT_TYPE')}
      />
    </div>
  );
};

export default DocumentsForm;
