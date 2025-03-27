import axios, { AxiosResponse, AxiosInstance } from 'axios';
import { loginPath } from '@constants/app';
import { getFormattedError } from '@utils/common';
import { notificationService } from './notificationService';

const client: AxiosInstance = axios.create();
client.defaults.headers.common['Content-Type'] = 'application/json';

// Request interceptor
client.interceptors.request.use(
  function (config) {
    return config;
  },
  function (error) {
    const { title, message } = getFormattedError(error);
    notificationService.showError(title, message);
    return Promise.reject(error);
  },
);

// Response interceptor
client.interceptors.response.use(
  function (response) {
    return response;
  },
  function (error) {
    if (axios.isAxiosError(error) && error.response?.status === 401) {
      window.location.href = loginPath;
      return Promise.reject(error);
    }
    const { title, message } = getFormattedError(error);
    notificationService.showError(title, message);
    return Promise.reject(error);
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

export default client;
