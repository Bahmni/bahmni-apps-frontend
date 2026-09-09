export const BAHMNI_APPOINTMENTS_NAMESPACE = 'appointments';
export const APPOINTMENTS_V2_CONFIG_BASE_URL =
  '/bahmni_config/openmrs/apps/appointments/v2';

const APP_BASE = '/appointments';

export const PATHS = {
  HOME: APP_BASE,
  ADMIN_SERVICES: `${APP_BASE}/admin/services`,
  ADMIN_ADD_SERVICE: `${APP_BASE}/admin/services/add`,
};

export const MANAGE_APPOINTMENT_SERVICES_PRIVILEGE =
  'app:appointments:manageServices';
// Privilege name used by the pre-React appointments app. Existing installs carry it on
// roles such as Appointments:FullAccess and were never granted the app: variant, so
// either name must grant access.
export const MANAGE_APPOINTMENT_SERVICES_PRIVILEGE_LEGACY =
  'Manage Appointment Services';
export const MANAGE_APPOINTMENT_SERVICES_PRIVILEGE_ALIASES = [
  MANAGE_APPOINTMENT_SERVICES_PRIVILEGE,
  MANAGE_APPOINTMENT_SERVICES_PRIVILEGE_LEGACY,
];
export const ADMIN_TAB_PRIVILEGE = 'app:appointments:adminTab';
