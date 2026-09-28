import { useTranslation } from '@bahmni/services';
import React from 'react';
import { useParams } from 'react-router-dom';
import { AppointmentsLayout } from '../../components/AppointmentsLayout';

const EditAppointmentPage: React.FC = () => {
  const { t } = useTranslation();
  const { appointmentUuid } = useParams<{ appointmentUuid: string }>();

  return (
    <AppointmentsLayout
      pageBreadcrumb={{ id: 'edit', label: t('BREADCRUMB_EDIT') }}
    >
      <h1
        id="appointments-edit-title"
        data-testid="appointments-edit-title-test-id"
        aria-label="appointments-edit-title-aria-label"
      >
        {t('APPOINTMENTS_EDIT_TITLE')}
      </h1>
      <p
        id="appointments-edit-appointment-uuid"
        data-testid="appointments-edit-appointment-uuid-test-id"
        aria-label="appointments-edit-appointment-uuid-aria-label"
      >
        {t('APPOINTMENTS_EDIT_APPOINTMENT_UUID_LABEL', { appointmentUuid })}
      </p>
    </AppointmentsLayout>
  );
};

export default EditAppointmentPage;
