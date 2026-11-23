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

/** CSV uploads larger than this (50 MB) show a progress bar; smaller ones finish almost instantly. */
export const PROGRESS_INDICATOR_MIN_FILE_SIZE_BYTES = 50 * 1024 * 1024;

/** Privilege that lets a user request a (always anonymised) FHIR export. */
export const FHIR_EXPORT_PRIVILEGE = 'Export Patient Data';

/** Privilege that additionally lets a user turn anonymisation off. */
export const FHIR_EXPORT_PLAIN_PRIVILEGE = 'Export Non Anonymised Patient Data';

/** Refresh interval for the FHIR export task list while a task is in progress. */
export const FHIR_EXPORT_REFRESH_INTERVAL_MS = 30 * 1000;
