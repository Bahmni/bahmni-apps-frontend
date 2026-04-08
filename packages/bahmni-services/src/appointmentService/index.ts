export {
  searchAppointmentsByAttribute,
  updateAppointmentStatus,
  getAppointmentById,
  getUpcomingAppointments,
  getPastAppointments,
  getAllAppointmentServices,
  deleteAppointmentService,
} from './appointmentService';
export { type AppointmentService } from './models';
export {
  APPOINTMENT_STATUSES,
  APPOINTMENT_IDENTIFIER_SYSTEM,
} from './constants';
