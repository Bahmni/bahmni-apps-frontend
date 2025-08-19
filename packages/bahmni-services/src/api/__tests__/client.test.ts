import axios from 'axios';
import client from '../client';

// Mock dependencies
jest.mock('../constants', () => ({
  LOGIN_PATH: '/login',
}));

jest.mock('../../errorHandling', () => ({
  getFormattedError: jest.fn(() => ({
    title: 'Error',
    message: 'Test error message',
  })),
}));

jest.mock('../utils', () => ({
  decodeHtmlEntities: jest.fn((data) => data),
  isOpenMRSWebServiceApi: jest.fn(() => true),
  getResponseUrl: jest.fn(() => '/openmrs/ws/rest/v1/patient'),
}));

describe('Axios Client', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Request Interceptor', () => {
    it('should pass through successful requests', () => {
      const mockConfig = { url: '/api/test' };

      const requestInterceptor = (client.interceptors.request as any)
        .handlers[0];

      const result = requestInterceptor.fulfilled(mockConfig);
      expect(result).toBe(mockConfig);
    });

    it('should handle request errors', async () => {
      const mockError = new Error('Request failed');
      const { getFormattedError } = await import('../../errorHandling');

      const requestInterceptor = (client.interceptors.request as any)
        .handlers[0];

      await expect(() => requestInterceptor.rejected(mockError)).rejects.toBe(
        'Error: Test error message',
      );
      expect(getFormattedError).toHaveBeenCalledWith(mockError);
    });
  });

  describe('Response Interceptor', () => {
    let getFormattedError: jest.MockedFunction<
      typeof import('../../errorHandling').getFormattedError
    >;
    let decodeHtmlEntities: jest.MockedFunction<
      typeof import('../utils').decodeHtmlEntities
    >;
    let isOpenMRSWebServiceApi: jest.MockedFunction<
      typeof import('../utils').isOpenMRSWebServiceApi
    >;
    let getResponseUrl: jest.MockedFunction<
      typeof import('../utils').getResponseUrl
    >;

    beforeEach(async () => {
      const errorHandlingModule = await import('../../errorHandling');
      const utilsModule = await import('../utils');
      getFormattedError =
        errorHandlingModule.getFormattedError as jest.MockedFunction<
          typeof import('../../errorHandling').getFormattedError
        >;
      decodeHtmlEntities =
        utilsModule.decodeHtmlEntities as jest.MockedFunction<
          typeof import('../utils').decodeHtmlEntities
        >;
      isOpenMRSWebServiceApi =
        utilsModule.isOpenMRSWebServiceApi as jest.MockedFunction<
          typeof import('../utils').isOpenMRSWebServiceApi
        >;
      getResponseUrl = utilsModule.getResponseUrl as jest.MockedFunction<
        typeof import('../utils').getResponseUrl
      >;

      // Mock window.location
      delete (window as unknown as { location: unknown }).location;
      (window as unknown as { location: { href: string } }).location = {
        href: '',
      };
    });

    describe('Success Path', () => {
      it('should process OpenMRS API responses with HTML entity decoding', async () => {
        const testData = { display: '&amp;Patient Name&lt;' };
        const decodedData = { display: '&Patient Name<' };

        getResponseUrl.mockReturnValue('/openmrs/ws/rest/v1/patient');
        isOpenMRSWebServiceApi.mockReturnValue(true);
        decodeHtmlEntities.mockReturnValue(decodedData);

        const mockResponse = {
          data: testData,
          config: { url: '/openmrs/ws/rest/v1/patient' },
        };

        const responseInterceptor = (client.interceptors.response as any)
          .handlers[0];
        const result = responseInterceptor.fulfilled(mockResponse);

        expect(getResponseUrl).toHaveBeenCalledWith(mockResponse.config);
        expect(isOpenMRSWebServiceApi).toHaveBeenCalledWith(
          '/openmrs/ws/rest/v1/patient',
        );
        expect(decodeHtmlEntities).toHaveBeenCalledWith(testData);
        expect(result.data).toEqual(decodedData);
      });

      it('should skip HTML entity decoding for non-OpenMRS API responses', async () => {
        const testData = { display: '&amp;Patient Name&lt;' };

        getResponseUrl.mockReturnValue('/api/v1/patient');
        isOpenMRSWebServiceApi.mockReturnValue(false);

        const mockResponse = {
          data: testData,
          config: { url: '/api/v1/patient' },
        };

        const responseInterceptor = (client.interceptors.response as any)
          .handlers[0];
        const result = responseInterceptor.fulfilled(mockResponse);

        expect(getResponseUrl).toHaveBeenCalledWith(mockResponse.config);
        expect(isOpenMRSWebServiceApi).toHaveBeenCalledWith('/api/v1/patient');
        expect(decodeHtmlEntities).not.toHaveBeenCalled();
        expect(result.data).toEqual(testData);
      });
    });

    describe('Error Handling', () => {
      it('should handle 401 errors by redirecting to login', async () => {
        const mockError = {
          response: { status: 401 },
          isAxiosError: true,
        };

        // Mock axios.isAxiosError
        (axios.isAxiosError as unknown as jest.Mock) = jest
          .fn()
          .mockReturnValue(true);

        const responseInterceptor = (client.interceptors.response as any)
          .handlers[0];

        await expect(() =>
          responseInterceptor.rejected(mockError),
        ).rejects.toBe(mockError);
        expect(window.location.href).toBe('/login');
      });

      it('should handle non-401 Axios errors', async () => {
        const mockError = {
          response: { status: 500 },
          isAxiosError: true,
        };

        (axios.isAxiosError as unknown as jest.Mock) = jest
          .fn()
          .mockReturnValue(true);

        const responseInterceptor = (client.interceptors.response as any)
          .handlers[0];

        await expect(() =>
          responseInterceptor.rejected(mockError),
        ).rejects.toBe('Error: Test error message');
        expect(getFormattedError).toHaveBeenCalledWith(mockError);
      });

      it('should handle non-Axios errors', async () => {
        const mockError = new Error('Network error');

        (axios.isAxiosError as unknown as jest.Mock) = jest
          .fn()
          .mockReturnValue(false);

        const responseInterceptor = (client.interceptors.response as any)
          .handlers[0];

        await expect(() =>
          responseInterceptor.rejected(mockError),
        ).rejects.toBe('Error: Test error message');
        expect(getFormattedError).toHaveBeenCalledWith(mockError);
      });

      it('should handle Axios errors without response', async () => {
        const mockError = {
          isAxiosError: true,
          message: 'Request timeout',
        };

        (axios.isAxiosError as unknown as jest.Mock) = jest
          .fn()
          .mockReturnValue(true);

        const responseInterceptor = (client.interceptors.response as any)
          .handlers[0];

        await expect(() =>
          responseInterceptor.rejected(mockError),
        ).rejects.toBe('Error: Test error message');
        expect(getFormattedError).toHaveBeenCalledWith(mockError);
      });

      it('should handle errors during HTML entity decoding', async () => {
        const testData = { display: '&amp;Error' };

        getResponseUrl.mockReturnValue('/openmrs/ws/rest/v1/patient');
        isOpenMRSWebServiceApi.mockReturnValue(true);
        decodeHtmlEntities.mockImplementation(() => {
          throw new Error('Decoding failed');
        });

        const mockResponse = {
          data: testData,
          config: { url: '/openmrs/ws/rest/v1/patient' },
        };

        const responseInterceptor = (client.interceptors.response as any)
          .handlers[0];

        await expect(() =>
          responseInterceptor.fulfilled(mockResponse),
        ).rejects.toBe('Error: Test error message');
        expect(getFormattedError).toHaveBeenCalled();
      });

      it('should handle unexpected errors in response interceptor', async () => {
        const mockResponse = null; // forceful unexpected shape

        const responseInterceptor = (client.interceptors.response as any)
          .handlers[0];

        await expect(() =>
          responseInterceptor.fulfilled(mockResponse),
        ).rejects.toBe('Error: Test error message');
        expect(getFormattedError).toHaveBeenCalled();
      });
    });
  });
});
