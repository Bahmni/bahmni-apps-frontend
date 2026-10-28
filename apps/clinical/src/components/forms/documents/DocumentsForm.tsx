import { useTranslation } from '@bahmni/services';
import { DocumentUpload } from '@bahmni/widgets';
import React, { useEffect } from 'react';
import type { InputControl as ClinicalInputControlConfig } from '../../../providers/clinicalConfig/models';
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
  const { attributes, label = 'DOCUMENTS_INPUT_CONTROL_LABEL' } =
    inputControlConfig ?? {};

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
      <DocumentUpload
        config={inputControlConfig ?? {}}
        documents={entries}
        onDocumentsChange={setEntries}
        documentsTitle={t('DOCUMENTS_ADDED_DOCUMENT_TYPE')}
      />
    </div>
  );
};

export default DocumentsForm;
