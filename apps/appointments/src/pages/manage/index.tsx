import { useTranslation } from '@bahmni/services';
import React from 'react';
import { AppointmentsLayout } from '../../components/AppointmentsLayout';

const ManagePage: React.FC = () => {
  const { t } = useTranslation();

  return (
    <AppointmentsLayout
      pageBreadcrumb={{ id: 'manage', label: t('BREADCRUMB_MANAGE') }}
    >
      <h1
        id="appointments-manage-title"
        data-testid="appointments-manage-title-test-id"
        aria-label="appointments-manage-title-aria-label"
      >
        {t('APPOINTMENTS_MANAGE_TITLE')}
      </h1>
    </AppointmentsLayout>
  );
};

export default ManagePage;
