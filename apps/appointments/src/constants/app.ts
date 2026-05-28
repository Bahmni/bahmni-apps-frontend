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
export const ADMIN_TAB_PRIVILEGE = 'app:appointments:adminTab';
