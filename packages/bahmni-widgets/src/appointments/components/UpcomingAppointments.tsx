import { getUpcomingAppointments } from '@bahmni/services';
import React from 'react';
import { useAppointmentQuery } from '../hooks/useAppointmentQuery';
import { useFormattedAppointments } from '../hooks/useFormattedAppointments';
import type { FormattedAppointment } from '../utils';
import AppointmentTabContent from './AppointmentTabContent';

interface UpcomingAppointmentsProps {
  patientUUID: string;
  headers: Array<{ key: string; header: string }>;
  sortable: Array<{ key: string; sortable: boolean }>;
  renderCell: (row: FormattedAppointment, key: string) => React.ReactNode;
}

const UpcomingAppointments: React.FC<UpcomingAppointmentsProps> = ({
  patientUUID,
  headers,
  sortable,
  renderCell,
}) => {
  const { data, isLoading } = useAppointmentQuery({
    queryKey: ['appointments-upcoming', patientUUID],
    queryFn: () => getUpcomingAppointments(patientUUID),
    patientUUID,
  });

  const formattedAppointments = useFormattedAppointments({
    data,
    idPrefix: 'upcoming',
  });

  return (
    <AppointmentTabContent
      appointments={formattedAppointments}
      isLoading={isLoading}
      emptyMessageKey="DASHBOARD_NO_UPCOMING_APPOINTMENTS_KEY"
      headers={headers}
      sortable={sortable}
      renderCell={renderCell}
    />
  );
};

export default UpcomingAppointments;
