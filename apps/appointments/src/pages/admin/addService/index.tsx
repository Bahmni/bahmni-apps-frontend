import { BaseLayout, Button, Header } from '@bahmni/design-system';
import {
  BAHMNI_APP_BASE_PATH,
  BAHMNI_HOME_PATH,
  createAppointmentService,
  hasPrivilege,
  useTranslation,
} from '@bahmni/services';
import {
  ConfirmationModal,
  useNotification,
  useUserPrivilege,
} from '@bahmni/widgets';
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  MANAGE_APPOINTMENT_SERVICES_PRIVILEGE,
  PATHS,
} from '../../../constants/app';
import { useServiceStore } from '../stores';
import AvailabilitySection from './components/AvailabilitySection';
import ServiceDetailsSection from './components/DetailsSection';
import { useUnsavedChangesGuard } from './hooks/useUnsavedChangesGuard';
import styles from './styles/index.module.scss';

const toSqlTime = (time: string) => `${time}:00`;

const AddServicePage: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { addNotification } = useNotification();
  const { userPrivileges } = useUserPrivilege();
  const [isSaving, setIsSaving] = useState(false);
  // What to do if the user confirms Leave. Non-null means the dialog is open.
  const [pendingLeave, setPendingLeave] = useState<
    ((hasGuard: boolean) => void) | null
  >(null);

  const canManageServices = hasPrivilege(
    userPrivileges,
    MANAGE_APPOINTMENT_SERVICES_PRIVILEGE,
  );

  const { validate, reset } = useServiceStore();
  const isDirty = useServiceStore((state) => state.hasUnsavedChanges());

  // The store outlives the page, so clear it however the user leaves.
  useEffect(() => reset, [reset]);

  const { leave } = useUnsavedChangesGuard(isDirty, () =>
    // Browser Back: the guard entry sits above the page entry, so skip both.
    setPendingLeave(() => () => window.history.go(-2)),
  );

  const confirmLeave = (navigateAway: (hasGuard: boolean) => void) => {
    if (isDirty) {
      setPendingLeave(() => navigateAway);
      return;
    }
    leave(navigateAway);
  };

  const goToAllServices = (hasGuard: boolean) =>
    navigate(PATHS.ADMIN_SERVICES, { replace: hasGuard });

  const goToHome = (hasGuard: boolean) =>
    hasGuard
      ? window.location.replace(BAHMNI_HOME_PATH)
      : window.location.assign(BAHMNI_HOME_PATH);

  const handleLeave = () => {
    const navigateAway = pendingLeave!;
    setPendingLeave(null);
    reset();
    leave(navigateAway);
  };

  const handleSave = async () => {
    if (!validate()) return;

    const {
      name,
      description,
      durationMins,
      specialityUuid,
      locationUuid,
      availabilityRows,
    } = useServiceStore.getState();

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
    {
      id: 'home',
      label: t('BREADCRUMB_HOME'),
      href: BAHMNI_HOME_PATH,
      onClick: (event: React.MouseEvent<HTMLElement>) => {
        event.preventDefault();
        confirmLeave(goToHome);
      },
    },
    {
      id: 'admin',
      label: t('BREADCRUMB_ADMIN'),
      // Breadcrumb hrefs are plain anchors, so they need the app-prefixed path.
      href: `${BAHMNI_APP_BASE_PATH}${PATHS.ADMIN_SERVICES}`,
      onClick: (event: React.MouseEvent<HTMLElement>) => {
        event.preventDefault();
        confirmLeave(goToAllServices);
      },
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
            <ConfirmationModal
              open={pendingLeave !== null}
              danger
              testId="add-service-unsaved-changes-modal"
              heading={t('ADMIN_ADD_SERVICE_UNSAVED_MODAL_TITLE')}
              body={t('ADMIN_ADD_SERVICE_UNSAVED_MODAL_BODY')}
              confirmLabel={t('ADMIN_ADD_SERVICE_UNSAVED_MODAL_LEAVE')}
              cancelLabel={t('ADMIN_ADD_SERVICE_UNSAVED_MODAL_STAY')}
              onConfirm={handleLeave}
              onCancel={() => setPendingLeave(null)}
            />
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
              onClick={() => confirmLeave(goToAllServices)}
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
