import axios, {
  AxiosError,
  AxiosResponse,
  InternalAxiosRequestConfig,
  AxiosHeaders,
} from 'axios';
import { get, post, put, del, getErrorDetails } from '../api';
import { notificationService } from '../notificationService';
import { hostUrl } from '../../constants/app';

// Mock axios and notification service
jest.mock('axios', () => ({
  create: jest.fn(() => ({
    defaults: {
      headers: {
        common: {},
      },
    },
  })),
  isAxiosError: jest.fn(),
}));
jest.mock('../notificationService', () => ({
  notificationService: {
    showError: jest.fn(),
  },
}));

describe('API Service', () => {
  let mockAxiosInstance: any;
  let mockInterceptors: any;

  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();

    // Setup mock interceptors
    mockInterceptors = {
      request: {
        use: jest.fn((successFn, errorFn) => {
          mockInterceptors.request.successHandler = successFn;
          mockInterceptors.request.errorHandler = errorFn;
          return 1; // Return interceptor ID
        }),
        eject: jest.fn(),
        successHandler: null as any,
        errorHandler: null as any,
      },
      response: {
        use: jest.fn((successFn, errorFn) => {
          mockInterceptors.response.successHandler = successFn;
          mockInterceptors.response.errorHandler = errorFn;
          return 2; // Return interceptor ID
        }),
        eject: jest.fn(),
        successHandler: null as any,
        errorHandler: null as any,
      },
    };

    // Setup mock axios instance
    mockAxiosInstance = {
      get: jest.fn(),
      post: jest.fn(),
      put: jest.fn(),
      delete: jest.fn(),
      interceptors: mockInterceptors,
      defaults: {
        headers: {
          common: {},
        },
      },
    };

    (axios.create as jest.Mock).mockReturnValue(mockAxiosInstance);

    // Re-import the module to ensure interceptors are set up
    jest.isolateModules(() => {
      require('../api');
    });
  });

  describe('HTTP Methods', () => {
    // GET method tests
    describe('get', () => {
      it('should make a GET request and return data', async () => {
        // Arrange
        const mockData = { id: '123', name: 'Test' };
        const mockResponse = { data: mockData };
        mockAxiosInstance.get.mockResolvedValueOnce(mockResponse);

        // Act
        const result = await get<typeof mockData>('/test-url');

        // Assert
        expect(mockAxiosInstance.get).toHaveBeenCalledWith('/test-url');
        expect(result).toEqual(mockData);
      });

      it('should throw an error when the GET request fails', async () => {
        // Arrange
        const mockError = new Error('Network Error');
        mockAxiosInstance.get.mockRejectedValueOnce(mockError);

        // Act & Assert
        await expect(get('/test-url')).rejects.toThrow('Network Error');
        expect(mockAxiosInstance.get).toHaveBeenCalledWith('/test-url');
      });
    });

    // POST method tests
    describe('post', () => {
      it('should make a POST request with data and return response data', async () => {
        // Arrange
        const requestData = { name: 'Test', value: 42 };
        const mockResponseData = { id: '123', ...requestData };
        const mockResponse = { data: mockResponseData };
        mockAxiosInstance.post.mockResolvedValueOnce(mockResponse);

        // Act
        const result = await post<typeof mockResponseData>(
          '/test-url',
          requestData,
        );

        // Assert
        expect(mockAxiosInstance.post).toHaveBeenCalledWith(
          '/test-url',
          requestData,
        );
        expect(result).toEqual(mockResponseData);
      });

      it('should throw an error when the POST request fails', async () => {
        // Arrange
        const requestData = { name: 'Test', value: 42 };
        const mockError = new Error('Failed to create resource');
        mockAxiosInstance.post.mockRejectedValueOnce(mockError);

        // Act & Assert
        await expect(post('/test-url', requestData)).rejects.toThrow(
          'Failed to create resource',
        );
        expect(mockAxiosInstance.post).toHaveBeenCalledWith(
          '/test-url',
          requestData,
        );
      });
    });

    // PUT method tests
    describe('put', () => {
      it('should make a PUT request with data and return response data', async () => {
        // Arrange
        const requestData = { id: '123', name: 'Updated Test', value: 99 };
        const mockResponseData = {
          ...requestData,
          updatedAt: '2025-03-21T08:30:00Z',
        };
        const mockResponse = { data: mockResponseData };
        mockAxiosInstance.put.mockResolvedValueOnce(mockResponse);

        // Act
        const result = await put<typeof mockResponseData>(
          '/test-url/123',
          requestData,
        );

        // Assert
        expect(mockAxiosInstance.put).toHaveBeenCalledWith(
          '/test-url/123',
          requestData,
        );
        expect(result).toEqual(mockResponseData);
      });

      it('should throw an error when the PUT request fails', async () => {
        // Arrange
        const requestData = { id: '123', name: 'Updated Test' };
        const mockError = new Error('Failed to update resource');
        mockAxiosInstance.put.mockRejectedValueOnce(mockError);

        // Act & Assert
        await expect(put('/test-url/123', requestData)).rejects.toThrow(
          'Failed to update resource',
        );
        expect(mockAxiosInstance.put).toHaveBeenCalledWith(
          '/test-url/123',
          requestData,
        );
      });
    });

    // DELETE method tests
    describe('del', () => {
      it('should make a DELETE request and return response data', async () => {
        // Arrange
        const mockResponseData = { success: true, message: 'Resource deleted' };
        const mockResponse = { data: mockResponseData };
        mockAxiosInstance.delete.mockResolvedValueOnce(mockResponse);

        // Act
        const result = await del<typeof mockResponseData>('/test-url/123');

        // Assert
        expect(mockAxiosInstance.delete).toHaveBeenCalledWith('/test-url/123');
        expect(result).toEqual(mockResponseData);
      });

      it('should throw an error when the DELETE request fails', async () => {
        // Arrange
        const mockError = new Error('Failed to delete resource');
        mockAxiosInstance.delete.mockRejectedValueOnce(mockError);

        // Act & Assert
        await expect(del('/test-url/123')).rejects.toThrow(
          'Failed to delete resource',
        );
        expect(mockAxiosInstance.delete).toHaveBeenCalledWith('/test-url/123');
      });
    });
  });

  describe('Interceptors', () => {
    // Request interceptor tests
    describe('Request Interceptor', () => {
      it('should pass through the config unchanged in success case', () => {
        // Arrange
        // Create a proper config object with headers
        const headers = new AxiosHeaders();
        headers.set('Custom-Header', 'value');

        const config: InternalAxiosRequestConfig = {
          url: '/test',
          method: 'GET',
          headers,
        };

        // Act
        const result = mockInterceptors.request.successHandler(config);

        // Assert
        expect(result).toBe(config);
      });

      it('should handle request errors and show notification', () => {
        // Arrange
        const error = new Error('Request setup error');

        // Act
        try {
          mockInterceptors.request.errorHandler(error);
        } catch (e) {
          // Expected to throw
        }

        // Assert
        expect(console.error).toHaveBeenCalled();
        expect(notificationService.showError).toHaveBeenCalled();
      });
    });

    // Response interceptor tests
    describe('Response Interceptor', () => {
      it('should pass through the response unchanged in success case', () => {
        // Arrange
        const headers = new AxiosHeaders();

        const response: AxiosResponse = {
          data: { id: '123' },
          status: 200,
          statusText: 'OK',
          headers: {},
          config: {
            headers,
          } as InternalAxiosRequestConfig,
        };

        // Act
        const result = mockInterceptors.response.successHandler(response);

        // Assert
        expect(result).toBe(response);
      });

      it('should handle response errors and show notification', () => {
        // Arrange
        const error = {
          response: {
            status: 404,
            data: { message: 'Resource not found' },
          },
        } as AxiosError;

        // Act
        try {
          mockInterceptors.response.errorHandler(error);
        } catch (e) {
          // Expected to throw
        }

        // Assert
        expect(console.error).toHaveBeenCalled();
        expect(notificationService.showError).toHaveBeenCalled();
      });
    });
  });

  describe('getErrorDetails', () => {
    it('should handle 401 Unauthorized errors', () => {
      // Arrange
      const error = {
        isAxiosError: true,
        response: {
          status: 401,
          data: {},
        },
      };
      (
        axios.isAxiosError as jest.MockedFunction<typeof axios.isAxiosError>
      ).mockReturnValueOnce(true);

      // Act
      const result = getErrorDetails(error);

      // Assert
      expect(result).toEqual({
        title: 'Authentication Error',
        message:
          'You are not authorized to perform this action. Please log in again.',
      });
    });

    it('should handle 403 Forbidden errors', () => {
      // Arrange
      const error = {
        isAxiosError: true,
        response: {
          status: 403,
          data: {},
        },
      };
      (
        axios.isAxiosError as jest.MockedFunction<typeof axios.isAxiosError>
      ).mockReturnValueOnce(true);

      // Act
      const result = getErrorDetails(error);

      // Assert
      expect(result).toEqual({
        title: 'Authentication Error',
        message:
          'You are not authorized to perform this action. Please log in again.',
      });
    });

    it('should handle 404 Not Found errors', () => {
      // Arrange
      const error = {
        isAxiosError: true,
        response: {
          status: 404,
          data: {},
        },
      };
      (
        axios.isAxiosError as jest.MockedFunction<typeof axios.isAxiosError>
      ).mockReturnValueOnce(true);

      // Act
      const result = getErrorDetails(error);

      // Assert
      expect(result).toEqual({
        title: 'Not Found',
        message: 'The requested resource was not found.',
      });
    });

    it('should handle 500+ Server errors', () => {
      // Arrange
      const error = {
        isAxiosError: true,
        response: {
          status: 500,
          data: {},
        },
      };
      (
        axios.isAxiosError as jest.MockedFunction<typeof axios.isAxiosError>
      ).mockReturnValueOnce(true);

      // Act
      const result = getErrorDetails(error);

      // Assert
      expect(result).toEqual({
        title: 'Server Error',
        message: 'The server encountered an error. Please try again later.',
      });
    });

    it('should handle other response errors with custom message', () => {
      // Arrange
      const error = {
        isAxiosError: true,
        response: {
          status: 422,
          data: {
            message: 'Validation failed: Name is required',
          },
        },
        message: 'Request failed with status code 422',
      };
      (
        axios.isAxiosError as jest.MockedFunction<typeof axios.isAxiosError>
      ).mockReturnValueOnce(true);

      // Act
      const result = getErrorDetails(error);

      // Assert
      expect(result).toEqual({
        title: 'Request Error',
        message: 'Validation failed: Name is required',
      });
    });

    it('should handle other response errors with default message', () => {
      // Arrange
      const error = {
        isAxiosError: true,
        response: {
          status: 422,
          data: {},
        },
        message: 'Request failed with status code 422',
      };
      (
        axios.isAxiosError as jest.MockedFunction<typeof axios.isAxiosError>
      ).mockReturnValueOnce(true);

      // Act
      const result = getErrorDetails(error);

      // Assert
      expect(result).toEqual({
        title: 'Request Error',
        message: 'Request failed with status code 422',
      });
    });

    it('should handle network errors (no response)', () => {
      // Arrange
      const error = {
        isAxiosError: true,
        request: {},
        message: 'Network Error',
      };
      (
        axios.isAxiosError as jest.MockedFunction<typeof axios.isAxiosError>
      ).mockReturnValueOnce(true);

      // Act
      const result = getErrorDetails(error);

      // Assert
      expect(result).toEqual({
        title: 'Network Error',
        message:
          'Unable to connect to the server. Please check your internet connection.',
      });
    });

    it('should handle request setup errors', () => {
      // Arrange
      const error = {
        isAxiosError: true,
        message: 'Invalid URL',
      };
      (
        axios.isAxiosError as jest.MockedFunction<typeof axios.isAxiosError>
      ).mockReturnValueOnce(true);

      // Act
      const result = getErrorDetails(error);

      // Assert
      expect(result).toEqual({
        title: 'Request Error',
        message: 'Invalid URL',
      });
    });

    it('should handle non-Axios Error objects', () => {
      // Arrange
      const error = new Error('Custom error');
      error.name = 'CustomError';
      (
        axios.isAxiosError as jest.MockedFunction<typeof axios.isAxiosError>
      ).mockReturnValueOnce(false);

      // Act
      const result = getErrorDetails(error);

      // Assert
      expect(result).toEqual({
        title: 'CustomError',
        message: 'Custom error',
      });
    });

    it('should handle string errors', () => {
      // Arrange
      const error = 'Something went wrong';
      (
        axios.isAxiosError as jest.MockedFunction<typeof axios.isAxiosError>
      ).mockReturnValueOnce(false);

      // Act
      const result = getErrorDetails(error);

      // Assert
      expect(result).toEqual({
        title: 'Error',
        message: 'Something went wrong',
      });
    });

    it('should handle unknown error types', () => {
      // Arrange
      const error = { foo: 'bar' };
      (
        axios.isAxiosError as jest.MockedFunction<typeof axios.isAxiosError>
      ).mockReturnValueOnce(false);

      // Act
      const result = getErrorDetails(error);

      // Assert
      expect(result).toEqual({
        title: 'Error',
        message: 'An unexpected error occurred',
      });
    });
  });

  describe('Client Configuration', () => {
    it('should create axios instance with correct base URL', () => {
      // Assert
      expect(axios.create).toHaveBeenCalledWith({ baseURL: hostUrl });
    });

    it('should set default Content-Type header', () => {
      // Assert
      expect(mockAxiosInstance.defaults.headers.common['Content-Type']).toBe(
        'application/json',
      );
    });
  });
});
