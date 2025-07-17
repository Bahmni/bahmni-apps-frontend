import { GLOBAL_PROPERTY_URL } from '@constants/app';
import { get } from './api';

// The API returns the raw value directly, not wrapped in an object
type GlobalPropertyResponse = string | boolean | number;

// Cache for global properties
const globalPropertyCache = new Map<string, string | null>();

/**
 * Get global property value from OpenMRS
 * @param property - The global property name
 * @returns Promise<string | null>
 */
export const getGlobalProperty = async (
  property: string,
): Promise<string | null> => {
  // try {
  if (globalPropertyCache.has(property)) {
    return globalPropertyCache.get(property) ?? null;
  }
  const response = await get<GlobalPropertyResponse>(
    GLOBAL_PROPERTY_URL(property),
  );

  // The API returns the raw value directly, not wrapped in an object
  const value = response ? String(response) : null;
  globalPropertyCache.set(property, value);
  return value;
  //  TODO: handle specific error cases when fetching global property fails
  // } catch (error) {
  //   // eslint-disable-next-line no-console
  //   console.error(
  //     i18next.t('GLOBAL_PROPERTY_FETCH_FAILED', {
  //       property,
  //     }),
  //     error,
  //   );
  //   return null;
  // }
};
