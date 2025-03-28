import {
  extractFirstUuidFromPath,
  generateId,
  getFormattedError,
} from '../common';
import axios, { AxiosError } from 'axios';

jest.mock('axios', () => ({
  isAxiosError: jest.fn(),
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
        title: 'Authorization Error',
        message:
          'You are not authorized to perform this action. Please log in again.',
      });
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
        title: 'Request Error',
        message: 'Error processing your request',
      });
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
        title: 'Request Error',
        message: 'Error processing your request',
      });
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
    });

    it('should handle undefined error input', () => {
      const result = getFormattedError(undefined);
      expect(result).toEqual({
        title: 'Error',
        message: 'An unexpected error occurred',
      });
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
        title: 'Request Error',
        message: 'Error processing your request',
      });
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
        title: 'Request Error',
        message: 'Error processing your request',
      });
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
        title: 'Request Error',
        message: 'Validation failed',
      });
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
        title: 'Request Error',
        message: 'Custom error message',
      });
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
    });

    it('should handle generic Error objects', () => {
      const error = new Error('Something went wrong');
      error.name = 'ValidationError';

      mockedAxios.isAxiosError.mockReturnValue(false);

      const result = getFormattedError(error);

      expect(result).toEqual({
        title: 'ValidationError',
        message: 'Something went wrong',
      });
    });

    it('should return error object input', () => {
      const result = getFormattedError({
        message: 'An unknown error',
      });
      expect(result).toEqual({
        title: 'Error',
        message: 'An unknown error occurred',
      });
    });

    it('should handle generic Error objects without name', () => {
      const error = new Error('Something went wrong');
      error.name = undefined; // Set name to undefined for this test

      mockedAxios.isAxiosError.mockReturnValue(false);

      const result = getFormattedError(error);

      expect(result).toEqual({
        title: 'Error',
        message: 'Something went wrong',
      });
    });

    it('should handle string errors', () => {
      const errorMessage = 'Simple error message';

      mockedAxios.isAxiosError.mockReturnValue(false);

      const result = getFormattedError(errorMessage);

      expect(result).toEqual({
        title: 'Error',
        message: 'Simple error message',
      });
    });

    it('should handle unknown error types', () => {
      const unknownError = { foo: 'bar' };

      mockedAxios.isAxiosError.mockReturnValue(false);

      const result = getFormattedError(unknownError);

      expect(result).toEqual({
        title: 'Error',
        message: 'An unknown error occurred',
      });
    });
  });

  describe('extractFirstUuidFromPath', () => {
    // Happy path tests
    it('should extract UUID from a simple path', () => {
      const path = '/patients/123e4567-e89b-12d3-a456-426614174000';
      const result = extractFirstUuidFromPath(path);
      expect(result).toBe('123e4567-e89b-12d3-a456-426614174000');
    });

    it('should extract UUID from a path with multiple segments', () => {
      const path =
        '/patients/123e4567-e89b-12d3-a456-426614174000/visits/recent';
      const result = extractFirstUuidFromPath(path);
      expect(result).toBe('123e4567-e89b-12d3-a456-426614174000');
    });

    it('should extract UUID from the middle of a path', () => {
      const path =
        '/dashboard/patients/123e4567-e89b-12d3-a456-426614174000/profile';
      const result = extractFirstUuidFromPath(path);
      expect(result).toBe('123e4567-e89b-12d3-a456-426614174000');
    });

    it('should extract UUID from the end of a path', () => {
      const path = '/dashboard/patients/123e4567-e89b-12d3-a456-426614174000';
      const result = extractFirstUuidFromPath(path);
      expect(result).toBe('123e4567-e89b-12d3-a456-426614174000');
    });

    it('should extract UUID with uppercase characters', () => {
      const path = '/patients/123E4567-E89B-12D3-A456-426614174000';
      const result = extractFirstUuidFromPath(path);
      expect(result).toBe('123E4567-E89B-12D3-A456-426614174000');
    });

    it('should extract UUID with mixed case characters', () => {
      const path = '/patients/123e4567-E89b-12D3-a456-426614174000';
      const result = extractFirstUuidFromPath(path);
      expect(result).toBe('123e4567-E89b-12D3-a456-426614174000');
    });

    it('should extract the first UUID when multiple UUIDs are present', () => {
      const path =
        '/patients/123e4567-e89b-12d3-a456-426614174000/visits/98765432-abcd-efgh-ijkl-123456789012';
      const result = extractFirstUuidFromPath(path);
      expect(result).toBe('123e4567-e89b-12d3-a456-426614174000');
    });

    it('should extract UUID from a path with query parameters', () => {
      const path =
        '/patients/123e4567-e89b-12d3-a456-426614174000?name=John&age=30';
      const result = extractFirstUuidFromPath(path);
      expect(result).toBe('123e4567-e89b-12d3-a456-426614174000');
    });

    it('should extract UUID from a path with hash fragments', () => {
      const path = '/patients/123e4567-e89b-12d3-a456-426614174000#details';
      const result = extractFirstUuidFromPath(path);
      expect(result).toBe('123e4567-e89b-12d3-a456-426614174000');
    });

    // Sad path tests
    it('should return null for null input', () => {
      const result = extractFirstUuidFromPath(null as unknown as string);
      expect(result).toBeNull();
    });

    it('should return null for undefined input', () => {
      const result = extractFirstUuidFromPath(undefined as unknown as string);
      expect(result).toBeNull();
    });

    it('should return null for empty string', () => {
      const result = extractFirstUuidFromPath('');
      expect(result).toBeNull();
    });

    it('should return null for non-string input', () => {
      const result = extractFirstUuidFromPath(123 as unknown as string);
      expect(result).toBeNull();
    });

    it('should return null for object input', () => {
      const result = extractFirstUuidFromPath({} as unknown as string);
      expect(result).toBeNull();
    });

    it('should return null for array input', () => {
      const result = extractFirstUuidFromPath([] as unknown as string);
      expect(result).toBeNull();
    });

    it('should return null for path without UUID', () => {
      const path = '/patients/list';
      const result = extractFirstUuidFromPath(path);
      expect(result).toBeNull();
    });

    it('should return null for path with malformed UUID (missing segment)', () => {
      const path = '/patients/123e4567-e89b-12d3-a456';
      const result = extractFirstUuidFromPath(path);
      expect(result).toBeNull();
    });

    it('should return null for path with malformed UUID (wrong format)', () => {
      const path = '/patients/123e4567-e89b-12d3-a456-42661417400Z'; // 'Z' is not a hex character
      const result = extractFirstUuidFromPath(path);
      expect(result).toBeNull();
    });

    it('should return null for path with malformed UUID (missing hyphens)', () => {
      const path = '/patients/123e4567e89b12d3a456426614174000'; // No hyphens
      const result = extractFirstUuidFromPath(path);
      expect(result).toBeNull();
    });

    it('should return null for path with UUID-like string but incorrect format', () => {
      const path = '/patients/not-a-real-uuid-but-has-hyphens';
      const result = extractFirstUuidFromPath(path);
      expect(result).toBeNull();
    });
  });
});
