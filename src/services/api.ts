import axios, { AxiosResponse, AxiosError } from 'axios';
import { hostUrl } from '../constants/app';
import { notificationService } from './notificationService';

const client = axios.create({ baseURL: hostUrl });
client.defaults.headers.common['Content-Type'] = 'application/json';

// Request interceptor
client.interceptors.request.use(
  function (config) {
    return config;
  },
  function (error) {
    const { title, message } = getErrorDetails(error);
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
    const { title, message } = getErrorDetails(error);
    notificationService.showError(title, message);
    return Promise.reject(error);
  },
);

// Helper function to categorize and format error messages
export const getErrorDetails = (
  error: unknown,
): { title: string; message: string } => {
  // Default error message
  let title = 'Error';
  let message = 'An unexpected error occurred';

  if (axios.isAxiosError(error)) {
    const axiosError = error as AxiosError;

    // Handle different HTTP status codes
    if (axiosError.response) {
      const status = axiosError.response.status;

      if (status === 401 || status === 403) {
        title = 'Authentication Error';
        message =
          'You are not authorized to perform this action. Please log in again.';
      } else if (status === 404) {
        title = 'Not Found';
        message = 'The requested resource was not found.';
      } else if (status >= 500) {
        title = 'Server Error';
        message = 'The server encountered an error. Please try again later.';
      } else {
        title = 'Request Error';
        const responseData = axiosError.response.data as Record<string, any>;
        message =
          responseData?.message ||
          axiosError.message ||
          'Error processing your request';
      }
    } else if (axiosError.request) {
      title = 'Network Error';
      message =
        'Unable to connect to the server. Please check your internet connection.';
    } else {
      title = 'Request Error';
      message = axiosError.message || 'Error setting up the request';
    }
  } else if (error instanceof Error) {
    title = error.name || 'Error';
    message = error.message;
  } else if (typeof error === 'string') {
    message = error;
  }

  return { title, message };
};

export const get = async <T>(url: string): Promise<T> => {
  const response: AxiosResponse<T> = await client.get(url);
  return response.data;
};

export const post = async <T>(url: string, data: any): Promise<T> => {
  const response: AxiosResponse<T> = await client.post(url, data);
  return response.data;
};

export const put = async <T>(url: string, data: any): Promise<T> => {
  const response: AxiosResponse<T> = await client.put(url, data);
  return response.data;
};

export const del = async <T>(url: string): Promise<T> => {
  const response: AxiosResponse<T> = await client.delete(url);
  return response.data;
};

export default client;
