import { BAHMNI_APP_BASE_PATH } from '@bahmni/services';

export const BAHMNI_ADMIN_NAMESPACE = 'admin';

export const ADMIN_PRIVILEGE = 'app:admin';

/** Path to the admin home (dashboard). */
export const BAHMNI_ADMIN_HOME_PATH = `${BAHMNI_APP_BASE_PATH}/admin`;

/** Extension point the admin dashboard tiles are configured under. */
export const ADMIN_EXTENSION_POINT = 'org.bahmni.admin.dashboard';

/** Config directory under /bahmni_config/openmrs/apps that holds those tiles. */
export const ADMIN_CONFIG_APP = 'admin';

/** Number of audit log events per page; a full page means more may follow. */
export const AUDIT_LOG_PAGE_SIZE = 50;
