import {
  ActionAreaLayout,
  ActionDataTable,
  Button,
  Header,
} from '@bahmni/design-system';
import {
  BAHMNI_HOME_PATH,
  formatDateTime,
  getAppointmentUnavailabilities,
  useTranslation,
  type AppointmentUnavailability,
} from '@bahmni/services';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import React, { useCallback, useMemo, useState } from 'react';
import UnavailabilityForm from './components/UnavailabilityForm';
import styles from './styles/index.module.scss';
import { formatTime } from './utils';

const AppointmentUnavailabilityPage: React.FC = () => {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [isFormVisible, setIsFormVisible] = useState(false);

  const { data, isLoading, isError } = useQuery({
    queryKey: ['appointmentUnavailabilities'],
    queryFn: getAppointmentUnavailabilities,
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
      startDateTime: `${formatDateTime(item.startDate).formattedResult}, ${formatTime(item.startTime)}`,
      endDateTime: `${formatDateTime(item.endDate).formattedResult}, ${formatTime(item.endTime)}`,
      locationName: item.locationName,
      appointmentServiceName:
        item.appointmentServiceName ?? t('ADMIN_UNAVAILABILITY_ALL'),
      providerName: item.providerName ?? t('ADMIN_UNAVAILABILITY_ALL'),
    }));
  }, [data, t]);

  const handleFormSuccess = useCallback(() => {
    setIsFormVisible(false);
    queryClient.invalidateQueries({
      queryKey: ['appointmentUnavailabilities'],
    });
  }, [queryClient]);

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
          <div className={styles.header}>
            <h1 className={styles.title}>{t('ADMIN_UNAVAILABILITY_TITLE')}</h1>
            {!isFormVisible && (
              <Button
                id="add-unavailability-btn"
                kind="primary"
                className={styles.addBtn}
                onClick={() => setIsFormVisible(true)}
              >
                {t('ADMIN_UNAVAILABILITY_ADD_BUTTON')}
              </Button>
            )}
          </div>
          <ActionDataTable
            id="unavailability-table"
            title=""
            headers={headers}
            rows={rows}
            ariaLabel="unavailability-table"
            loading={isLoading}
            errorStateMessage={
              isError ? t('ADMIN_UNAVAILABILITY_ERROR_MESSAGE') : null
            }
            emptyStateMessage={t('ADMIN_UNAVAILABILITY_EMPTY_MESSAGE')}
            className={styles.table}
          />
        </div>
      }
      actionArea={
        isFormVisible && (
          <UnavailabilityForm
            onSuccess={handleFormSuccess}
            onCancel={handleFormCancel}
          />
        )
      }
      isActionAreaVisible={isFormVisible}
    />
  );
};

export default AppointmentUnavailabilityPage;
