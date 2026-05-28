import {
  ActionDataTable,
  BaseLayout,
  Header,
  IconButton,
  TrashCan,
} from '@bahmni/design-system';
import {
  BAHMNI_HOME_PATH,
  deleteAppointmentService,
  getAllAppointmentServices,
  hasPrivilege,
  useTranslation,
} from '@bahmni/services';
import { useNotification, useUserPrivilege } from '@bahmni/widgets';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ADMIN_TAB_PRIVILEGE,
  MANAGE_APPOINTMENT_SERVICES_PRIVILEGE,
  PATHS,
} from '../../../constants/app';
import { useAppointmentsConfig } from '../../../providers/appointmentsConfig';
import DeleteServiceModal from './components/DeleteServiceModal';
import { KNOWN_FIELDS } from './constants';
import { AppointmentServiceViewModel } from './model';
import styles from './styles/index.module.scss';
import {
  createAppointmentServiceViewModels,
  createServiceHeaders,
  extractServiceAttributeNames,
} from './utils';

const AllServicesPage: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { addNotification } = useNotification();
  const { userPrivileges } = useUserPrivilege();
  const { appointmentsConfig } = useAppointmentsConfig();
  const [serviceToDelete, setServiceToDelete] =
    useState<AppointmentServiceViewModel | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const serviceTableFields = appointmentsConfig?.serviceTableFields ?? [
    ...KNOWN_FIELDS,
  ];
  const canViewServices = hasPrivilege(userPrivileges, ADMIN_TAB_PRIVILEGE);
  const canManageServices = hasPrivilege(
    userPrivileges,
    MANAGE_APPOINTMENT_SERVICES_PRIVILEGE,
  );

  const attributeNames = useMemo(
    () => extractServiceAttributeNames(serviceTableFields),
    [serviceTableFields],
  );

  const { data, isLoading, isError } = useQuery({
    queryKey: ['allAppointmentServices'],
    queryFn: getAllAppointmentServices,
    enabled: canViewServices,
  });

  const headers = useMemo(
    () => createServiceHeaders(serviceTableFields, t),
    [serviceTableFields],
  );

  const rows: AppointmentServiceViewModel[] = useMemo(
    () => createAppointmentServiceViewModels(data ?? [], attributeNames),
    [data, attributeNames],
  );

  const handleDeleteConfirm = async () => {
    setIsDeleting(true);
    try {
      await deleteAppointmentService(serviceToDelete!.id);
      addNotification({
        title: t('ADMIN_ALL_SERVICES_DELETE_SUCCESS_TITLE'),
        message: t('ADMIN_ALL_SERVICES_DELETE_SUCCESS_MESSAGE'),
        type: 'success',
        timeout: 5000,
      });
      setServiceToDelete(null);
      queryClient.invalidateQueries({ queryKey: ['allAppointmentServices'] });
    } catch {
      addNotification({
        title: t('ADMIN_ALL_SERVICES_DELETE_ERROR_TITLE'),
        message: t('ADMIN_ALL_SERVICES_DELETE_ERROR_MESSAGE'),
        type: 'error',
      });
    } finally {
      setIsDeleting(false);
    }
  };

  const renderCell = (
    row: AppointmentServiceViewModel,
    cellId: string,
  ): React.ReactNode => {
    if (cellId === 'actions') {
      return (
        <IconButton
          id={`delete-service-${row.id}-btn`}
          testId={`delete-service-${row.id}-btn-test-id`}
          aria-label={`delete-service-${row.id}-btn-aria-label`}
          kind="ghost"
          label={t('ADMIN_ALL_SERVICES_DELETE_ICON_LABEL')}
          disabled={!canManageServices}
          onClick={() => setServiceToDelete(row)}
        >
          <TrashCan />
        </IconButton>
      );
    }
    if (KNOWN_FIELDS.includes(cellId))
      return (
        (row[cellId as keyof AppointmentServiceViewModel] as string) ?? '-'
      );
    return row.attributes[cellId] ?? '-';
  };

  const breadcrumbs = [
    { id: 'home', label: t('BREADCRUMB_HOME'), href: BAHMNI_HOME_PATH },
    { id: 'admin', label: t('BREADCRUMB_ADMIN'), isCurrentPage: true },
  ];

  return (
    <BaseLayout
      header={<Header breadcrumbItems={breadcrumbs} />}
      main={
        canViewServices ? (
          <div
            id="all-appointment-service-page"
            data-testid="all-appointment-service-page-test-id"
            aria-label="all-appointment-service-page-aria-label"
            className={styles.page}
          >
            <ActionDataTable
              id="all-services"
              title={t('ADMIN_ALL_SERVICES_TITLE')}
              headers={headers}
              rows={rows}
              ariaLabel="all-services-table"
              loading={isLoading}
              errorStateMessage={
                isError ? t('ADMIN_ALL_SERVICES_ERROR_MESSAGE') : null
              }
              emptyStateMessage={t('ADMIN_ALL_SERVICES_EMPTY_MESSAGE')}
              renderCell={renderCell}
              className={styles.table}
              actionButton={{
                label: t('ADMIN_ALL_SERVICES_ADD_BUTTON'),
                disabled: !canManageServices,
                onClick: () => navigate(PATHS.ADMIN_ADD_SERVICE),
              }}
            />
            {serviceToDelete && (
              <DeleteServiceModal
                serviceName={serviceToDelete.name}
                isDeleting={isDeleting}
                onConfirm={handleDeleteConfirm}
                onCancel={() => setServiceToDelete(null)}
              />
            )}
          </div>
        ) : (
          <div
            id="all-appointment-service-no-view-privilege"
            data-testid="all-appointment-service-no-view-privilege-test-id"
            aria-label="all-appointment-service-no-view-privilege-aria-label"
            className={styles.noPrivilegeContainer}
          >
            {t('ADMIN_ALL_SERVICES_ERROR_MESSAGE_NO_VIEW_PRIVILEGE')}
          </div>
        )
      }
    />
  );
};

export default AllServicesPage;
