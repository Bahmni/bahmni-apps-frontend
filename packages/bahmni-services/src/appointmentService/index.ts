export {
  searchAppointmentsByAttribute,
  updateAppointmentStatus,
  getAppointmentById,
  getUpcomingAppointments,
  getPastAppointments,
  getUpcomingAppointmentsPage,
  getPastAppointmentsPage,
  getAllAppointmentServices,
  deleteAppointmentService,
  getAppointmentUnavailabilities,
  createAppointmentUnavailability,
} from './appointmentService';
export {
  type AppointmentPage,
  type AppointmentService,
  type AppointmentUnavailability,
  type CreateUnavailabilityRequest,
} from './models';
export {
  APPOINTMENT_STATUSES,
  APPOINTMENT_IDENTIFIER_SYSTEM,
} from './constants';
