import Ajv from 'ajv';
import { get } from '../api';
import { getFormattedError } from '../errorHandling';
import { notificationService } from '../notification';
import { generateId } from '../utils';
import {
  CLINICAL_CONFIG_URL,
  DASHBOARD_CONFIG_URL,
  MEDICATIONS_CONFIG_URL,
  REGISTRATION_CONFIG_URL,
  ORDERS_CONFIG_URL,
  ORDERS_TABLE_CONFIG_URL,
  ERROR_MESSAGES,
  ERROR_TITLES,
} from './constants';
import {
  ClinicalConfig,
  DashboardConfig,
  MedicationJSONConfig,
  RegistrationConfig,
} from './models';
import { OrdersConfig } from './models/ordersConfig';
import { OrdersTableConfig } from './models/ordersTableConfig';
import clinicalConfigSchema from './schemas/clinicalConfig.schema.json';
import dashboardConfigSchema from './schemas/dashboardConfig.schema.json';
import medicationConfigSchema from './schemas/medicationConfig.schema.json';
import ordersConfigSchema from './schemas/ordersConfig.schema.json';
import ordersTableConfigSchema from './schemas/ordersTableConfig.schema.json';
import registrationConfigSchema from './schemas/registrationConfig.schema.json';

/**
 * Fetches and validates clinical app configuration from the server
 *
 * @returns Validated configuration object or null if invalid/error
 * @throws Error if fetch fails or validation fails
 */
export const getClinicalConfig = async <
  T extends ClinicalConfig,
>(): Promise<T | null> => {
  return getConfig<T>(CLINICAL_CONFIG_URL, clinicalConfigSchema);
};

/**
 * Fetches and validates dashboard configuration from the server
 *
 * @param dashboardURL - URL path to fetch the dashboard configuration
 * @returns Validated configuration object or null if invalid/error
 * @throws Error if fetch fails or validation fails
 */
export const getDashboardConfig = async <T extends DashboardConfig>(
  dashboardURL: string,
): Promise<T | null> => {
  const config = await getConfig<T>(
    DASHBOARD_CONFIG_URL(dashboardURL),
    dashboardConfigSchema,
  );

  if (config && config.sections && config.sections.length > 0) {
    config.sections = config.sections.map((section) => {
      if (!section.id) {
        return {
          ...section,
          id: generateId(),
        };
      }
      return section;
    });
  }

  return config;
};

/**
 * Fetches and validates medication configuration from the server
 *
 * @returns Validated medication configuration object or null if invalid/error
 * @throws Error if fetch fails or validation fails
 */
export const getMedicationConfig =
  async (): Promise<MedicationJSONConfig | null> => {
    return getConfig<MedicationJSONConfig>(
      MEDICATIONS_CONFIG_URL,
      medicationConfigSchema,
    );
  };

/**
 * Fetches and validates registration configuration from the server
 *
 * @returns Validated registration configuration object or null if invalid/error
 * @throws Error if fetch fails or validation fails
 */
export const getRegistrationConfig =
  async (): Promise<RegistrationConfig | null> => {
    return getConfig<RegistrationConfig>(
      REGISTRATION_CONFIG_URL,
      registrationConfigSchema,
    );
  };

/**
 * Fetches and validates orders extension configuration from the server
 *
 * @returns Validated orders configuration object or null if invalid/error
 * @throws Error if fetch fails or validation fails
 */
export const getOrdersConfig = async (): Promise<OrdersConfig | null> => {
  return getConfig<OrdersConfig>(ORDERS_CONFIG_URL, ordersConfigSchema);
};

/**
 * Fetches and validates orders table configuration from the server
 *
 * @returns Validated orders table configuration object or null if invalid/error
 * @throws Error if fetch fails or validation fails
 */
export const getOrdersTableConfig =
  async (): Promise<OrdersTableConfig | null> => {
    try {
      // Fetch the full app.json
      const appConfig = await fetchConfig<{
        config: OrdersTableConfig;
      }>(ORDERS_TABLE_CONFIG_URL);

      if (!appConfig?.config) {
        return null;
      }

      // Extract the table config from the nested config property
      const tableConfig = appConfig.config;

      // Validate the extracted config
      const isValid = await validateConfig(
        tableConfig,
        ordersTableConfigSchema,
      );
      if (!isValid) {
        return null;
      }

      return tableConfig;
    } catch {
      return null;
    }
  };

/**
 * Fetches and validates configuration from the server
 *
 * @param configPath - URL path to fetch the configuration
 * @param configSchema - JSON schema for validation
 * @returns Validated configuration object
 *
 * @example
 * const config = await getConfig<MyConfig>(url, schema);
 */
export const getConfig = async <T>(
  configPath: string,
  configSchema: Record<string, unknown>,
): Promise<T> => {
  const config = await fetchConfig<T>(configPath);
  if (!config) {
    throw new Error(ERROR_MESSAGES.CONFIG_NOT_FOUND);
  }

  const isValid = await validateConfig(config, configSchema);
  if (!isValid) {
    throw new Error(ERROR_MESSAGES.VALIDATION_FAILED);
  }

  return config;
};

const fetchConfig = async <T>(configPath: string): Promise<T | null> => {
  return await get<T>(configPath);
};

const validateConfig = async (
  config: unknown,
  configSchema: Record<string, unknown>,
): Promise<boolean> => {
  const ajv = new Ajv();
  const validate = ajv.compile(configSchema);
  return validate(config);
};
