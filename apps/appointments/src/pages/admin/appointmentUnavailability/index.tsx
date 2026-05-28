import {
  ActionAreaLayout,
  ActionDataTable,
  Header,
} from '@bahmni/design-system';
import {
  BAHMNI_HOME_PATH,
  createAppointmentUnavailability,
  type CreateUnavailabilityRequest,
  formatDateTime,
  getAppointmentUnavailabilities,
  hasPrivilege,
  useTranslation,
  type AppointmentUnavailability,
} from '@bahmni/services';
import { useNotification, useUserPrivilege } from '@bahmni/widgets';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import React, { useCallback, useMemo, useState } from 'react';
import UnavailabilityForm from './components/UnavailabilityForm';
import {
  ADD_APPOINTMENT_UNAVAILABILITY_PRIVILEGE,
  GET_APPOINTMENT_UNAVAILABILITY_PRIVILEGE,
} from './constants';
import styles from './styles/index.module.scss';

const AppointmentUnavailabilityPage: React.FC = () => {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const { userPrivileges } = useUserPrivilege();
  const { addNotification } = useNotification();
  const [isFormVisible, setIsFormVisible] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const canViewUnavailability = hasPrivilege(
    userPrivileges,
    GET_APPOINTMENT_UNAVAILABILITY_PRIVILEGE,
  );
  const canAddUnavailability = hasPrivilege(userPrivileges, [
    ADD_APPOINTMENT_UNAVAILABILITY_PRIVILEGE,
    GET_APPOINTMENT_UNAVAILABILITY_PRIVILEGE,
  ]);

  const { data, isLoading, isError } = useQuery({
    queryKey: ['appointmentUnavailabilities'],
    queryFn: getAppointmentUnavailabilities,
    enabled: canViewUnavailability,
  });

  const breadcrumbs = [
    { id: 'home', label: t('BREADCRUMB_HOME'), href: BAHMNI_HOME_PATH },
    {
      id: 'appointments',
      label: t('BREADCRUMB_APPOINTMENTS'),
      href: '/appointments',
    },
    { id: 'admin', label: t('BREADCRUMB_ADMIN'), isCurrentPage: true },
  ];

  const headers = useMemo(() => {
    return [
      { key: 'startDateTime', header: t('ADMIN_UNAVAILABILITY_COLUMN_START') },
      { key: 'endDateTime', header: t('ADMIN_UNAVAILABILITY_COLUMN_END') },
      {
        key: 'locationName',
        header: t('ADMIN_UNAVAILABILITY_COLUMN_LOCATION'),
      },
      {
        key: 'appointmentServiceName',
        header: t('ADMIN_UNAVAILABILITY_COLUMN_SERVICE'),
      },
      {
        key: 'providerName',
        header: t('ADMIN_UNAVAILABILITY_COLUMN_PROVIDER'),
      },
      {
        key: 'actions',
        header: t('ADMIN_UNAVAILABILITY_COLUMN_ACTIONS'),
      },
    ];
  }, [t]);

  const rows = useMemo(() => {
    if (!data) return [];

    return data.map((item: AppointmentUnavailability) => ({
      id: item.uuid,
      startDateTime: formatDateTime(
        `${item.startDate}T${item.startTime}`,
        t,
        true,
      ).formattedResult,
      endDateTime: formatDateTime(`${item.endDate}T${item.endTime}`, t, true)
        .formattedResult,
      locationName: item.location.name,
      appointmentServiceName:
        item.service?.name ?? t('ADMIN_UNAVAILABILITY_ALL'),
      providerName: item.provider?.name ?? t('ADMIN_UNAVAILABILITY_ALL'),
    }));
  }, [data, t]);

  const handleFormSubmit = useCallback(
    async (data: CreateUnavailabilityRequest[]) => {
      setIsSubmitting(true);
      try {
        await createAppointmentUnavailability(data);
        addNotification({
          title: t('ADMIN_UNAVAILABILITY_FORM_SUCCESS_TITLE'),
          message: t('ADMIN_UNAVAILABILITY_FORM_SUCCESS_MESSAGE'),
          type: 'success',
          timeout: 5000,
        });
        setIsFormVisible(false);
        queryClient.invalidateQueries({
          queryKey: ['appointmentUnavailabilities'],
        });
      } catch {
        addNotification({
          title: t('ADMIN_UNAVAILABILITY_FORM_ERROR_TITLE'),
          message: t('ADMIN_UNAVAILABILITY_FORM_ERROR_MESSAGE'),
          type: 'error',
        });
      } finally {
        setIsSubmitting(false);
      }
    },
    [addNotification, queryClient, t],
  );

  const handleFormCancel = useCallback(() => {
    setIsFormVisible(false);
  }, []);

  return (
    <ActionAreaLayout
      headerWSideNav={<Header breadcrumbItems={breadcrumbs} />}
      hasSideNav={false}
      mainDisplay={
        <div
          id="appointment-unavailability-page"
          data-testid="appointment-unavailability-page-test-id"
          aria-label="appointment-unavailability-page-aria-label"
          className={styles.page}
        >
          <ActionDataTable
            id="unavailability-table"
            title={t('ADMIN_UNAVAILABILITY_TITLE')}
            headers={headers}
            rows={rows}
            ariaLabel="unavailability-table"
            loading={isLoading}
            errorStateMessage={
              isError ? t('ADMIN_UNAVAILABILITY_ERROR_MESSAGE') : null
            }
            emptyStateMessage={t('ADMIN_UNAVAILABILITY_EMPTY_MESSAGE')}
            actionButton={
              !isFormVisible && canAddUnavailability
                ? {
                    label: t('ADMIN_UNAVAILABILITY_ADD_BUTTON'),
                    onClick: () => setIsFormVisible(true),
                    props: { id: 'add-unavailability-btn', kind: 'primary' },
                  }
                : undefined
            }
          />
        </div>
      }
      actionArea={
        isFormVisible && (
          <UnavailabilityForm
            onSubmit={handleFormSubmit}
            onCancel={handleFormCancel}
            isSubmitting={isSubmitting}
          />
        )
      }
      isActionAreaVisible={isFormVisible}
    />
  );
};

export default AppointmentUnavailabilityPage;
