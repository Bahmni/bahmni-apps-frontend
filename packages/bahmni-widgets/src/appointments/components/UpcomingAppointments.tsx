import { getUpcomingAppointmentsPage } from '@bahmni/services';
import React from 'react';
import { usePaginatedAppointments } from '../hooks/usePaginatedAppointments';
import type { FormattedAppointment } from '../utils';
import AppointmentTabContent from './AppointmentTabContent';

interface UpcomingAppointmentsProps {
  patientUUID: string;
  pageSize: number;
  headers: Array<{ key: string; header: string }>;
  sortable: Array<{ key: string; sortable: boolean }>;
  renderCell: (row: FormattedAppointment, key: string) => React.ReactNode;
}

const UpcomingAppointments: React.FC<UpcomingAppointmentsProps> = ({
  patientUUID,
  pageSize,
  headers,
  sortable,
  renderCell,
}) => {
  const {
    formattedAppointments,
    isLoading,
    currentPage,
    selectedPageSize,
    serverTotal,
    handlePageChange,
  } = usePaginatedAppointments({
    queryKeyPrefix: 'appointments-upcoming',
    patientUUID,
    pageSize,
    idPrefix: 'upcoming',
    queryFn: (count, page) =>
      getUpcomingAppointmentsPage(patientUUID, count, page),
  });

  return (
    <AppointmentTabContent
      appointments={formattedAppointments}
      isLoading={isLoading}
      emptyMessageKey="DASHBOARD_NO_UPCOMING_APPOINTMENTS_KEY"
      headers={headers}
      sortable={sortable}
      renderCell={renderCell}
      pageSize={selectedPageSize}
      page={currentPage}
      totalItems={serverTotal}
      onPageChange={handlePageChange}
    />
  );
};

export default UpcomingAppointments;
