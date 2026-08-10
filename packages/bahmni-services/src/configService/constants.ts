export const ORDERS_CONFIG_BASE_URL = '/bahmni_config/openmrs/apps/orders/v2';
export const ORDERS_CONFIG_URL = ORDERS_CONFIG_BASE_URL + '/extension.json';
export const ORDERS_TABLE_CONFIG_URL = ORDERS_CONFIG_BASE_URL + '/app.json';

/**
 * Configuration-related error messages
 * Used for consistent error handling across the application
 */
export const ERROR_MESSAGES = {
  CONFIG_NOT_FOUND: 'CONFIG_ERROR_NOT_FOUND',
  VALIDATION_FAILED: 'CONFIG_ERROR_VALIDATION_FAILED',
  SCHEMA_VALIDATION_FAILED: 'CONFIG_ERROR_SCHEMA_VALIDATION_FAILED',
};
