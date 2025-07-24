import axios, { AxiosResponse, AxiosInstance } from 'axios';
import { LOGIN_PATH } from './constants';
import {
  getFormattedError,
  decodeHtmlEntities,
  isOpenMRSWebServiceApi,
  getResponseUrl
} from './utils';

const client: AxiosInstance = axios.create();
client.defaults.headers.common['Content-Type'] = 'application/json';

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
