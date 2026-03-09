import {
  APPOINTMENT_STATUSES,
  camelToScreamingSnakeCase,
} from '@bahmni/services';
import styles from './styles/AppointmentsTable.module.scss';

export const APPOINTMENT_STATUS_STYLES_MAP: Record<string, string> = {
  [APPOINTMENT_STATUSES.PROPOSED]: styles.proposedStatus,
  [APPOINTMENT_STATUSES.PENDING]: styles.pendingStatus,
  [APPOINTMENT_STATUSES.BOOKED]: styles.bookedStatus,
  [APPOINTMENT_STATUSES.ARRIVED]: styles.arrivedStatus,
  [APPOINTMENT_STATUSES.FULFILLED]: styles.fulfilledStatus,
  [APPOINTMENT_STATUSES.CANCELLED]: styles.cancelledStatus,
  [APPOINTMENT_STATUSES.NOSHOW]: styles.noshowStatus,
  [APPOINTMENT_STATUSES.CHECKED_IN]: styles.checkedInStatus,
  [APPOINTMENT_STATUSES.WAITLIST]: styles.waitlistStatus,
  [APPOINTMENT_STATUSES.ENTERED_IN_ERROR]: styles.enteredInErrorStatus,
};

export const getAppointmentStatusKey = (status: string): string => {
  if (!status) return 'APPOINTMENTS_STATUS_UNKNOWN';
  // Replace hyphens with underscores for FHIR statuses like 'checked-in'
  return `APPOINTMENTS_STATUS_${camelToScreamingSnakeCase(status)}`;
};

export const FIELD_TRANSLATION_MAP: Record<string, string> = {
  appointmentNumber: 'APPOINTMENTS_NUMBER',
  service: 'APPOINTMENTS_SERVICE',
  reason: 'APPOINTMENTS_REASON',
  appointmentDate: 'APPOINTMENTS_DATE',
  appointmentSlot: 'APPOINTMENTS_SLOT',
  status: 'APPOINTMENTS_STATUS',
  provider: 'APPOINTMENTS_PROVIDER',
};

export const DEFAULT_FIELDS = [
  'appointmentNumber',
  'service',
  'reason',
  'appointmentDate',
  'appointmentSlot',
  'status',
  'provider',
];
