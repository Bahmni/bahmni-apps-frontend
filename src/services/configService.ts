import { get } from './api';
import Ajv from 'ajv';
import { CONFIG_ERROR_MESSAGES } from '@constants/errors';
import { ClinicalConfig } from '@types/config';
import { getFormattedError } from '@utils/common';

/**
 * Fetches and validates configuration from the server
 *
 * @param configPath - URL path to fetch the configuration
 * @param configSchema - JSON schema for validation
 * @returns Validated configuration object or null if invalid/error
 * @throws Error if fetch fails or validation fails
 */
export const getConfig = async <T extends ClinicalConfig>(
  configPath: string,
  configSchema: Record<string, unknown>,
): Promise<T | null> => {
  try {
    // Fetch configuration from server
    const config = await fetchConfig<T>(configPath);
    if (!config) {
      throw new Error(CONFIG_ERROR_MESSAGES.CONFIG_NOT_FOUND);
    }

    // Validate configuration against schema
    const isValid = await validateConfig(config, configSchema);
    if (!isValid) {
      throw new Error(CONFIG_ERROR_MESSAGES.SCHEMA_VALIDATION_FAILED);
    }

    return config;
  } catch (error) {
    // Log error for debugging purposes
    const { message } = getFormattedError(error);
    throw new Error(message);
  }
};

/**
 * Fetches raw configuration data from the server
 *
 * @param configPath - URL path to fetch the configuration
 * @returns Configuration object or null if fetch fails
 * @throws Error if network request fails
 */
const fetchConfig = async <T>(configPath: string): Promise<T | null> => {
  try {
    const config = await get<T>(configPath);
    return config;
  } catch (error) {
    const { message } = getFormattedError(error);
    throw new Error(message);
  }
};

/**
 * Validates configuration against provided JSON schema
 *
 * @param config - Configuration object to validate
 * @param configSchema - JSON schema to validate against
 * @returns Boolean indicating if configuration is valid
 */
const validateConfig = async (
  config: unknown,
  configSchema: Record<string, unknown>,
): Promise<boolean> => {
  const ajv = new Ajv();
  const validate = ajv.compile(configSchema);
  return validate(config);
};
