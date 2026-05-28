import { BaseLayout, Button, Header } from '@bahmni/design-system';
import {
  BAHMNI_HOME_PATH,
  createAppointmentService,
  hasPrivilege,
  useTranslation,
} from '@bahmni/services';
import { useNotification, useUserPrivilege } from '@bahmni/widgets';
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  MANAGE_APPOINTMENT_SERVICES_PRIVILEGE,
  PATHS,
} from '../../../constants/app';
import AvailabilitySection from './components/AvailabilitySection';
import ServiceDetailsSection from './components/DetailsSection';
import { useAddServiceStore } from './stores';
import styles from './styles/index.module.scss';

const toSqlTime = (time: string) => `${time}:00`;

const AddServicePage: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { addNotification } = useNotification();
  const { userPrivileges } = useUserPrivilege();
  const [isSaving, setIsSaving] = useState(false);

  const canManageServices = hasPrivilege(
    userPrivileges,
    MANAGE_APPOINTMENT_SERVICES_PRIVILEGE,
  );

  const { validate } = useAddServiceStore();

  const handleSave = async () => {
    if (!validate()) return;

    const {
      name,
      description,
      durationMins,
      specialityUuid,
      locationUuid,
      availabilityRows,
    } = useAddServiceStore.getState();

    const weeklyAvailability = availabilityRows.flatMap((row) =>
      row.daysOfWeek.map((day) => ({
        dayOfWeek: day,
        startTime: toSqlTime(row.startTime),
        endTime: toSqlTime(row.endTime),
        maxAppointmentsLimit: row.maxLoad,
      })),
    );

    const request = {
      name,
      ...(description && { description }),
      ...(specialityUuid && { specialityUuid }),
      ...(locationUuid && { locationUuid }),
      ...(durationMins !== null && { durationMins }),
      weeklyAvailability,
    };

    setIsSaving(true);
    try {
      await createAppointmentService(request);
      addNotification({
        title: t('ADMIN_ADD_SERVICE_SUCCESS_TITLE'),
        message: t('ADMIN_ADD_SERVICE_SUCCESS_MESSAGE'),
        type: 'success',
        timeout: 5000,
      });
    } catch {
      addNotification({
        title: t('ADMIN_ADD_SERVICE_ERROR_TITLE'),
        message: t('ADMIN_ADD_SERVICE_ERROR_MESSAGE'),
        type: 'error',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const breadcrumbs = [
    { id: 'home', label: t('BREADCRUMB_HOME'), href: BAHMNI_HOME_PATH },
    {
      id: 'admin',
      label: t('BREADCRUMB_ADMIN'),
      href: PATHS.ADMIN_SERVICES,
    },
    {
      id: 'add-service',
      label: t('BREADCRUMB_ADD_SERVICE'),
      isCurrentPage: true,
    },
  ];

  return (
    <BaseLayout
      header={<Header breadcrumbItems={breadcrumbs} />}
      main={
        canManageServices ? (
          <div
            id="add-appointment-service-page"
            data-testid="add-appointment-service-page-test-id"
            aria-label="add-appointment-service-page-aria-label"
          >
            <div className={styles.page}>
              <h2
                id="add-new-appointment-service-title"
                data-testid="add-new-appointment-service-title-test-id"
                aria-label="add-new-appointment-service-title-aria-label"
              >
                {t('ADMIN_ADD_SERVICE_TITLE')}
              </h2>
              <ServiceDetailsSection />
              <AvailabilitySection />
            </div>
          </div>
        ) : (
          <div
            id="add-appointment-service-no-manage-privilege"
            data-testid="add-appointment-service-no-manage-privilege-test-id"
            aria-label="add-appointment-service-no-manage-privilege-aria-label"
            className={styles.noPrivilegeContainer}
          >
            {t('ADMIN_ADD_SERVICE_ERROR_MESSAGE_NO_MANAGE_PRIVILEGE')}
          </div>
        )
      }
      footer={
        canManageServices ? (
          <div className={styles.footer}>
            <Button
              id="back-btn"
              data-testid="back-btn-test-id"
              kind="tertiary"
              onClick={() => navigate(PATHS.ADMIN_SERVICES)}
            >
              {t('ADMIN_ADD_SERVICE_BACK_BUTTON')}
            </Button>
            <Button
              id="save-btn"
              data-testid="save-btn-test-id"
              kind="primary"
              disabled={isSaving}
              onClick={handleSave}
            >
              {t('ADMIN_ADD_SERVICE_SAVE_BUTTON')}
            </Button>
          </div>
        ) : undefined
      }
    />
  );
};

export default AddServicePage;
