import i18next from 'i18next';

/**
 * Configuration-related error messages
 * Used for consistent error handling across the application
 */
export const CONFIG_ERROR_MESSAGES = {
  VALIDATION_FAILED: 'Configuration validation failed',
  NO_DASHBOARDS: 'No dashboards found in configuration',
  DEPARTMENT_FETCH_FAILED: (name: string) =>
    `Failed to load ${name} configuration`,
  INVALID_CONFIG: 'Invalid configuration format',
  SCHEMA_VALIDATION_FAILED: 'Configuration does not match required schema',
} as const;

/**
 * Error title constants for notifications
 */
export const ERROR_TITLES = {
  CONFIG_ERROR: 'Configuration Error',
  VALIDATION_ERROR: 'Validation Error',
  DEPARTMENT_ERROR: 'Department Configuration Error',
} as const;

export const DATE_ERROR_MESSAGES = {
  PARSE_ERROR: i18next.t('DATE_ERROR_PARSE'),
  FORMAT_ERROR: i18next.t('DATE_ERROR_FORMAT'),
  EMPTY_OR_INVALID: i18next.t('DATE_ERROR_EMPTY_OR_INVALID'),
  INVALID_FORMAT: i18next.t('DATE_ERROR_INVALID_FORMAT'),
  NULL_OR_UNDEFINED: i18next.t('DATE_ERROR_NULL_OR_UNDEFINED'),
} as const;
