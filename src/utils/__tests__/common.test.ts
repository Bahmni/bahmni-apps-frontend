import { capitalize, generateId, getFormattedError } from '../common';
import axios, { AxiosError } from 'axios';
import i18next from 'i18next';

jest.mock('axios', () => ({
  isAxiosError: jest.fn(),
  get: jest.fn(),
}));

jest.mock('i18next', () => ({
  t: jest.fn((key: string) => {
    const translations: { [key: string]: string } = {
      ERROR_DEFAULT_TITLE: 'Error',
      ERROR_DEFAULT_MESSAGE: 'An unexpected error occurred',
      ERROR_BAD_REQUEST_TITLE: 'Bad Request',
      ERROR_BAD_REQUEST_MESSAGE:
        'Invalid input parameters. Please check your request and try again.',
      ERROR_UNAUTHORIZED_TITLE: 'Unauthorized',
      ERROR_UNAUTHORIZED_MESSAGE:
        'You are not authorized to perform this action. Please log in again.',
      ERROR_NOT_FOUND_TITLE: 'Not Found',
      ERROR_NOT_FOUND_MESSAGE: 'The requested resource was not found.',
      ERROR_SERVER_TITLE: 'Server Error',
      ERROR_SERVER_MESSAGE:
        'The server encountered an error. Please try again later.',
      ERROR_NETWORK_TITLE: 'Network Error',
      ERROR_NETWORK_MESSAGE:
        'Unable to connect to the server. Please check your internet connection.',
      ERROR_UNKNOWN_MESSAGE: 'An unknown error occurred',
    };
    return translations[key] || key;
  }),
}));

const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('common utility functions', () => {
  describe('generateId', () => {
    it('should generate a random string ID', () => {
      const id = generateId();
      expect(typeof id).toBe('string');
      expect(id.length).toBeGreaterThan(0);
    });

    it('should generate unique IDs', () => {
      const id1 = generateId();
      const id2 = generateId();
      expect(id1).not.toBe(id2);
    });
  });

  describe('getFormattedError', () => {
    beforeEach(() => {
      jest.clearAllMocks();
      jest.mocked(i18next.t).mockClear();
    });

    it('should handle Axios errors with response - 401 Unauthorized', () => {
      const mockResponse = {
        status: 401,
        data: { message: 'Unauthorized' },
      };

      const axiosError = {
        isAxiosError: true,
        response: mockResponse,
        request: {},
        message: 'Request failed',
        config: {},
        toJSON: jest.fn(),
      } as unknown as AxiosError;

      mockedAxios.isAxiosError.mockReturnValue(true);

      const result = getFormattedError(axiosError);

      expect(result).toEqual({
        title: 'Unauthorized',
        message:
          'You are not authorized to perform this action. Please log in again.',
      });
      expect(i18next.t).toHaveBeenCalledWith('ERROR_UNAUTHORIZED_TITLE');
      expect(i18next.t).toHaveBeenCalledWith('ERROR_UNAUTHORIZED_MESSAGE');
    });

    it('should handle Axios errors with response - 404 Not Found', () => {
      const mockResponse = {
        status: 404,
        data: { message: 'Resource not found' },
      };

      const axiosError = {
        isAxiosError: true,
        response: mockResponse,
        request: {},
        message: 'Request failed',
        config: {},
        toJSON: jest.fn(),
      } as unknown as AxiosError;

      mockedAxios.isAxiosError.mockReturnValue(true);

      const result = getFormattedError(axiosError);

      expect(result).toEqual({
        title: 'Not Found',
        message: 'The requested resource was not found.',
      });
      expect(i18next.t).toHaveBeenCalledWith('ERROR_NOT_FOUND_TITLE');
      expect(i18next.t).toHaveBeenCalledWith('ERROR_NOT_FOUND_MESSAGE');
    });

    it('should handle 403 authorization errors', () => {
      const mockResponse = {
        status: 403,
        data: {},
      };

      const axiosError = {
        isAxiosError: true,
        response: mockResponse,
        request: {},
        message: 'Forbidden',
        config: {},
        toJSON: jest.fn(),
      } as unknown as AxiosError;

      mockedAxios.isAxiosError.mockReturnValue(true);

      const result = getFormattedError(axiosError);

      expect(result).toEqual({
        title: 'Unauthorized',
        message:
          'You are not authorized to perform this action. Please log in again.',
      });
      expect(i18next.t).toHaveBeenCalledWith('ERROR_UNAUTHORIZED_TITLE');
      expect(i18next.t).toHaveBeenCalledWith('ERROR_UNAUTHORIZED_MESSAGE');
    });

    it('should handle server errors (500+)', () => {
      const mockResponse = {
        status: 500,
        data: {},
      };

      const axiosError = {
        isAxiosError: true,
        response: mockResponse,
        request: {},
        message: 'Server Error',
        config: {},
        toJSON: jest.fn(),
      } as unknown as AxiosError;

      mockedAxios.isAxiosError.mockReturnValue(true);

      const result = getFormattedError(axiosError);

      expect(result).toEqual({
        title: 'Server Error',
        message: 'The server encountered an error. Please try again later.',
      });
      expect(i18next.t).toHaveBeenCalledWith('ERROR_SERVER_TITLE');
      expect(i18next.t).toHaveBeenCalledWith('ERROR_SERVER_MESSAGE');
    });

    it('should handle all non standard axios errors', () => {
      const mockResponse = {
        status: 600,
        data: {},
      };

      const axiosError = {
        isAxiosError: true,
        response: mockResponse,
        request: {},
        config: {},
        toJSON: jest.fn(),
      } as unknown as AxiosError;

      mockedAxios.isAxiosError.mockReturnValue(true);

      const result = getFormattedError(axiosError);

      expect(result).toEqual({
        title: 'Error',
        message: 'An unknown error occurred',
      });
      expect(i18next.t).toHaveBeenCalledWith('ERROR_DEFAULT_TITLE');
      expect(i18next.t).toHaveBeenCalledWith('ERROR_UNKNOWN_MESSAGE');
    });

    it('should return Network Error message when axiosError.request exists', () => {
      // Mock an AxiosError with a request property (indicating a network issue)
      const axiosError = {
        isAxiosError: true,
        request: new Error('Network Error'), // Simulates a network error where no response is received
      } as unknown as AxiosError;

      const result = getFormattedError(axiosError);

      expect(result).toEqual({
        title: 'Network Error',
        message:
          'Unable to connect to the server. Please check your internet connection.',
      });
      expect(i18next.t).toHaveBeenCalledWith('ERROR_NETWORK_TITLE');
      expect(i18next.t).toHaveBeenCalledWith('ERROR_NETWORK_MESSAGE');
    });

    it('should handle bad request (400) errors', () => {
      const mockResponse = {
        status: 400,
        data: { message: 'Invalid input parameters' },
      };

      const axiosError = {
        isAxiosError: true,
        response: mockResponse,
        request: {},
        message: 'Bad Request',
        config: {},
        toJSON: jest.fn(),
      } as unknown as AxiosError;

      mockedAxios.isAxiosError.mockReturnValue(true);

      const result = getFormattedError(axiosError);

      expect(result).toEqual({
        title: 'Bad Request',
        message:
          'Invalid input parameters. Please check your request and try again.',
      });
      expect(i18next.t).toHaveBeenCalledWith('ERROR_BAD_REQUEST_TITLE');
      expect(i18next.t).toHaveBeenCalledWith('ERROR_BAD_REQUEST_MESSAGE');
    });

    it('should handle Axios error with undefined response data', () => {
      const mockResponse = {
        status: 422,
        data: undefined,
      };

      const axiosError = {
        isAxiosError: true,
        response: mockResponse,
        request: {},
        message: 'Error processing your request',
        config: {},
        toJSON: jest.fn(),
      } as unknown as AxiosError;

      mockedAxios.isAxiosError.mockReturnValue(true);

      const result = getFormattedError(axiosError);

      expect(result).toEqual({
        title: 'Error',
        message: 'Error processing your request',
      });
      expect(i18next.t).toHaveBeenCalledWith('ERROR_DEFAULT_TITLE');
    });

    it('should handle non-Axios error object that looks like an Axios error', () => {
      const nonAxiosError = {
        isAxiosError: false,
        response: {
          status: 404,
          data: { message: 'Not found' },
        },
        message: 'Error message',
      };

      mockedAxios.isAxiosError.mockReturnValue(false);

      const result = getFormattedError(nonAxiosError);

      expect(result).toEqual({
        title: 'Error',
        message: 'An unknown error occurred',
      });
      expect(i18next.t).toHaveBeenCalledWith('ERROR_DEFAULT_TITLE');
      expect(i18next.t).toHaveBeenCalledWith('ERROR_UNKNOWN_MESSAGE');
    });

    it('should handle undefined error input', () => {
      const result = getFormattedError(undefined);
      expect(result).toEqual({
        title: 'Error',
        message: 'An unexpected error occurred',
      });
      expect(i18next.t).toHaveBeenCalledWith('ERROR_DEFAULT_TITLE');
      expect(i18next.t).toHaveBeenCalledWith('ERROR_DEFAULT_MESSAGE');
    });

    it('should handle Axios error with empty response data', () => {
      const mockResponse = {
        status: 422,
        data: {}, // Empty response data
      };

      const axiosError = {
        isAxiosError: true,
        response: mockResponse,
        request: {},
        message: 'Error processing your request',
        config: {},
        toJSON: jest.fn(),
      } as unknown as AxiosError;

      mockedAxios.isAxiosError.mockReturnValue(true);

      const result = getFormattedError(axiosError);

      expect(result).toEqual({
        title: 'Error',
        message: 'Error processing your request',
      });
      expect(i18next.t).toHaveBeenCalledWith('ERROR_DEFAULT_TITLE');
    });

    it('should handle Axios error with null response data', () => {
      const mockResponse = {
        status: 422,
        data: null,
      };

      const axiosError = {
        isAxiosError: true,
        response: mockResponse,
        request: {},
        message: 'Error processing your request',
        config: {},
        toJSON: jest.fn(),
      } as unknown as AxiosError;

      mockedAxios.isAxiosError.mockReturnValue(true);

      const result = getFormattedError(axiosError);

      expect(result).toEqual({
        title: 'Error',
        message: 'Error processing your request',
      });
      expect(i18next.t).toHaveBeenCalledWith('ERROR_DEFAULT_TITLE');
    });

    it('should handle custom error messages in response data', () => {
      const mockResponse = {
        status: 422,
        data: { message: 'Validation failed' },
      };

      const axiosError = {
        isAxiosError: true,
        response: mockResponse,
        request: {},
        message: 'Unprocessable Entity',
        config: {},
        toJSON: jest.fn(),
      } as unknown as AxiosError;

      mockedAxios.isAxiosError.mockReturnValue(true);

      const result = getFormattedError(axiosError);

      expect(result).toEqual({
        title: 'Error',
        message: 'Validation failed',
      });
      expect(i18next.t).toHaveBeenCalledWith('ERROR_DEFAULT_TITLE');
    });

    it('should handle Axios error with response but no data message', () => {
      const mockResponse = {
        status: 422,
        data: {}, // No message in response data
      };

      const axiosError = {
        isAxiosError: true,
        response: mockResponse,
        request: {},
        message: 'Custom error message',
        config: {},
        toJSON: jest.fn(),
      } as unknown as AxiosError;

      mockedAxios.isAxiosError.mockReturnValue(true);

      const result = getFormattedError(axiosError);

      expect(result).toEqual({
        title: 'Error',
        message: 'Custom error message',
      });
      expect(i18next.t).toHaveBeenCalledWith('ERROR_DEFAULT_TITLE');
    });

    it('should handle network errors (no response)', () => {
      const axiosError = {
        isAxiosError: true,
        response: undefined,
        request: {},
        message: 'Network Error',
        config: {},
        toJSON: jest.fn(),
      } as unknown as AxiosError;

      mockedAxios.isAxiosError.mockReturnValue(true);

      const result = getFormattedError(axiosError);

      expect(result).toEqual({
        title: 'Network Error',
        message:
          'Unable to connect to the server. Please check your internet connection.',
      });
      expect(i18next.t).toHaveBeenCalledWith('ERROR_NETWORK_TITLE');
      expect(i18next.t).toHaveBeenCalledWith('ERROR_NETWORK_MESSAGE');
    });

    it('should handle generic Error objects', () => {
      const error = new Error('Something went wrong');
      mockedAxios.get.mockRejectedValue(error);
      const result = getFormattedError(error);

      expect(result).toEqual({
        title: 'Error',
        message: 'Something went wrong',
      });
      expect(i18next.t).toHaveBeenCalledWith('ERROR_DEFAULT_TITLE');
    });

    it('should handle string errors', () => {
      const errorMessage = 'Simple error message';

      mockedAxios.isAxiosError.mockReturnValue(false);

      const result = getFormattedError(errorMessage);

      expect(result).toEqual({
        title: 'Error',
        message: 'Simple error message',
      });
      expect(i18next.t).toHaveBeenCalledWith('ERROR_DEFAULT_TITLE');
    });

    it('should handle unknown error types', () => {
      const unknownError = { foo: 'bar' };

      mockedAxios.isAxiosError.mockReturnValue(false);

      const result = getFormattedError(unknownError);

      expect(result).toEqual({
        title: 'Error',
        message: 'An unknown error occurred',
      });
      expect(i18next.t).toHaveBeenCalledWith('ERROR_DEFAULT_TITLE');
      expect(i18next.t).toHaveBeenCalledWith('ERROR_UNKNOWN_MESSAGE');
    });
  });

  describe('capitalize', () => {
    it('should convert string to capital case', () => {
      expect(capitalize('foo bar')).toBe('Foo Bar');
      expect(capitalize('foo-bar')).toBe('Foo Bar');
      expect(capitalize('FOO BAR')).toBe('Foo Bar');
    });

    it('should handle empty string', () => {
      expect(capitalize('')).toBe('');
    });

    it('should handle single word', () => {
      expect(capitalize('hello')).toBe('Hello');
    });

    it('should handle custom delimiters', () => {
      expect(capitalize('foo_bar-baz', '_-')).toBe('Foo Bar Baz');
    });
  });
});
