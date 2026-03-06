import Ajv from 'ajv';
import { get } from '../api';
import { ERROR_MESSAGES } from './constants';

/**
 * Fetches and validates configuration from a URL against a JSON schema.
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
