import { BAHMNI_APP_BASE_PATH } from '@bahmni/services';

export const BAHMNI_APPOINTMENTS_NAMESPACE = 'appointments';
export const APPOINTMENTS_V2_CONFIG_BASE_URL =
  '/bahmni_config/openmrs/apps/appointments/v2';

export const APPOINTMENTS_PRIVILEGE = 'app:appointments';

export const APPOINTMENTS_INDEX_PATH = '/';
export const APPOINTMENTS_MANAGE_PATH = '/manage';
export const APPOINTMENTS_NEW_PATH = '/new';
export const APPOINTMENTS_EDIT_PATH = '/edit/:appointmentUuid';

// Breadcrumb hrefs are plain anchors, so they need the full app-prefixed path.
// A bare '/appointments' would navigate out to legacy Bahmni.
export const APPOINTMENTS_APP_HREF = `${BAHMNI_APP_BASE_PATH}/appointments/`;
