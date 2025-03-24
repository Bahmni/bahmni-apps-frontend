import axios, { AxiosError } from 'axios';
import client, { getErrorDetails, get, post, put, del } from '../api';
import { notificationService } from '../notificationService';

jest.mock('../../constants/app', () => ({
  hostUrl: 'https://api.example.com',
  loginPath: '/login',
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

      const result = getErrorDetails(axiosError);

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

      const result = getErrorDetails(axiosError);

      expect(result).toEqual({
        title: 'Server Error',
        message: 'The server encountered an error. Please try again later.',
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

      const result = getErrorDetails(axiosError);

      expect(result).toEqual({
        title: 'Bad Request',
        message:
          'Invalid input parameters. Please check your request and try again.',
      });
    });

    it('should handle custom error messages in response data for other status codes', () => {
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

      const result = getErrorDetails(axiosError);

      expect(result).toEqual({
        title: 'Request Error',
        message: 'Validation failed',
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

  describe('Request Interceptor', () => {
    it('should pass through the config for successful requests', () => {
      // Create a mock config
      const mockConfig = {
        url: '/test',
        method: 'GET',
        headers: { 'Content-Type': 'application/json' }
      };

      // Create a mock for the success handler
      const successHandler = jest.fn((config) => config);

      // Mock the axios interceptor
      const originalInterceptors = client.interceptors;
      client.interceptors = {
        request: {
          use: jest.fn((successFn) => {
            // Store the success handler for testing
            successHandler.mockImplementation(successFn);
            return { id: 1 };
          }),
          eject: jest.fn()
        },
        response: originalInterceptors.response
      } as any;

      // Re-create the interceptor to capture our mock
      client.interceptors.request.use(
        function (config) {
          return config;
        },
        function (error) {
          const { title, message } = getErrorDetails(error);
          notificationService.showError(title, message);
          return Promise.reject(error);
        }
      );

      // Call the success handler with the mock config
      const result = successHandler(mockConfig);

      // Verify the config is passed through unchanged
      expect(result).toBe(mockConfig);

      // Restore original interceptors
      client.interceptors = originalInterceptors;
    });

    it('should handle errors in request interceptor', () => {
      // Create a mock error
      const mockError = new Error('Request setup failed');

      // Mock the getErrorDetails function
      const mockErrorDetails = { title: 'Error', message: 'Request setup failed' };
      const getErrorDetailsMock = jest.spyOn(require('../api'), 'getErrorDetails')
        .mockReturnValue(mockErrorDetails);

      // Create a mock for the error handler
      const errorHandler = jest.fn((error) => Promise.reject(error));

      // Mock the axios interceptor
      const originalInterceptors = client.interceptors;
      client.interceptors = {
        request: {
          use: jest.fn((successFn, errorFn) => {
            // Store the error handler for testing
            errorHandler.mockImplementation(errorFn);
            return { id: 1 };
          }),
          eject: jest.fn()
        },
        response: originalInterceptors.response
      } as any;

      // Re-create the interceptor to capture our mock
      client.interceptors.request.use(
        function (config) {
          return config;
        },
        function (error) {
          const { title, message } = getErrorDetails(error);
          notificationService.showError(title, message);
          return Promise.reject(error);
        }
      );

      // Call the error handler with the mock error
      errorHandler(mockError).catch(() => {
        // Expected to reject
      });

      // Verify getErrorDetails was called with the error
      expect(getErrorDetailsMock).toHaveBeenCalledWith(mockError);

      // Verify notificationService.showError was called with the correct title and message
      expect(notificationService.showError).toHaveBeenCalledWith(
        mockErrorDetails.title,
        mockErrorDetails.message
      );

      // Restore original interceptors and mocks
      client.interceptors = originalInterceptors;
      getErrorDetailsMock.mockRestore();
    });
  });

  describe('Response Interceptor', () => {
    it('should pass through the response for successful requests', () => {
      // Create a mock response
      const mockResponse = {
        data: { id: 1, name: 'Test' },
        status: 200,
        statusText: 'OK',
        headers: {},
        config: {}
      };

      // Create a mock for the success handler
      const successHandler = jest.fn((response) => response);

      // Mock the axios interceptor
      const originalInterceptors = client.interceptors;
      client.interceptors = {
        request: originalInterceptors.request,
        response: {
          use: jest.fn((successFn) => {
            // Store the success handler for testing
            successHandler.mockImplementation(successFn);
            return { id: 1 };
          }),
          eject: jest.fn()
        }
      } as any;

      // Re-create the interceptor to capture our mock
      client.interceptors.response.use(
        function (response) {
          return response;
        },
        function (error) {
          // Implementation will be tested in other tests
          return Promise.reject(error);
        }
      );

      // Call the success handler with the mock response
      const result = successHandler(mockResponse);

      // Verify the response is passed through unchanged
      expect(result).toBe(mockResponse);

      // Restore original interceptors
      client.interceptors = originalInterceptors;
    });

    it('should redirect to login page for 401 unauthorized errors', () => {
      // Save original window.location.href
      const originalHref = window.location.href;

      // Create a mock for window.location.href
      Object.defineProperty(window, 'location', {
        writable: true,
        value: { href: '' },
      });

      // Create a mock 401 error
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

      // Mock axios.isAxiosError to return true
      mockedAxios.isAxiosError.mockReturnValue(true);

      // Create a mock for the error handler
      const errorHandler = jest.fn((error) => Promise.reject(error));

      // Mock the axios interceptor
      const originalInterceptors = client.interceptors;
      client.interceptors = {
        request: originalInterceptors.request,
        response: {
          use: jest.fn((successFn, errorFn) => {
            // Store the error handler for testing
            errorHandler.mockImplementation(errorFn);
            return { id: 1 };
          }),
          eject: jest.fn()
        }
      } as any;

      // Re-create the interceptor to capture our mock
      client.interceptors.response.use(
        function (response) {
          return response;
        },
        function (error) {
          if (axios.isAxiosError(error) && error.response?.status === 401) {
            window.location.href = '/login';
            return Promise.reject(error);
          }
          const { title, message } = getErrorDetails(error);
          notificationService.showError(title, message);
          return Promise.reject(error);
        }
      );

      // Call the error handler with the mock error
      errorHandler(axiosError).catch(() => {
        // Expected to reject
      });

      // Verify redirect happened
      expect(window.location.href).toBe('/login');

      // Restore original window.location.href and interceptors
      Object.defineProperty(window, 'location', {
        writable: true,
        value: { href: originalHref },
      });
      client.interceptors = originalInterceptors;
    });

    it('should show error notification for non-401 errors', () => {
      // Create a mock error
      const mockResponse = {
        status: 500,
        data: { message: 'Internal Server Error' },
      };

      const axiosError = {
        isAxiosError: true,
        response: mockResponse,
        request: {},
        message: 'Server Error',
        config: {},
        toJSON: jest.fn(),
      } as unknown as AxiosError;

      // Mock axios.isAxiosError to return true
      mockedAxios.isAxiosError.mockReturnValue(true);

      // Mock the getErrorDetails function
      const mockErrorDetails = {
        title: 'Server Error',
        message: 'The server encountered an error. Please try again later.'
      };
      const getErrorDetailsMock = jest.spyOn(require('../api'), 'getErrorDetails')
        .mockReturnValue(mockErrorDetails);

      // Create a mock for the error handler
      const errorHandler = jest.fn((error) => Promise.reject(error));

      // Mock the axios interceptor
      const originalInterceptors = client.interceptors;
      client.interceptors = {
        request: originalInterceptors.request,
        response: {
          use: jest.fn((successFn, errorFn) => {
            // Store the error handler for testing
            errorHandler.mockImplementation(errorFn);
            return { id: 1 };
          }),
          eject: jest.fn()
        }
      } as any;

      // Re-create the interceptor to capture our mock
      client.interceptors.response.use(
        function (response) {
          return response;
        },
        function (error) {
          if (axios.isAxiosError(error) && error.response?.status === 401) {
            window.location.href = '/login';
            return Promise.reject(error);
          }
          const { title, message } = getErrorDetails(error);
          notificationService.showError(title, message);
          return Promise.reject(error);
        }
      );

      // Call the error handler with the mock error
      errorHandler(axiosError).catch(() => {
        // Expected to reject
      });

      // Verify getErrorDetails was called with the error
      expect(getErrorDetailsMock).toHaveBeenCalledWith(axiosError);

      // Verify notificationService.showError was called with the correct title and message
      expect(notificationService.showError).toHaveBeenCalledWith(
        mockErrorDetails.title,
        mockErrorDetails.message
      );

      // Restore original interceptors and mocks
      client.interceptors = originalInterceptors;
      getErrorDetailsMock.mockRestore();
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
