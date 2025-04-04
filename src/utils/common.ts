import axios, { AxiosError } from 'axios';

// TODO: Add i18n support
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
          title = 'Authorization Error';
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
          title = 'Request Error';
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const responseData = axiosError.response.data as Record<string, any>;
          message =
            responseData?.message ||
            axiosError.message ||
            'Error processing your request';
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

/**
 * Generates a random ID
 * @returns {string} A random ID
 */
export const generateId = () => Math.random().toString(36).substring(2, 9);
