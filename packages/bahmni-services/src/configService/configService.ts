import Ajv from 'ajv';
import { get } from '../api';
import {
  ORDERS_CONFIG_URL,
  ORDERS_TABLE_CONFIG_URL,
  ERROR_MESSAGES,
} from './constants';
import { OrdersConfig } from './models/ordersConfig';
import { OrdersTableConfig } from './models/ordersTableConfig';
import ordersConfigSchema from './schemas/ordersConfig.schema.json';
import ordersTableConfigSchema from './schemas/ordersTableConfig.schema.json';

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
