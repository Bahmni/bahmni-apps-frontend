import axios, { AxiosResponse, AxiosError, AxiosInstance } from 'axios';
import { hostUrl, loginPath } from '@constants/app';
import { notificationService } from './notificationService';

const client: AxiosInstance = axios.create({ baseURL: hostUrl });
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
    if (axios.isAxiosError(error) && error.response?.status === 401) {
      window.location.href = loginPath;
      return Promise.reject(error);
    }
    const { title, message } = getErrorDetails(error);
    notificationService.showError(title, message);
    return Promise.reject(error);
  },
);

// TODO: Add i18n support
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

      if (status === 400) {
        title = 'Bad Request';
        message =
          'Invalid input parameters. Please check your request and try again.';
      } else if (status === 403) {
        title = 'Authorization Error';
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
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
