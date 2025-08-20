import { AxiosRequestConfig } from 'axios';
import { decode } from 'html-entities';

/**
 * Recursively decodes HTML entities in response data
 * @param data - The data to decode
 * @returns The decoded data
 */
export const decodeHtmlEntities = (data: unknown): unknown => {
  if (typeof data === 'string') {
    return decode(data);
  }

  if (Array.isArray(data)) {
    return data.map((item) => decodeHtmlEntities(item));
  }

  if (data && typeof data === 'object' && data !== null) {
    const decoded: { [key: string]: unknown } = {};
    for (const [key, value] of Object.entries(data)) {
      decoded[key] = decodeHtmlEntities(value);
    }
    return decoded;
  }
  return data;
};

/**
 * Checks if URL matches OpenMRS Web Service REST API pattern
 * @param url - The URL to check
 * @returns True if URL is OpenMRS Web Service REST API
 */
export const isOpenMRSWebServiceApi = (url: string): boolean => {
  return url.includes('/openmrs/ws');
};

/**
 * Gets the URL from axios config safely
 * @param config - Axios request config
 * @returns The URL or empty string if not found
 */
export const getResponseUrl = (config: AxiosRequestConfig): string => {
  return config.url ?? config.baseURL ?? '';
};
