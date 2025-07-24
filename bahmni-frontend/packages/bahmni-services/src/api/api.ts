import axios, { AxiosResponse, AxiosInstance, AxiosRequestConfig } from 'axios';
import { decode } from 'html-entities';
import { LOGIN_PATH } from './constants';
import { getFormattedError } from './utils';

const client: AxiosInstance = axios.create();
client.defaults.headers.common['Content-Type'] = 'application/json';

/**
 * Recursively decodes HTML entities in response data
 * @param data - The data to decode
 * @returns The decoded data
 */
const decodeHtmlEntities = (data: unknown): unknown => {
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
const isOpenMRSWebServiceApi = (url: string): boolean => {
  return url.includes('/openmrs/ws');
};

/**
 * Gets the URL from axios config safely
 * @param config - Axios request config
 * @returns The URL or empty string if not found
 */
const getResponseUrl = (config: AxiosRequestConfig): string => {
  return config.url ?? config.baseURL ?? '';
};

// Request interceptor
client.interceptors.request.use(
  function (config) {
    return config;
  },
  function (error) {
    const { title, message } = getFormattedError(error);
    return Promise.reject(`${title}: ${message}`);
  },
);

// Response interceptor
client.interceptors.response.use(
  function (response) {
    try {
      const url = getResponseUrl(response.config);
      if (isOpenMRSWebServiceApi(url)) {
        response.data = decodeHtmlEntities(response.data);
      }
      return response;
    } catch (error) {
      const { title, message } = getFormattedError(error);
      return Promise.reject(`${title}: ${message}`);
    }
  },
  function (error) {
    if (axios.isAxiosError(error) && error.response?.status === 401) {
      window.location.href = LOGIN_PATH;
      return Promise.reject(error);
    }
    const { title, message } = getFormattedError(error);
    return Promise.reject(`${title}: ${message}`);
  },
);

export const get = async <T>(url: string): Promise<T> => {
  const response: AxiosResponse<T> = await client.get(url);
  return response.data;
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const post = async <T>(url: string, data: any): Promise<T> => {
  const response: AxiosResponse<T> = await client.post(url, data);
  return response.data;
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const put = async <T>(url: string, data: any): Promise<T> => {
  const response: AxiosResponse<T> = await client.put(url, data);
  return response.data;
};

export const del = async <T>(url: string): Promise<T> => {
  const response: AxiosResponse<T> = await client.delete(url);
  return response.data;
};

// Export internal functions for testing
export { decodeHtmlEntities, isOpenMRSWebServiceApi, getResponseUrl };

export default client;
