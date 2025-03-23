import axios, { AxiosError } from 'axios';
import client, { getErrorDetails, get, post, put, del } from '../api';

jest.mock('../../constants/app', () => ({
  hostUrl: 'https://api.example.com',
}));

jest.mock('../notificationService', () => ({
  notificationService: {
    showError: jest.fn(),
  },
}));

const mockedAxios = axios as jest.Mocked<typeof axios>;

// Mock dependencies
jest.mock('axios', () => {
  return {
    create: jest.fn(() => ({
      get: jest.fn(),
      post: jest.fn(),
      put: jest.fn(),
      delete: jest.fn(),
      interceptors: {
        request: {
          use: jest.fn(() => ({
            handlers: [{ rejected: jest.fn() }],
          })),
          handlers: [{ rejected: jest.fn() }],
        },
        response: {
          use: jest.fn(() => ({
            handlers: [{ rejected: jest.fn() }],
          })),
          handlers: [{ rejected: jest.fn() }],
        },
      },
      defaults: {
        headers: {
          common: {},
        },
      },
    })),
    isAxiosError: jest.fn(),
  };
});

describe('API Client', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getErrorDetails', () => {
    it('should handle Axios errors with response', () => {
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

      const result = getErrorDetails(axiosError);

      expect(result).toEqual({
        title: 'Not Found',
        message: 'The requested resource was not found.',
      });
    });

    it('should handle 401/403 authentication errors', () => {
      const mockResponse = {
        status: 401,
        data: {},
      };

      const axiosError = {
        isAxiosError: true,
        response: mockResponse,
        request: {},
        message: 'Unauthorized',
        config: {},
        toJSON: jest.fn(),
      } as unknown as AxiosError;

      mockedAxios.isAxiosError.mockReturnValue(true);

      const result = getErrorDetails(axiosError);

      expect(result).toEqual({
        title: 'Authentication Error',
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

      const result = getErrorDetails(axiosError);

      expect(result).toEqual({
        title: 'Server Error',
        message: 'The server encountered an error. Please try again later.',
      });
    });

    it('should handle custom error messages in response data', () => {
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

      const result = getErrorDetails(axiosError);

      expect(result).toEqual({
        title: 'Request Error',
        message: 'Invalid input parameters',
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

      const result = getErrorDetails(axiosError);

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

      const result = getErrorDetails(error);

      expect(result).toEqual({
        title: 'ValidationError',
        message: 'Something went wrong',
      });
    });

    it('should handle string errors', () => {
      const errorMessage = 'Simple error message';

      mockedAxios.isAxiosError.mockReturnValue(false);

      const result = getErrorDetails(errorMessage);

      expect(result).toEqual({
        title: 'Error',
        message: 'Simple error message',
      });
    });

    it('should handle unknown error types', () => {
      const unknownError = { foo: 'bar' };

      mockedAxios.isAxiosError.mockReturnValue(false);

      const result = getErrorDetails(unknownError);

      expect(result).toEqual({
        title: 'Error',
        message: 'An unexpected error occurred',
      });
    });
  });

  describe('HTTP methods', () => {
    const mockResponse = { data: { id: 1, name: 'Test' } };
    const mockUrl = '/test';
    const mockData = { name: 'Test' };

    beforeEach(() => {
      client.get = jest.fn().mockResolvedValue(mockResponse);
      client.post = jest.fn().mockResolvedValue(mockResponse);
      client.put = jest.fn().mockResolvedValue(mockResponse);
      client.delete = jest.fn().mockResolvedValue(mockResponse);
    });

    it('should make GET request and return data', async () => {
      const result = await get(mockUrl);

      expect(client.get).toHaveBeenCalledWith(mockUrl);
      expect(result).toEqual(mockResponse.data);
    });

    it('should make POST request with data and return response data', async () => {
      const result = await post(mockUrl, mockData);

      expect(client.post).toHaveBeenCalledWith(mockUrl, mockData);
      expect(result).toEqual(mockResponse.data);
    });

    it('should make PUT request with data and return response data', async () => {
      const result = await put(mockUrl, mockData);

      expect(client.put).toHaveBeenCalledWith(mockUrl, mockData);
      expect(result).toEqual(mockResponse.data);
    });

    it('should make DELETE request and return response data', async () => {
      const result = await del(mockUrl);

      expect(client.delete).toHaveBeenCalledWith(mockUrl);
      expect(result).toEqual(mockResponse.data);
    });

    it('should propagate errors from HTTP methods', async () => {
      const mockError = new Error('Network failure');
      client.get = jest.fn().mockRejectedValue(mockError);

      await expect(get(mockUrl)).rejects.toThrow('Network failure');
    });
  });
});
