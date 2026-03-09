import { getPastAppointments } from '@bahmni/services';
import React from 'react';
import { useAppointmentQuery } from '../hooks/useAppointmentQuery';
import { useFormattedAppointments } from '../hooks/useFormattedAppointments';
import type { FormattedAppointment } from '../utils';
import AppointmentTabContent from './AppointmentTabContent';

interface PastAppointmentsProps {
  patientUUID: string;
  numberOfPastAppointments?: number;
  headers: Array<{ key: string; header: string }>;
  sortable: Array<{ key: string; sortable: boolean }>;
  renderCell: (row: FormattedAppointment, key: string) => React.ReactNode;
}

const PastAppointments: React.FC<PastAppointmentsProps> = ({
  patientUUID,
  numberOfPastAppointments,
  headers,
  sortable,
  renderCell,
}) => {
  const { data, isLoading } = useAppointmentQuery({
    queryKey: ['appointments-past', patientUUID, numberOfPastAppointments],
    queryFn: () => getPastAppointments(patientUUID, numberOfPastAppointments),
    patientUUID,
  });

  const formattedAppointments = useFormattedAppointments({
    data,
    idPrefix: 'past',
  });

  return (
    <AppointmentTabContent
      appointments={formattedAppointments}
      isLoading={isLoading}
      emptyMessageKey="DASHBOARD_NO_PAST_APPOINTMENTS_KEY"
      headers={headers}
      sortable={sortable}
      renderCell={renderCell}
    />
  );
};

export default PastAppointments;
