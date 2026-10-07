import { useTranslation } from '@bahmni/services';
import React from 'react';
import { AppointmentsLayout } from '../../components/AppointmentsLayout';

const NewAppointmentPage: React.FC = () => {
  const { t } = useTranslation();

  return (
    <AppointmentsLayout
      pageBreadcrumb={{ id: 'new', label: t('BREADCRUMB_NEW') }}
    >
      <h1
        id="appointments-new-title"
        data-testid="appointments-new-title-test-id"
        aria-label="appointments-new-title-aria-label"
      >
        {t('APPOINTMENTS_NEW_TITLE')}
      </h1>
    </AppointmentsLayout>
  );
};

export default NewAppointmentPage;
