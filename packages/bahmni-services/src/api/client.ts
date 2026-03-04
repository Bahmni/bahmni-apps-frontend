import axios, { AxiosInstance } from 'axios';
import { getFormattedError } from '../errorHandling';
import { LOGIN_PATH } from './constants';
import {
  decodeHtmlEntities,
  isOpenMRSWebServiceApi,
  getResponseUrl,
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

    // If message is a translation key (starts with ERROR_ or other uppercase patterns),
    // return just the key without wrapping it with the title
    if (message.startsWith('ERROR_') || /^[A-Z_]+$/.test(message)) {
      return Promise.reject(new Error(message));
    }

    return Promise.reject(`${title}: ${message}`);
  },
);

export default client;
