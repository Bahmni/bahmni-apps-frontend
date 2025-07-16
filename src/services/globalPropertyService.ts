import i18next from 'i18next';
import { GLOBAL_PROPERTY_URL } from '@constants/app';
import { AUDIT_LOG_GLOBAL_PROPERTY } from '@constants/auditLog';
import { AUDIT_LOG_ERROR_MESSAGES } from '@constants/errors';
import { get } from './api';

// The API returns the raw value directly, not wrapped in an object
type GlobalPropertyResponse = string | boolean | number;

// Cache for global properties
const globalPropertyCache = new Map<string, string | null>();

export const clearGlobalPropertyCache = () => {
  globalPropertyCache.clear();
};

/**
 * Get global property value from OpenMRS
 * @param property - The global property name
 * @returns Promise<string | null>
 */
export const getGlobalProperty = async (
  property: string,
): Promise<string | null> => {
  try {
    if (globalPropertyCache.has(property)) {
      return globalPropertyCache.get(property) ?? null;
    }
    const response = await get<GlobalPropertyResponse>(
      `${GLOBAL_PROPERTY_URL}?property=${property}`,
    );

    // The API returns the raw value directly, not wrapped in an object
    const value = response ? String(response) : null;
    globalPropertyCache.set(property, value);
    return value;
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error(
      i18next.t(AUDIT_LOG_ERROR_MESSAGES.GLOBAL_PROPERTY_FETCH_FAILED, {
        property,
      }),
      error,
    );
    return null;
  }
};

/**
 * Check if audit logging is enabled
 * @returns Promise<boolean>
 */
export const isAuditLogEnabled = async (): Promise<boolean> => {
  try {
    const value = await getGlobalProperty(AUDIT_LOG_GLOBAL_PROPERTY);
    return value === 'true';
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error(
      i18next.t(AUDIT_LOG_ERROR_MESSAGES.STATUS_CHECK_FAILED),
      error,
    );
    return false;
  }
};
