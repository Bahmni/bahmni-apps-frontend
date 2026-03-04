import { Appointment } from '@bahmni/services';
import { format } from 'date-fns';

export interface FormattedAppointment extends Appointment {
  id?: string;
  appointmentDate: string;
  appointmentTime: string;
  appointmentSlot?: string;
  reason?: string;
}

const formatDateFromUtcArray = (dateTimeArray: number[]): string => {
  try {
    if (!Array.isArray(dateTimeArray) || dateTimeArray.length < 5) {
      return '-';
    }

    const [year, month, day, hour, minute] = dateTimeArray;
    const utcTimestamp = Date.UTC(year, month - 1, day, hour, minute);
    const date = new Date(utcTimestamp);

    return format(date, 'dd/MM/yyyy');
  } catch {
    return '-';
  }
};

const formatTimeFromUtcArray = (dateTimeArray: number[]): string => {
  try {
    if (!Array.isArray(dateTimeArray) || dateTimeArray.length < 5) {
      return '-';
    }

    const [year, month, day, hour, minute] = dateTimeArray;
    const utcTimestamp = Date.UTC(year, month - 1, day, hour, minute);
    const date = new Date(utcTimestamp);

    return format(date, 'hh:mm a');
  } catch {
    return '-';
  }
};

export const formatAppointment = (
  appointment: Appointment & {
    appointmentSlot?: string;
    appointmentNumber?: string;
  },
): FormattedAppointment => {
  let appointmentDate = '-';
  let appointmentTime = '-';

  try {
    if (appointment.startDateTime) {
      if (Array.isArray(appointment.startDateTime)) {
        appointmentDate = formatDateFromUtcArray(
          appointment.startDateTime as number[],
        );

        const startTime = formatTimeFromUtcArray(
          appointment.startDateTime as number[],
        );

        let endTime = startTime;
        if (appointment.endDateTime && Array.isArray(appointment.endDateTime)) {
          endTime = formatTimeFromUtcArray(appointment.endDateTime as number[]);
        }

        appointmentTime = `${startTime} - ${endTime}`;
      }
    }
  } catch {
    appointmentDate = '-';
    appointmentTime = '-';
  }

  const reason =
    appointment.reasons && appointment.reasons.length > 0
      ? appointment.reasons.map((r) => r.name).join(', ')
      : undefined;

  return {
    ...appointment,
    id: appointment.uuid,
    appointmentDate,
    appointmentTime,
    ...(reason && { reason }),
    service: appointment.service?.name || '-',
  };
};

export const sortAppointmentsByDate = (
  appointments: FormattedAppointment[],
): FormattedAppointment[] => {
  return [...appointments].sort((a, b) => {
    if (a.appointmentDate === '-' || b.appointmentDate === '-') {
      if (a.appointmentDate === b.appointmentDate) return 0;
      return a.appointmentDate === '-' ? 1 : -1;
    }

    const dateA = new Date(a.appointmentDate.split('/').reverse().join('-'));
    const dateB = new Date(b.appointmentDate.split('/').reverse().join('-'));

    const timeA = dateA.getTime();
    const timeB = dateB.getTime();

    if (isNaN(timeA) || isNaN(timeB)) return 0;

    return timeA - timeB;
  });
};
