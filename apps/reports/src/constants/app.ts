export const BAHMNI_REPORTS_NAMESPACE = 'reports';

export const REPORTS_PRIVILEGE = 'app:reports';

// Absolute, app-prefixed paths used for in-app navigation (this app has no
// Router of its own; it is mounted under `/reports/*` by the distro shell).
export const REPORTS_TAB_PATH = '/reports/';
export const MY_REPORTS_TAB_PATH = '/reports/my-reports';

export const REPORTS_JSON_CONFIG_URL =
  '/bahmni_config/openmrs/apps/reports/reports.json';
export const REPORTS_APP_CONFIG_URL =
  '/bahmni_config/openmrs/apps/reports/app.json';
