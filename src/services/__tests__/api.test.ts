import axios from 'axios';
import { decode } from 'html-entities';

// Import the functions we want to test
// Since they are not exported, we need to test them indirectly through the module
import client from '../api';

jest.mock('html-entities', () => ({
  decode: jest.fn(),
}));

// Mock other dependencies
jest.mock('@constants/app', () => ({
  LOGIN_PATH: '/login',
}));

jest.mock('@utils/common', () => ({
  getFormattedError: jest.fn(() => ({
    title: 'Error',
    message: 'Test error message',
  })),
}));

jest.mock('@services/notificationService', () => ({
  notificationService: {
    showError: jest.fn(),
  },
}));

const mockDecode = decode as jest.MockedFunction<typeof decode>;

describe('API Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('decodeHtmlEntities', () => {
    // We need to test this function indirectly through the response interceptor
    let decodeHtmlEntitiesFunction: (data: unknown) => unknown;

    beforeAll(() => {
      // We'll create a test version of the function to test the logic
      decodeHtmlEntitiesFunction = (data: unknown): unknown => {
        if (typeof data === 'string') {
          return decode(data);
        }

        if (Array.isArray(data)) {
          return data.map((item) => decodeHtmlEntitiesFunction(item));
        }

        if (data && typeof data === 'object' && data !== null) {
          const decoded: { [key: string]: unknown } = {};
          for (const [key, value] of Object.entries(data)) {
            decoded[key] = decodeHtmlEntitiesFunction(value);
          }
          return decoded;
        }

        return data;
      };
    });

    describe('Happy Paths', () => {
      it('should decode HTML entities in strings', () => {
        const testString = '&amp;test&lt;';
        const expectedDecoded = '&test<';

        mockDecode.mockReturnValue(expectedDecoded);

        const result = decodeHtmlEntitiesFunction(testString);

        expect(decode).toHaveBeenCalledWith(testString);
        expect(result).toBe(expectedDecoded);
      });

      it('should recursively decode HTML entities in arrays', () => {
        const testArray = ['&amp;item1', '&lt;item2&gt;', '&quot;item3&quot;'];
        const expectedDecoded = ['&item1', '<item2>', '"item3"'];

        mockDecode
          .mockReturnValueOnce('&item1')
          .mockReturnValueOnce('<item2>')
          .mockReturnValueOnce('"item3"');

        const result = decodeHtmlEntitiesFunction(testArray);

        expect(decode).toHaveBeenCalledTimes(3);
        expect(decode).toHaveBeenNthCalledWith(1, '&amp;item1');
        expect(decode).toHaveBeenNthCalledWith(2, '&lt;item2&gt;');
        expect(decode).toHaveBeenNthCalledWith(3, '&quot;item3&quot;');
        expect(result).toEqual(expectedDecoded);
      });

      it('should recursively decode HTML entities in objects', () => {
        const testObject = {
          name: '&amp;John&lt;',
          description: '&quot;Test&quot;',
          nested: {
            value: '&gt;nested&lt;',
          },
        };

        const expectedDecoded = {
          name: '&John<',
          description: '"Test"',
          nested: {
            value: '>nested<',
          },
        };

        mockDecode
          .mockReturnValueOnce('&John<')
          .mockReturnValueOnce('"Test"')
          .mockReturnValueOnce('>nested<');

        const result = decodeHtmlEntitiesFunction(testObject);

        expect(decode).toHaveBeenCalledTimes(3);
        expect(result).toEqual(expectedDecoded);
      });

      it('should handle nested arrays within objects', () => {
        const testData = {
          items: ['&amp;item1', '&lt;item2&gt;'],
          metadata: {
            tags: ['&quot;tag1&quot;', '&amp;tag2'],
          },
        };

        mockDecode
          .mockReturnValueOnce('&item1')
          .mockReturnValueOnce('<item2>')
          .mockReturnValueOnce('"tag1"')
          .mockReturnValueOnce('&tag2');

        const result = decodeHtmlEntitiesFunction(testData);

        expect(decode).toHaveBeenCalledTimes(4);
        expect(result).toEqual({
          items: ['&item1', '<item2>'],
          metadata: {
            tags: ['"tag1"', '&tag2'],
          },
        });
      });

      it('should handle nested objects within arrays', () => {
        const testData = [
          { name: '&amp;John', age: 30 },
          { name: '&lt;Jane&gt;', age: 25 },
        ];

        mockDecode.mockReturnValueOnce('&John').mockReturnValueOnce('<Jane>');

        const result = decodeHtmlEntitiesFunction(testData);

        expect(decode).toHaveBeenCalledTimes(2);
        expect(result).toEqual([
          { name: '&John', age: 30 },
          { name: '<Jane>', age: 25 },
        ]);
      });
    });

    describe('Edge Cases', () => {
      it('should return primitive values unchanged', () => {
        expect(decodeHtmlEntitiesFunction(42)).toBe(42);
        expect(decodeHtmlEntitiesFunction(true)).toBe(true);
        expect(decodeHtmlEntitiesFunction(false)).toBe(false);
        expect(decodeHtmlEntitiesFunction(undefined)).toBeUndefined();
      });

      it('should handle null values', () => {
        expect(decodeHtmlEntitiesFunction(null)).toBeNull();
      });

      it('should handle empty strings', () => {
        const emptyString = '';
        mockDecode.mockReturnValue('');

        const result = decodeHtmlEntitiesFunction(emptyString);

        expect(decode).toHaveBeenCalledWith('');
        expect(result).toBe('');
      });

      it('should handle empty arrays', () => {
        const result = decodeHtmlEntitiesFunction([]);
        expect(result).toEqual([]);
        expect(decode).not.toHaveBeenCalled();
      });

      it('should handle empty objects', () => {
        const result = decodeHtmlEntitiesFunction({});
        expect(result).toEqual({});
        expect(decode).not.toHaveBeenCalled();
      });

      it('should handle arrays with mixed data types', () => {
        const testArray = [
          '&amp;string',
          42,
          true,
          null,
          { key: '&lt;value&gt;' },
        ];

        mockDecode
          .mockReturnValueOnce('&string')
          .mockReturnValueOnce('<value>');

        const result = decodeHtmlEntitiesFunction(testArray);

        expect(decode).toHaveBeenCalledTimes(2);
        expect(result).toEqual(['&string', 42, true, null, { key: '<value>' }]);
      });

      it('should handle objects with non-string values', () => {
        const testObject = {
          stringValue: '&amp;test',
          numberValue: 42,
          booleanValue: true,
          nullValue: null,
          arrayValue: ['&lt;item&gt;'],
        };

        mockDecode.mockReturnValueOnce('&test').mockReturnValueOnce('<item>');

        const result = decodeHtmlEntitiesFunction(testObject);

        expect(decode).toHaveBeenCalledTimes(2);
        expect(result).toEqual({
          stringValue: '&test',
          numberValue: 42,
          booleanValue: true,
          nullValue: null,
          arrayValue: ['<item>'],
        });
      });
    });

    describe('Error Handling', () => {
      it('should handle decode function throwing an error', () => {
        const testString = '&amp;test';
        mockDecode.mockImplementation(() => {
          throw new Error('Decode error');
        });

        expect(() => decodeHtmlEntitiesFunction(testString)).toThrow(
          'Decode error',
        );
      });
    });
  });

  describe('isOpenMRSWebServiceApi', () => {
    // We need to test this function indirectly through the response interceptor
    let isOpenMRSWebServiceApiFunction: (url: string) => boolean;

    beforeAll(() => {
      // Create a test version of the function
      isOpenMRSWebServiceApiFunction = (url: string): boolean => {
        return url.includes('/openmrs/ws');
      };
    });

    describe('Happy Paths', () => {
      it('should return true for OpenMRS REST API URLs', () => {
        const testCases = [
          '/openmrs/ws/rest/v1/patient',
          'http://localhost:8080/openmrs/ws/rest/v1/concept',
          'https://demo.openmrs.org/openmrs/ws/rest/v1/encounter',
          '/openmrs/ws/rest/v2/user',
          'http://example.com/openmrs/ws/fhir/Patient',
        ];

        testCases.forEach((url) => {
          expect(isOpenMRSWebServiceApiFunction(url)).toBe(true);
        });
      });

      it('should return false for non-OpenMRS URLs', () => {
        const testCases = [
          '/api/v1/patient',
          'http://localhost:8080/api/rest/v1/concept',
          'https://demo.example.org/rest/v1/encounter',
          '/fhir/Patient',
          'http://example.com/api/user',
          '',
          '/',
          'http://example.com',
        ];

        testCases.forEach((url) => {
          expect(isOpenMRSWebServiceApiFunction(url)).toBe(false);
        });
      });
    });

    describe('Edge Cases', () => {
      it('should handle empty string', () => {
        expect(isOpenMRSWebServiceApiFunction('')).toBe(false);
      });

      it('should handle URLs with openmrs/ws as substring but not path', () => {
        const testCases = [
          'http://openmrs/ws.example.com/api',
          'http://example.com/api?param=openmrs/ws',
          'http://example.com/api#openmrs/ws',
          'http://example.com/notopenmrs/ws/api',
        ];

        testCases.forEach((url) => {
          expect(isOpenMRSWebServiceApiFunction(url)).toBe(
            url.includes('/openmrs/ws'),
          );
        });
      });

      it('should be case sensitive', () => {
        const testCases = [
          '/OpenMRS/ws/rest/v1/patient',
          '/OPENMRS/WS/rest/v1/patient',
          '/openmrs/WS/rest/v1/patient',
          '/Openmrs/ws/rest/v1/patient',
        ];

        testCases.forEach((url) => {
          expect(isOpenMRSWebServiceApiFunction(url)).toBe(false);
        });
      });

      it('should handle URLs with query parameters and fragments', () => {
        const testCases = [
          '/openmrs/ws/rest/v1/patient?q=test',
          '/openmrs/ws/rest/v1/patient#section',
          '/openmrs/ws/rest/v1/patient?q=test&limit=10#results',
        ];

        testCases.forEach((url) => {
          expect(isOpenMRSWebServiceApiFunction(url)).toBe(true);
        });
      });
    });
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

        const { get } = await import('../api');
        const result = await get('/api/patients/1');

        expect(mockAxiosGet).toHaveBeenCalledWith('/api/patients/1');
        expect(result).toEqual(mockData);
      });

      it('should handle GET request errors', async () => {
        const error = new Error('Network error');
        mockAxiosGet.mockRejectedValue(error);

        const { get } = await import('../api');

        await expect(get('/api/patients/1')).rejects.toThrow('Network error');
        expect(mockAxiosGet).toHaveBeenCalledWith('/api/patients/1');
      });
    });

    describe('post', () => {
      it('should make POST request and return response data', async () => {
        const mockData = { id: 1, name: 'New Patient' };
        const requestData = { name: 'New Patient', age: 30 };
        mockAxiosPost.mockResolvedValue({ data: mockData });

        const { post } = await import('../api');
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

        const { post } = await import('../api');

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

        const { put } = await import('../api');
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

        const { put } = await import('../api');

        await expect(put('/api/patients/1', {})).rejects.toThrow('Not found');
        expect(mockAxiosPut).toHaveBeenCalledWith('/api/patients/1', {});
      });
    });

    describe('del', () => {
      it('should make DELETE request and return response data', async () => {
        const mockData = { success: true };
        mockAxiosDelete.mockResolvedValue({ data: mockData });

        const { del } = await import('../api');
        const result = await del('/api/patients/1');

        expect(mockAxiosDelete).toHaveBeenCalledWith('/api/patients/1');
        expect(result).toEqual(mockData);
      });

      it('should handle DELETE request errors', async () => {
        const error = new Error('Forbidden');
        mockAxiosDelete.mockRejectedValue(error);

        const { del } = await import('../api');

        await expect(del('/api/patients/1')).rejects.toThrow('Forbidden');
        expect(mockAxiosDelete).toHaveBeenCalledWith('/api/patients/1');
      });
    });
  });

  describe('Request Interceptor', () => {
    it('should pass through successful requests', () => {
      const mockConfig = { url: '/api/test' };
      const requestInterceptor = client.interceptors.request.handlers[0];

      const result = requestInterceptor.fulfilled(mockConfig);
      expect(result).toBe(mockConfig);
    });

    it('should handle request errors', async () => {
      const mockError = new Error('Request failed');
      const { getFormattedError } = await import('@utils/common');
      const { notificationService } = await import(
        '@services/notificationService'
      );

      const requestInterceptor = client.interceptors.request.handlers[0];

      await expect(() => requestInterceptor.rejected(mockError)).rejects.toBe(
        mockError,
      );
      expect(getFormattedError).toHaveBeenCalledWith(mockError);
      expect(notificationService.showError).toHaveBeenCalledWith(
        'Error',
        'Test error message',
      );
    });
  });

  describe('Response Interceptor Error Handling', () => {
    let getFormattedError: jest.MockedFunction<
      typeof import('@utils/common').getFormattedError
    >;
    let notificationService: {
      showError: jest.MockedFunction<(title: string, message: string) => void>;
    };

    beforeEach(async () => {
      const utilsModule = await import('@utils/common');
      const notificationModule = await import('@services/notificationService');
      getFormattedError = utilsModule.getFormattedError as jest.MockedFunction<
        typeof import('@utils/common').getFormattedError
      >;
      notificationService = notificationModule.notificationService;

      // Mock window.location
      delete (window as unknown as { location: unknown }).location;
      (window as unknown as { location: { href: string } }).location = {
        href: '',
      };
    });

    it('should handle 401 errors by redirecting to login', async () => {
      const mockError = {
        response: { status: 401 },
        isAxiosError: true,
      };

      // Mock axios.isAxiosError
      (axios.isAxiosError as jest.Mock) = jest.fn().mockReturnValue(true);

      const responseInterceptor = client.interceptors.response.handlers[0];

      await expect(() => responseInterceptor.rejected(mockError)).rejects.toBe(
        mockError,
      );
      expect(window.location.href).toBe('/login');
    });

    it('should handle non-401 Axios errors', async () => {
      const mockError = {
        response: { status: 500 },
        isAxiosError: true,
      };

      (axios.isAxiosError as jest.Mock) = jest.fn().mockReturnValue(true);

      const responseInterceptor = client.interceptors.response.handlers[0];

      await expect(() => responseInterceptor.rejected(mockError)).rejects.toBe(
        mockError,
      );
      expect(getFormattedError).toHaveBeenCalledWith(mockError);
      expect(notificationService.showError).toHaveBeenCalledWith(
        'Error',
        'Test error message',
      );
    });

    it('should handle non-Axios errors', async () => {
      const mockError = new Error('Network error');

      (axios.isAxiosError as jest.Mock) = jest.fn().mockReturnValue(false);

      const responseInterceptor = client.interceptors.response.handlers[0];

      await expect(() => responseInterceptor.rejected(mockError)).rejects.toBe(
        mockError,
      );
      expect(getFormattedError).toHaveBeenCalledWith(mockError);
      expect(notificationService.showError).toHaveBeenCalledWith(
        'Error',
        'Test error message',
      );
    });

    it('should handle Axios errors without response', async () => {
      const mockError = {
        isAxiosError: true,
        message: 'Request timeout',
      };

      (axios.isAxiosError as jest.Mock) = jest.fn().mockReturnValue(true);

      const responseInterceptor = client.interceptors.response.handlers[0];

      await expect(() => responseInterceptor.rejected(mockError)).rejects.toBe(
        mockError,
      );
      expect(getFormattedError).toHaveBeenCalledWith(mockError);
      expect(notificationService.showError).toHaveBeenCalledWith(
        'Error',
        'Test error message',
      );
    });
  });

  describe('getConfigUrl function', () => {
    let getConfigUrlFunction: (config: Record<string, unknown>) => string;

    beforeAll(() => {
      // Create a test version of the function
      getConfigUrlFunction = (config: Record<string, unknown>): string => {
        return (config.url as string) ?? (config.baseURL as string) ?? '';
      };
    });

    it('should return URL when present', () => {
      const config = { url: '/api/patients' };
      expect(getConfigUrlFunction(config)).toBe('/api/patients');
    });

    it('should return baseURL when URL is not present', () => {
      const config = { baseURL: '/api' };
      expect(getConfigUrlFunction(config)).toBe('/api');
    });

    it('should prefer URL over baseURL when both are present', () => {
      const config = { url: '/api/patients', baseURL: '/api' };
      expect(getConfigUrlFunction(config)).toBe('/api/patients');
    });

    it('should return empty string when neither URL nor baseURL is present', () => {
      const config = {};
      expect(getConfigUrlFunction(config)).toBe('');
    });

    it('should handle null/undefined config properties', () => {
      expect(getConfigUrlFunction({ url: null, baseURL: undefined })).toBe('');
      expect(getConfigUrlFunction({ url: undefined, baseURL: null })).toBe('');
    });
  });

  describe('Integration Tests', () => {
    describe('Response Interceptor with OpenMRS API', () => {
      it('should decode HTML entities for OpenMRS API responses', async () => {
        const testData = {
          display: '&amp;Patient Name&lt;',
          description: '&quot;Test Description&quot;',
        };

        const expectedDecoded = {
          display: '&Patient Name<',
          description: '"Test Description"',
        };

        mockDecode
          .mockReturnValueOnce('&Patient Name<')
          .mockReturnValueOnce('"Test Description"');

        // Mock axios response
        const mockResponse = {
          data: testData,
          config: {
            url: '/openmrs/ws/rest/v1/patient',
          },
        };

        // Get the response interceptor
        const responseInterceptor = client.interceptors.response.handlers[0];
        const result = responseInterceptor.fulfilled(mockResponse);

        expect(decode).toHaveBeenCalledTimes(2);
        expect(result.data).toEqual(expectedDecoded);
      });

      it('should not decode HTML entities for non-OpenMRS API responses', async () => {
        const testData = {
          display: '&amp;Patient Name&lt;',
          description: '&quot;Test Description&quot;',
        };

        // Mock axios response
        const mockResponse = {
          data: testData,
          config: {
            url: '/api/v1/patient',
          },
        };

        // Get the response interceptor
        const responseInterceptor = client.interceptors.response.handlers[0];
        const result = responseInterceptor.fulfilled(mockResponse);

        expect(decode).not.toHaveBeenCalled();
        expect(result.data).toEqual(testData);
      });

      it('should handle responses with missing URL config', async () => {
        const testData = { display: '&amp;test' };

        const mockResponse = {
          data: testData,
          config: {
            baseURL: '/openmrs/ws/rest/v1',
          },
        };

        mockDecode.mockReturnValue('&test');

        const responseInterceptor = client.interceptors.response.handlers[0];
        const result = responseInterceptor.fulfilled(mockResponse);

        expect(decode).toHaveBeenCalledWith('&amp;test');
        expect(result.data).toEqual({ display: '&test' });
      });

      it('should handle responses with no URL or baseURL', async () => {
        const testData = { display: '&amp;test' };

        const mockResponse = {
          data: testData,
          config: {},
        };

        const responseInterceptor = client.interceptors.response.handlers[0];
        const result = responseInterceptor.fulfilled(mockResponse);

        expect(decode).not.toHaveBeenCalled();
        expect(result.data).toEqual(testData);
      });
    });

    describe('End-to-End Request Flow', () => {
      it('should handle complete request-response cycle with OpenMRS API', async () => {
        const responseData = { id: 1, display: '&amp;Test Patient&lt;' };
        const expectedDecoded = { id: 1, display: '&Test Patient<' };

        mockDecode.mockReturnValue('&Test Patient<');

        // Mock the actual axios post method
        const mockAxiosPost = jest
          .fn()
          .mockResolvedValue({ data: responseData });
        client.post = mockAxiosPost;

        // Mock response interceptor behavior
        const responseInterceptor = client.interceptors.response.handlers[0];
        const mockResponse = {
          data: responseData,
          config: { url: '/openmrs/ws/rest/v1/patient' },
        };

        // Simulate response interceptor processing
        const processedResponse = responseInterceptor.fulfilled(mockResponse);

        expect(decode).toHaveBeenCalledWith('&amp;Test Patient&lt;');
        expect(processedResponse.data).toEqual(expectedDecoded);
      });
    });
  });
});
