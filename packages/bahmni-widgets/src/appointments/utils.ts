import { APPOINTMENT_IDENTIFIER_SYSTEM } from '@bahmni/services';
import { format, parseISO } from 'date-fns';
import type { Appointment as FhirAppointment } from 'fhir/r4';
import type { FormattedAppointment } from './models';

export type { FormattedAppointment };

const formatDateFromIsoString = (isoDateString: string): string => {
  try {
    if (!isoDateString) return '-';
    return format(parseISO(isoDateString), 'dd/MM/yyyy');
  } catch {
    return '-';
  }
};

const formatTimeFromIsoString = (isoDateString: string): string => {
  try {
    if (!isoDateString) return '-';
    return format(parseISO(isoDateString), 'hh:mm a');
  } catch {
    return '-';
  }
};

const transformFhirAppointmentInternal = (
  fhirAppt: FhirAppointment,
): FormattedAppointment => {
  const participants =
    fhirAppt.participant?.map((p) => {
      const refParts = p.actor?.reference?.split('/');
      const type =
        refParts && refParts.length >= 2
          ? refParts[refParts.length - 2]
          : undefined;
      return {
        reference: p.actor?.reference ?? '',
        display: p.actor?.display ?? '',
        type,
        status: p.status,
      };
    }) ?? [];

  const practitionerParticipant = participants.find(
    (p) => p.type === 'Practitioner',
  );

  const appointmentNumber =
    fhirAppt.identifier?.find(
      (id) => id.system === APPOINTMENT_IDENTIFIER_SYSTEM,
    )?.value ?? '';

  const reasonCodes = (fhirAppt.reasonCode
    ?.map((rc) => rc.text?.trim())
    .filter(Boolean) ?? []) as string[];

  const reason = reasonCodes.length > 0 ? reasonCodes.join(', ') : '-';

  let appointmentDate = '-';
  let appointmentSlot = '-';

  try {
    if (fhirAppt.start) {
      appointmentDate = formatDateFromIsoString(fhirAppt.start);

      if (appointmentDate !== '-') {
        const startTime = formatTimeFromIsoString(fhirAppt.start);
        let endTime = startTime;

        if (fhirAppt.end) {
          endTime = formatTimeFromIsoString(fhirAppt.end);
        }

        appointmentSlot = `${startTime} - ${endTime}`;
      }
    }
  } catch {
    appointmentDate = '-';
    appointmentSlot = '-';
  }

  const serviceName = fhirAppt.serviceType?.[0]?.text ?? '-';
  const providerName = practitionerParticipant
    ? practitionerParticipant.display
    : '-';

  return {
    id: fhirAppt.id!,
    uuid: fhirAppt.id!,
    appointmentNumber,
    appointmentDate,
    appointmentSlot,
    service: serviceName,
    reason,
    status: fhirAppt.status,
    provider: providerName,
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

export const transformFhirAppointmentToFormatted = (
  fhirAppt: FhirAppointment,
): FormattedAppointment => transformFhirAppointmentInternal(fhirAppt);
