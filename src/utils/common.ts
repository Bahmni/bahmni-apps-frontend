import axios, { AxiosError } from 'axios';
import i18next from 'i18next';

/**
 * Formats error messages from different sources
 * @param error - The error to format
 * @returns {title: string, message: string} - The formatted error
 */
export const getFormattedError = (
  error: unknown,
): { title: string; message: string } => {
  // Default error title and message
  let title = i18next.t('ERROR_DEFAULT_TITLE');
  let message = i18next.t('ERROR_DEFAULT_MESSAGE');

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
          title = i18next.t('ERROR_BAD_REQUEST_TITLE');
          message = i18next.t('ERROR_BAD_REQUEST_MESSAGE');
          break;
        case 401:
          title = i18next.t('ERROR_UNAUTHORIZED_TITLE');
          message = i18next.t('ERROR_UNAUTHORIZED_MESSAGE');
          break;
        case 403:
          title = i18next.t('ERROR_UNAUTHORIZED_TITLE');
          message = i18next.t('ERROR_UNAUTHORIZED_MESSAGE');
          break;
        case 404:
          title = i18next.t('ERROR_NOT_FOUND_TITLE');
          message = i18next.t('ERROR_NOT_FOUND_MESSAGE');
          break;
        case 500:
        case 502:
        case 503:
        case 504:
          title = i18next.t('ERROR_SERVER_TITLE');
          message = i18next.t('ERROR_SERVER_MESSAGE');
          break;
        default: {
          title = i18next.t('ERROR_DEFAULT_TITLE');
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const responseData = axiosError.response.data as Record<string, any>;
          message =
            responseData?.message ||
            axiosError.message ||
            i18next.t('ERROR_UNKNOWN_MESSAGE');
        }
      }
    } else if (error instanceof Error) {
      message = error.message;
    } else {
      title = i18next.t('ERROR_NETWORK_TITLE');
      message = i18next.t('ERROR_NETWORK_MESSAGE');
    }
  } else if (error instanceof Error) {
    message = error.message;
  } else {
    message = i18next.t('ERROR_UNKNOWN_MESSAGE');
  }

  return { title, message };
};

/**
 * Generates a random ID
 * @returns {string} A random ID
 */
export const generateId = () => Math.random().toString(36).substring(2, 9);

/**
 * Converts a string to capital case (e.g., 'foo bar' -> 'Foo Bar')
 * @param input - The string to convert
 * @param delimiters - Optional string of delimiter characters (default: " -", space and hyphen)
 * @returns The string in capital case
 */
export function capitalize(input: string, delimiters: string = ' -'): string {
  if (!input) return '';
  const words = input.toLowerCase().split(new RegExp(`[${delimiters}]+`));
  return words
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}
