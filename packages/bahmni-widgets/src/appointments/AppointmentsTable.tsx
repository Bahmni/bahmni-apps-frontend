import {
  SortableDataTable,
  StatusTag,
  Tab,
  TabList,
  TabPanel,
  TabPanels,
  Tabs,
} from '@bahmni/design-system';
import {
  useTranslation,
  useSubscribeConsultationSaved,
  ConsultationSavedEventPayload,
  getUpcomingAppointments,
  getPastAppointments,
} from '@bahmni/services';
import { useQuery } from '@tanstack/react-query';
import React, { useMemo, useState, useEffect, useCallback } from 'react';
import { usePatientUUID } from '../hooks/usePatientUUID';
import { useNotification } from '../notification';
import { WidgetProps } from '../registry/model';
import {
  APPOINTMENT_STATUS_CLASS_MAP,
  APPOINTMENT_STATUS_TRANSLATION_MAP,
} from './constants';
import styles from './styles/AppointmentsTable.module.scss';
import { formatAppointment, FormattedAppointment } from './utils';

const FIELD_TRANSLATION_MAP: Record<string, string> = {
  appointmentNumber: 'APPOINTMENTS_NUMBER',
  service: 'APPOINTMENTS_SERVICE',
  reason: 'APPOINTMENTS_REASON',
  appointmentDate: 'APPOINTMENTS_DATE',
  appointmentSlot: 'APPOINTMENTS_SLOT',
  status: 'APPOINTMENTS_STATUS',
  provider: 'APPOINTMENTS_PROVIDER',
};

const DEFAULT_FIELDS = [
  'appointmentNumber',
  'service',
  'reason',
  'appointmentDate',
  'appointmentSlot',
  'status',
  'provider',
];

const getAppointmentStatusClassName = (status: string): string => {
  const statusKey = status?.toLowerCase();
  const classNameKey = APPOINTMENT_STATUS_CLASS_MAP[statusKey];
  return classNameKey ? styles[classNameKey] : styles.unknownStatus;
};

const getAppointmentStatusKey = (status: string): string => {
  const statusKey = status?.toLowerCase();
  return (
    APPOINTMENT_STATUS_TRANSLATION_MAP[statusKey] ??
    'APPOINTMENTS_STATUS_UNKNOWN'
  );
};

interface AppointmentTabContentProps {
  appointments: Array<Record<string, unknown>>;
  isLoading: boolean;
  emptyMessageKey: string;
  headers: Array<{ key: string; header: string }>;
  sortable: Array<{ key: string; sortable: boolean }>;
  renderCell: (row: FormattedAppointment, key: string) => React.ReactNode;
}

const AppointmentTabContent: React.FC<AppointmentTabContentProps> = ({
  appointments,
  isLoading,
  emptyMessageKey,
  headers,
  sortable,
  renderCell,
}) => {
  const { t } = useTranslation();

  if (appointments.length === 0) {
    return <p className={styles.appointmentTableEmpty}>{t(emptyMessageKey)}</p>;
  }

  return (
    <SortableDataTable
      headers={headers}
      ariaLabel={t('APPOINTMENTS_TABLE_ARIA_LABEL')}
      rows={appointments}
      loading={isLoading}
      sortable={sortable}
      renderCell={renderCell}
      className={styles.appointmentsTableBody}
    />
  );
};

const AppointmentsTable: React.FC<WidgetProps> = ({ config }) => {
  const { t } = useTranslation();
  const patientUUID = usePatientUUID();
  const { addNotification } = useNotification();
  const [selectedIndex, setSelectedIndex] = useState(0);

  const {
    data: upcomingData,
    isLoading: upcomingLoading,
    isError: upcomingError,
    error: upcomingErrorObj,
    refetch: refetchUpcoming,
  } = useQuery({
    queryKey: ['appointments-upcoming', patientUUID!],
    enabled: !!patientUUID,
    queryFn: () => getUpcomingAppointments(patientUUID!),
  });

  const {
    data: pastData,
    isLoading: pastLoading,
    isError: pastError,
    error: pastErrorObj,
    refetch: refetchPast,
  } = useQuery({
    queryKey: ['appointments-past', patientUUID!],
    enabled: !!patientUUID,
    queryFn: () => getPastAppointments(patientUUID!),
  });

  useEffect(() => {
    if (upcomingError) {
      addNotification({
        title: t('ERROR_DEFAULT_TITLE'),
        message: upcomingErrorObj?.message || t('APPOINTMENTS_ERROR_FETCHING'),
        type: 'error',
      });
    }
  }, [upcomingError, upcomingErrorObj, addNotification, t]);

  useEffect(() => {
    if (pastError) {
      addNotification({
        title: t('ERROR_DEFAULT_TITLE'),
        message: pastErrorObj?.message || t('APPOINTMENTS_ERROR_FETCHING'),
        type: 'error',
      });
    }
  }, [pastError, pastErrorObj, addNotification, t]);

  useSubscribeConsultationSaved(
    (payload: ConsultationSavedEventPayload) => {
      if (payload.patientUUID === patientUUID) {
        refetchUpcoming();
        refetchPast();
      }
    },
    [patientUUID, refetchUpcoming, refetchPast],
  );

  const upcomingAppointments = upcomingData ?? [];

  const pastAppointmentsData = pastData ?? [];
  const numberOfPastAppointments =
    config?.numberOfPastAppointments ?? pastAppointmentsData.length;
  const pastAppointments =
    numberOfPastAppointments > 0
      ? pastAppointmentsData.slice(0, numberOfPastAppointments)
      : [];

  const handleTabChange = (selectedIndex: number) => {
    setSelectedIndex(selectedIndex);
  };

  const configuredFields = config?.fields ?? DEFAULT_FIELDS;

  const headers = useMemo(
    () =>
      configuredFields.map((fieldKey: string) => ({
        key: fieldKey,
        header: t(FIELD_TRANSLATION_MAP[fieldKey] || fieldKey),
      })),
    [configuredFields, t],
  );

  const sortable = useMemo(
    () =>
      configuredFields.map((fieldKey: string) => ({
        key: fieldKey,
        sortable: true,
      })),
    [configuredFields],
  );

  const formattedUpcomingAppointments = useMemo(() => {
    if (!upcomingAppointments) return [];
    return upcomingAppointments.map((appointment, index: number) => {
      appointment.uuid ??= `upcoming-${index}`;
      return formatAppointment(appointment);
    });
  }, [upcomingAppointments]);

  const formattedPastAppointments = useMemo(() => {
    if (!pastAppointments || pastAppointments.length === 0) {
      return [];
    }
    const formatted = pastAppointments
      .map((appointment, index: number) => {
        if (!appointment) {
          return undefined;
        }
        appointment.uuid ??= `past-${index}`;
        return formatAppointment(appointment);
      })
      .filter((item): item is FormattedAppointment => item !== undefined);
    return formatted;
  }, [pastAppointments]);

  const renderCell = useCallback(
    (row: FormattedAppointment, key: string) => {
      if (!row) {
        return '-';
      }

      const record = row as unknown as Record<string, unknown>;
      switch (key) {
        case 'appointmentNumber': {
          const appointmentNum = (
            record.appointmentNumber as string | undefined
          )?.trim();
          return appointmentNum ?? '-';
        }
        case 'service':
          return row.service?.trim ? (
            <p className={styles.columnDataBold}>{row.service}</p>
          ) : (
            '-'
          );
        case 'reason': {
          const reasonVal = (record.reason as string | undefined)?.trim();
          return reasonVal ?? '-';
        }
        case 'appointmentDate': {
          const dateVal = row.appointmentDate?.trim();
          return dateVal ?? '-';
        }
        case 'appointmentSlot': {
          const timeVal = row.appointmentTime?.trim();
          return timeVal ?? '-';
        }
        case 'status':
          return (
            <StatusTag
              label={t(getAppointmentStatusKey(row.status))}
              dotClassName={getAppointmentStatusClassName(row.status)}
              testId={`appointment-status-${row.uuid}`}
            />
          );
        case 'provider': {
          const providerName = row.provider?.name?.trim();

          return providerName?.length ? providerName : '-';
        }
        default:
          return null;
      }
    },
    [t],
  );

  const hasError = upcomingError || pastError;

  if (hasError) {
    return (
      <div data-testid="appointments-table-error">
        <p className={styles.appointmentTableEmpty}>
          {t('APPOINTMENTS_ERROR_FETCHING')}
        </p>
      </div>
    );
  }

  return (
    <div data-testid="appointments-table">
      <Tabs
        selectedIndex={selectedIndex}
        onChange={(state) => handleTabChange(state.selectedIndex)}
      >
        <TabList
          aria-label={t('APPOINTMENTS_TABLE_ARIA_LABEL')}
          className={styles.appointmentTabList}
        >
          <Tab tabIndex={0}>{t('APPOINTMENTS_TAB_UPCOMING')}</Tab>
          <Tab tabIndex={1}>{t('APPOINTMENTS_TAB_PAST')}</Tab>
        </TabList>
        <TabPanels>
          <TabPanel className={styles.appointmentTabs}>
            <AppointmentTabContent
              appointments={formattedUpcomingAppointments}
              isLoading={upcomingLoading}
              emptyMessageKey="DASHBOARD_NO_UPCOMING_APPOINTMENTS_KEY"
              headers={headers}
              sortable={sortable}
              renderCell={renderCell}
            />
          </TabPanel>

          <TabPanel className={styles.appointmentTabs}>
            <AppointmentTabContent
              appointments={formattedPastAppointments}
              isLoading={pastLoading}
              emptyMessageKey="DASHBOARD_NO_PAST_APPOINTMENTS_KEY"
              headers={headers}
              sortable={sortable}
              renderCell={renderCell}
            />
          </TabPanel>
        </TabPanels>
      </Tabs>
    </div>
  );
};

export default AppointmentsTable;
