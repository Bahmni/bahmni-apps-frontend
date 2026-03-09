import {
  StatusTag,
  Tab,
  TabList,
  TabPanel,
  TabPanels,
  Tabs,
} from '@bahmni/design-system';
import { useTranslation } from '@bahmni/services';
import React, { useCallback, useMemo, useState } from 'react';
import { usePatientUUID } from '../hooks/usePatientUUID';
import { WidgetProps } from '../registry/model';
import PastAppointments from './components/PastAppointments';
import UpcomingAppointments from './components/UpcomingAppointments';
import {
  APPOINTMENT_STATUS_STYLES_MAP,
  DEFAULT_FIELDS,
  FIELD_TRANSLATION_MAP,
  getAppointmentStatusKey,
} from './constants';
import styles from './styles/AppointmentsTable.module.scss';
import { FormattedAppointment } from './utils';

const AppointmentsTable: React.FC<WidgetProps> = ({ config }) => {
  const { t } = useTranslation();
  const patientUUID = usePatientUUID();
  const [selectedIndex, setSelectedIndex] = useState(0);

  const configuredFields =
    (config?.fields as string[] | undefined) ?? DEFAULT_FIELDS;
  const numberOfPastAppointments = config?.numberOfPastAppointments as
    | number
    | undefined;

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

  const renderCell = useCallback(
    (row: FormattedAppointment, key: string) => {
      if (!row) {
        return '-';
      }

      const record = row as unknown as Record<string, unknown>;
      const getStatusDotClassName = (status: string): string => {
        return (
          APPOINTMENT_STATUS_STYLES_MAP[status?.toLowerCase()] ||
          styles.unknownStatus
        );
      };

      switch (key) {
        case 'appointmentNumber': {
          const appointmentNum = (
            record.appointmentNumber as string | undefined
          )?.trim();
          return appointmentNum ?? '-';
        }
        case 'service': {
          const serviceName = (record.service as string | undefined)?.trim();
          return serviceName ? (
            <p className={styles.columnDataBold}>{serviceName}</p>
          ) : (
            '-'
          );
        }
        case 'reason': {
          const reasonVal = (record.reason as string | undefined)?.trim();
          return reasonVal ?? '-';
        }
        case 'appointmentDate': {
          const dateVal = row.appointmentDate?.trim();
          return dateVal ?? '-';
        }
        case 'appointmentSlot': {
          const timeVal = row.appointmentSlot?.trim();
          return timeVal ?? '-';
        }
        case 'status':
          return (
            <StatusTag
              label={t(getAppointmentStatusKey(row.status))}
              dotClassName={getStatusDotClassName(row.status)}
              testId={`appointment-status-${row.uuid}`}
            />
          );
        case 'provider': {
          const providerName = row.provider?.trim();

          return providerName?.length ? providerName : '-';
        }
        default:
          return null;
      }
    },
    [t],
  );

  if (!patientUUID) {
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
        onChange={(state) => setSelectedIndex(state.selectedIndex)}
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
            <UpcomingAppointments
              patientUUID={patientUUID}
              headers={headers}
              sortable={sortable}
              renderCell={renderCell}
            />
          </TabPanel>

          <TabPanel className={styles.appointmentTabs}>
            <PastAppointments
              patientUUID={patientUUID}
              numberOfPastAppointments={numberOfPastAppointments}
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
