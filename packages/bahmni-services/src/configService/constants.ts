export const CLINICAL_V2_CONFIG_BASE_URL =
  '/bahmni_config/openmrs/apps/clinical/v2';

export const REGISTRATION_CONFIG_BASE_URL =
  '/bahmni_config/openmrs/apps/registration/v2';

export const CONFIG_TRANSLATIONS_URL_TEMPLATE = (lang: string) =>
  `/bahmni_config/openmrs/i18n/clinical/locale_${lang}.json`;
export const CLINICAL_CONFIG_URL = CLINICAL_V2_CONFIG_BASE_URL + '/app.json';
export const REGISTRATION_CONFIG_URL =
  REGISTRATION_CONFIG_BASE_URL + '/app.json';
export const MEDICATIONS_CONFIG_URL =
  CLINICAL_V2_CONFIG_BASE_URL + '/medication.json';
export const DASHBOARD_CONFIG_URL = (dashboardURL: string) =>
  `${CLINICAL_V2_CONFIG_BASE_URL}/dashboards/${dashboardURL}`;

/**
 * Configuration-related error messages
 * Used for consistent error handling across the application
 */
export const ERROR_MESSAGES = {
  CONFIG_NOT_FOUND: 'CONFIG_ERROR_NOT_FOUND',
  VALIDATION_FAILED: 'CONFIG_ERROR_VALIDATION_FAILED',
  SCHEMA_VALIDATION_FAILED: 'CONFIG_ERROR_SCHEMA_VALIDATION_FAILED',
};

export const ERROR_TITLES = {
  CONFIG_ERROR: 'ERROR_CONFIG_TITLE',
  VALIDATION_ERROR: 'ERROR_VALIDATION_TITLE',
  DASHBOARD_ERROR: 'ERROR_DASHBOARD_CONFIG_TITLE',
};
