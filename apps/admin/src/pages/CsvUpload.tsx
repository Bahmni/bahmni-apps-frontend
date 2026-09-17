import { useTranslation } from '@bahmni/services';
import React from 'react';
import { AdminLayout } from '../components/AdminLayout';
import styles from './styles/CsvUpload.module.scss';

export const CsvUpload: React.FC = () => {
  const { t } = useTranslation();

  return (
    <AdminLayout>
      <div
        id="admin-csv-upload-page"
        data-testid="admin-csv-upload-page-test-id"
        aria-label="admin-csv-upload-page-aria-label"
        className={styles.page}
      >
        <h1>{t('ADMIN_CSV_UPLOAD_TITLE')}</h1>
        <p>{t('ADMIN_CSV_UPLOAD_DESCRIPTION')}</p>
      </div>
    </AdminLayout>
  );
};
