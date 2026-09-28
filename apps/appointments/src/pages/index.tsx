import { useTranslation } from '@bahmni/services';
import React from 'react';
import { AppointmentsLayout } from '../components/AppointmentsLayout';

export const IndexPage: React.FC = () => {
  const { t } = useTranslation();

  return (
    <AppointmentsLayout>
      <h1
        id="appointments-index-title"
        data-testid="appointments-index-title-test-id"
        aria-label="appointments-index-title-aria-label"
      >
        {t('APPOINTMENTS_INDEX_TITLE')}
      </h1>
      <p
        id="appointments-index-description"
        data-testid="appointments-index-description-test-id"
        aria-label="appointments-index-description-aria-label"
      >
        {t('APPOINTMENTS_INDEX_DESCRIPTION')}
      </p>
    </AppointmentsLayout>
  );
};
