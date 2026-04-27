import { SortableDataTable } from '@bahmni/design-system';
import { useTranslation } from '@bahmni/services';
import React from 'react';
import styles from '../styles/AppointmentsTable.module.scss';
import type { FormattedAppointment } from '../utils';

interface AppointmentTabContentProps {
  appointments: FormattedAppointment[];
  isLoading: boolean;
  emptyMessageKey: string;
  headers: Array<{ key: string; header: string }>;
  sortable: Array<{ key: string; sortable: boolean }>;
  renderCell: (row: FormattedAppointment, key: string) => React.ReactNode;
  pageSize?: number;
  page?: number;
  totalItems?: number;
  onPageChange?: (page: number, pageSize: number) => void;
}

const AppointmentTabContent: React.FC<AppointmentTabContentProps> = ({
  appointments,
  isLoading,
  emptyMessageKey,
  headers,
  sortable,
  renderCell,
  pageSize,
  page,
  totalItems,
  onPageChange,
}) => {
  const { t } = useTranslation();

  if (!isLoading && appointments.length === 0) {
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
      pageSize={pageSize}
      page={page}
      totalItems={totalItems}
      onPageChange={onPageChange}
    />
  );
};

export default AppointmentTabContent;
