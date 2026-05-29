import {
  ActionArea,
  ActionAreaLayout,
  ActionDataTable,
  Header,
} from '@bahmni/design-system';
import {
  BAHMNI_HOME_PATH,
  createAppointmentUnavailability,
  type CreateUnavailabilityRequest,
  getAppointmentUnavailabilities,
  hasPrivilege,
  useTranslation,
} from '@bahmni/services';
import { useNotification, useUserPrivilege } from '@bahmni/widgets';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import React, { useCallback, useMemo, useState } from 'react';
import UnavailabilityForm from './components/UnavailabilityForm';
import {
  ADD_APPOINTMENT_UNAVAILABILITY_PRIVILEGE,
  GET_APPOINTMENT_UNAVAILABILITY_PRIVILEGE,
} from './constants';
import {
  type UnavailabilityFormData,
  type UnavailabilityFormErrors,
} from './models';
import styles from './styles/index.module.scss';
import {
  buildUnavailabilityRequests,
  createUnavailabilityViewModel,
  validateUnavailabilityForm,
} from './utils';

const AppointmentUnavailabilityPage: React.FC = () => {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const { userPrivileges } = useUserPrivilege();
  const { addNotification } = useNotification();
  const [isFormVisible, setIsFormVisible] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState<UnavailabilityFormData | null>(null);
  const [formErrors, setFormErrors] = useState<UnavailabilityFormErrors>({});

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

    return data.map((item) => createUnavailabilityViewModel(item, t));
  }, [data, t]);

  const handleFormSubmit = useCallback(
    async (requests: CreateUnavailabilityRequest[]) => {
      setIsSubmitting(true);
      try {
        await createAppointmentUnavailability(requests);
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

  const handlePrimaryButtonClick = useCallback(async () => {
    if (!formData) return;
    const errors = validateUnavailabilityForm(formData, t);
    setFormErrors(errors);
    if (Object.keys(errors).length > 0) return;

    await handleFormSubmit(buildUnavailabilityRequests(formData, t));
  }, [formData, t, handleFormSubmit]);

  const handleFormCancel = useCallback(() => {
    setIsFormVisible(false);
    setFormData(null);
    setFormErrors({});
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
            id="appointment-unavailability-actions-table"
            data-testid="appointment-unavailability-actions-table-test-id"
            aria-label="appointment-unavailability-actions-table-aria-label"
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
          <ActionArea
            data-testid="appointment-unavailability-form-panel-test-id"
            aria-label="appointment-unavailability-form-panel-aria-label"
            title={t('ADMIN_UNAVAILABILITY_FORM_TITLE')}
            primaryButtonText={t('ADMIN_UNAVAILABILITY_FORM_ADD')}
            onPrimaryButtonClick={handlePrimaryButtonClick}
            isPrimaryButtonDisabled={isSubmitting}
            secondaryButtonText={t('ADMIN_UNAVAILABILITY_FORM_CANCEL')}
            onSecondaryButtonClick={handleFormCancel}
            isSecondaryButtonDisabled={isSubmitting}
            content={
              <UnavailabilityForm
                errors={formErrors}
                onFormDataChange={setFormData}
              />
            }
          />
        )
      }
      isActionAreaVisible={isFormVisible}
    />
  );
};

export default AppointmentUnavailabilityPage;
