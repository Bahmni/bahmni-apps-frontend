import Ajv from 'ajv';
import {
  CLINICAL_CONFIG_URL,
  DASHBOARD_CONFIG_URL,
  MEDICATIONS_CONFIG_URL,
} from './constants';
import { ERROR_MESSAGES, ERROR_TITLES } from './constants';
import clinicalConfigSchema from './schemas/clinicalConfig.schema.json';
import dashboardConfigSchema from './schemas/dashboardConfig.schema.json';
import medicationConfigSchema from './schemas/medicationConfig.schema.json';
import { ClinicalConfig, DashboardConfig, MedicationJSONConfig } from './models';
import { generateId } from '../utils';
import { getFormattedError } from '../errorHandling';
import { get } from '../api';
import { notificationService } from '../notification';
import i18next from 'i18next';

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
 * Fetches and validates configuration from the server
 *
 * @param configPath - URL path to fetch the configuration
 * @param configSchema - JSON schema for validation
 * @returns Validated configuration object or null if invalid/error
 * @throws Error if fetch fails or validation fails
 */
const getConfig = async <
  T extends ClinicalConfig | DashboardConfig | MedicationJSONConfig,
>(
  configPath: string,
  configSchema: Record<string, unknown>,
): Promise<T | null> => {
  try {
    // Fetch configuration from server
    const config = await fetchConfig<T>(configPath);
    if (!config) {
      notificationService.showError(
        i18next.t(ERROR_TITLES.CONFIG_ERROR),
        i18next.t(ERROR_MESSAGES.CONFIG_NOT_FOUND),
      );
      return null;
    }

    // Validate configuration against schema
    const isValid = await validateConfig(config, configSchema);
    if (!isValid) {
      notificationService.showError(
        i18next.t(ERROR_TITLES.VALIDATION_ERROR),
        i18next.t(ERROR_MESSAGES.VALIDATION_FAILED),
      );
      return null;
    }

    return config;
  } catch (error) {
    const { title, message } = getFormattedError(error);
    notificationService.showError(title, message);
    return null;
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
