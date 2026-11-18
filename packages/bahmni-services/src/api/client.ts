import axios, { AxiosInstance } from 'axios';
import { getFormattedError } from '../errorHandling';
import { BINARY_RESPONSE_TYPES, LOGIN_PATH } from './constants';
import {
  decodeHtmlEntities,
  isOpenMRSWebServiceApi,
  isTemplateServiceApi,
  getResponseUrl,
} from './utils';

const client: AxiosInstance = axios.create();

// Request interceptor
client.interceptors.request.use(
  function (config) {
    return config;
  },
  function (error) {
    const { message } = getFormattedError(error);
    throw new Error(message);
  },
);

// Response interceptor
client.interceptors.response.use(
  function (response) {
    try {
      const url = getResponseUrl(response.config);
      if (
        isOpenMRSWebServiceApi(url) &&
        !isTemplateServiceApi(url) &&
        !BINARY_RESPONSE_TYPES.includes(response.config.responseType as string)
      ) {
        response.data = decodeHtmlEntities(response.data);
      }
      return response;
    } catch (error) {
      const { message } = getFormattedError(error);
      throw new Error(message);
    }
  },
  async function (error) {
    if (axios.isAxiosError(error) && error.response?.status === 401) {
      globalThis.location.href = LOGIN_PATH;
      throw error;
    }
    if (axios.isAxiosError(error) && error.response?.data instanceof Blob) {
      try {
        const text = await (error.response.data as Blob).text();
        error.response.data = JSON.parse(text);
      } catch {
        // leave as blob if unparseable
      }
    }
    const { message } = getFormattedError(error);
    // Keep the original error so callers that need the HTTP status (for
    // example to tell a validation failure from an outage) can still read it.
    throw new Error(message, { cause: error });
  },
);

export default client;
