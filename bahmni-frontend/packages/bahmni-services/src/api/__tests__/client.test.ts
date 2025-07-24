import axios from 'axios';
import client, { get, post, put, del } from '../client';

// Mock dependencies
jest.mock('../constants', () => ({
  LOGIN_PATH: '/login',
}));

jest.mock('../utils', () => ({
  getFormattedError: jest.fn(() => ({
    title: 'Error',
    message: 'Test error message',
  })),
  decodeHtmlEntities: jest.fn((data) => data),
  isOpenMRSWebServiceApi: jest.fn(() => true),
  getResponseUrl: jest.fn(() => '/openmrs/ws/rest/v1/patient'),
}));

describe('API Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('HTTP Method Functions', () => {
    // Mock axios client methods
    const mockAxiosGet = jest.fn();
    const mockAxiosPost = jest.fn();
    const mockAxiosPut = jest.fn();
    const mockAxiosDelete = jest.fn();

    beforeEach(() => {
      client.get = mockAxiosGet;
      client.post = mockAxiosPost;
      client.put = mockAxiosPut;
      client.delete = mockAxiosDelete;
    });

    describe('get', () => {
      it('should make GET request and return response data', async () => {
        const mockData = { id: 1, name: 'Test Patient' };
        mockAxiosGet.mockResolvedValue({ data: mockData });

        const result = await get('/api/patients/1');

        expect(mockAxiosGet).toHaveBeenCalledWith('/api/patients/1');
        expect(result).toEqual(mockData);
      });

      it('should handle GET request errors', async () => {
        const error = new Error('Network error');
        mockAxiosGet.mockRejectedValue(error);

        await expect(get('/api/patients/1')).rejects.toThrow('Network error');
        expect(mockAxiosGet).toHaveBeenCalledWith('/api/patients/1');
      });
    });

    describe('post', () => {
      it('should make POST request and return response data', async () => {
        const mockData = { id: 1, name: 'New Patient' };
        const requestData = { name: 'New Patient', age: 30 };
        mockAxiosPost.mockResolvedValue({ data: mockData });

        const result = await post('/api/patients', requestData);

        expect(mockAxiosPost).toHaveBeenCalledWith(
          '/api/patients',
          requestData,
        );
        expect(result).toEqual(mockData);
      });

      it('should handle POST request errors', async () => {
        const error = new Error('Validation error');
        mockAxiosPost.mockRejectedValue(error);

        await expect(post('/api/patients', {})).rejects.toThrow(
          'Validation error',
        );
        expect(mockAxiosPost).toHaveBeenCalledWith('/api/patients', {});
      });
    });

    describe('put', () => {
      it('should make PUT request and return response data', async () => {
        const mockData = { id: 1, name: 'Updated Patient' };
        const requestData = { name: 'Updated Patient', age: 31 };
        mockAxiosPut.mockResolvedValue({ data: mockData });

        const result = await put('/api/patients/1', requestData);

        expect(mockAxiosPut).toHaveBeenCalledWith(
          '/api/patients/1',
          requestData,
        );
        expect(result).toEqual(mockData);
      });

      it('should handle PUT request errors', async () => {
        const error = new Error('Not found');
        mockAxiosPut.mockRejectedValue(error);

        await expect(put('/api/patients/1', {})).rejects.toThrow('Not found');
        expect(mockAxiosPut).toHaveBeenCalledWith('/api/patients/1', {});
      });
    });

    describe('del', () => {
      it('should make DELETE request and return response data', async () => {
        const mockData = { success: true };
        mockAxiosDelete.mockResolvedValue({ data: mockData });

        const result = await del('/api/patients/1');

        expect(mockAxiosDelete).toHaveBeenCalledWith('/api/patients/1');
        expect(result).toEqual(mockData);
      });

      it('should handle DELETE request errors', async () => {
        const error = new Error('Forbidden');
        mockAxiosDelete.mockRejectedValue(error);

        await expect(del('/api/patients/1')).rejects.toThrow('Forbidden');
        expect(mockAxiosDelete).toHaveBeenCalledWith('/api/patients/1');
      });
    });
  });

  describe('Request Interceptor', () => {
    it('should pass through successful requests', () => {
      const mockConfig = { url: '/api/test' };
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const requestInterceptor = (client.interceptors.request as any)
        .handlers[0];

      const result = requestInterceptor.fulfilled(mockConfig);
      expect(result).toBe(mockConfig);
    });

    it('should handle request errors', async () => {
      const mockError = new Error('Request failed');
      const { getFormattedError } = await import('../utils');
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
      typeof import('../utils').getFormattedError
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
      const utilsModule = await import('../utils');
      getFormattedError = utilsModule.getFormattedError as jest.MockedFunction<
        typeof import('../utils').getFormattedError
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

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
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

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
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

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
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

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
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

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
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

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
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

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const responseInterceptor = (client.interceptors.response as any)
          .handlers[0];

        await expect(() =>
          responseInterceptor.fulfilled(mockResponse),
        ).rejects.toBe('Error: Test error message');
        expect(getFormattedError).toHaveBeenCalled();
      });

      it('should handle unexpected errors in response interceptor', async () => {
        const mockResponse = null; // forceful unexpected shape

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const responseInterceptor = (client.interceptors.response as any)
          .handlers[0];

        await expect(() =>
          responseInterceptor.fulfilled(mockResponse),
        ).rejects.toBe('Error: Test error message');
        expect(getFormattedError).toHaveBeenCalled();
      });
    });
  });

  describe('Integration Tests', () => {
    it('should handle complete request-response cycle', async () => {
      const responseData = { id: 1, display: 'Test Patient' };
      const mockAxiosPost = jest.fn().mockResolvedValue({ data: responseData });
      client.post = mockAxiosPost;

      const result = await post('/api/patients', { name: 'Test Patient' });

      expect(mockAxiosPost).toHaveBeenCalledWith('/api/patients', {
        name: 'Test Patient',
      });
      expect(result).toEqual(responseData);
    });
  });
});
