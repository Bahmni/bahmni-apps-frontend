import axios, { AxiosError, AxiosRequestConfig } from 'axios';
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

/**
 * Formats error messages from different sources
 * @param error - The error to format
 * @returns {title: string, message: string} - The formatted error
 */
export const getFormattedError = (
  error: unknown,
): { title: string; message: string } => {
  // Default error title and message
  let title = 'Error';
  let message = 'An unexpected error occurred';

  if (!error) {
    return { title, message };
  }

  if (typeof error === 'string') {
    message = error;
  } else if (axios.isAxiosError(error)) {
    const axiosError = error as AxiosError;

    if (axiosError?.response) {
      const status = axiosError.response.status;
      switch (status) {
        case 400:
          title = 'Bad Request';
          message =
            'Invalid input parameters. Please check your request and try again.';
          break;
        case 401:
          title = 'Unauthorized';
          message =
            'You are not authorized to perform this action. Please log in again.';
          break;
        case 403:
          title = 'Unauthorized';
          message =
            'You are not authorized to perform this action. Please log in again.';
          break;
        case 404:
          title = 'Not Found';
          message = 'The requested resource was not found.';
          break;
        case 500:
        case 502:
        case 503:
        case 504:
          title = 'Server Error';
          message = 'The server encountered an error. Please try again later.';
          break;
        default: {
          title = 'Error';
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const responseData = axiosError.response.data as Record<string, any>;
          message =
            responseData?.message ??
            axiosError.message ??
            'An unknown error occurred';
        }
      }
    } else if (error instanceof Error) {
      message = error.message;
    } else {
      title = 'Network Error';
      message =
        'Unable to connect to the server. Please check your internet connection.';
    }
  } else if (error instanceof Error) {
    message = error.message;
  } else {
    message = 'An unknown error occurred';
  }

  return { title, message };
};
