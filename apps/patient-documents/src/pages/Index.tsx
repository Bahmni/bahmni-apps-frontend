import React from 'react';
import { useTranslation } from 'react-i18next';
import { BAHMNI_PATIENT_DOCUMENTS_NAMESPACE } from '../constants/app';

export const IndexPage: React.FC = () => {
  const { t } = useTranslation(BAHMNI_PATIENT_DOCUMENTS_NAMESPACE);

  return (
    <div>
      <h1>{t('PATIENT_DOCUMENTS_WELCOME_MESSAGE')}</h1>
      <p>PatientDocuments application for Bahmni</p>
    </div>
  );
};
