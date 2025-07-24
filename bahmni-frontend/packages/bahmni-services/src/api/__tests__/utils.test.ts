import axios from 'axios';
import { decode } from 'html-entities';
import {
  decodeHtmlEntities,
  isOpenMRSWebServiceApi,
  getResponseUrl,
  getFormattedError,
} from '../utils';

jest.mock('html-entities', () => ({
  decode: jest.fn(),
}));

const mockDecode = decode as jest.MockedFunction<typeof decode>;

describe('Utils', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('decodeHtmlEntities', () => {
    describe('Happy Paths', () => {
      it('should decode HTML entities in strings', () => {
        const testString = '&amp;test&lt;';
        const expectedDecoded = '&test<';

        mockDecode.mockReturnValue(expectedDecoded);

        const result = decodeHtmlEntities(testString);

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

        const result = decodeHtmlEntities(testArray);

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

        const result = decodeHtmlEntities(testObject);

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

        const result = decodeHtmlEntities(testData);

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

        const result = decodeHtmlEntities(testData);

        expect(decode).toHaveBeenCalledTimes(2);
        expect(result).toEqual([
          { name: '&John', age: 30 },
          { name: '<Jane>', age: 25 },
        ]);
      });
    });

    describe('Edge Cases', () => {
      it('should return primitive values unchanged', () => {
        expect(decodeHtmlEntities(42)).toBe(42);
        expect(decodeHtmlEntities(true)).toBe(true);
        expect(decodeHtmlEntities(false)).toBe(false);
        expect(decodeHtmlEntities(undefined)).toBeUndefined();
      });

      it('should handle null values', () => {
        expect(decodeHtmlEntities(null)).toBeNull();
      });

      it('should handle empty strings', () => {
        const emptyString = '';
        mockDecode.mockReturnValue('');

        const result = decodeHtmlEntities(emptyString);

        expect(decode).toHaveBeenCalledWith('');
        expect(result).toBe('');
      });

      it('should handle empty arrays', () => {
        const result = decodeHtmlEntities([]);
        expect(result).toEqual([]);
        expect(decode).not.toHaveBeenCalled();
      });

      it('should handle empty objects', () => {
        const result = decodeHtmlEntities({});
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

        const result = decodeHtmlEntities(testArray);

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

        const result = decodeHtmlEntities(testObject);

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

        expect(() => decodeHtmlEntities(testString)).toThrow('Decode error');
      });
    });
  });

  describe('isOpenMRSWebServiceApi', () => {
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
          expect(isOpenMRSWebServiceApi(url)).toBe(true);
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
          expect(isOpenMRSWebServiceApi(url)).toBe(false);
        });
      });
    });

    describe('Edge Cases', () => {
      it('should handle empty string', () => {
        expect(isOpenMRSWebServiceApi('')).toBe(false);
      });

      it('should handle URLs with openmrs/ws as substring but not path', () => {
        const testCases = [
          'http://openmrs/ws.example.com/api',
          'http://example.com/api?param=openmrs/ws',
          'http://example.com/api#openmrs/ws',
          'http://example.com/notopenmrs/ws/api',
        ];

        testCases.forEach((url) => {
          expect(isOpenMRSWebServiceApi(url)).toBe(url.includes('/openmrs/ws'));
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
          expect(isOpenMRSWebServiceApi(url)).toBe(false);
        });
      });

      it('should handle URLs with query parameters and fragments', () => {
        const testCases = [
          '/openmrs/ws/rest/v1/patient?q=test',
          '/openmrs/ws/rest/v1/patient#section',
          '/openmrs/ws/rest/v1/patient?q=test&limit=10#results',
        ];

        testCases.forEach((url) => {
          expect(isOpenMRSWebServiceApi(url)).toBe(true);
        });
      });
    });
  });

  describe('getResponseUrl', () => {
    it('should return URL when present', () => {
      const config = { url: '/api/patients' };
      expect(getResponseUrl(config)).toBe('/api/patients');
    });

    it('should return baseURL when URL is not present', () => {
      const config = { baseURL: '/api' };
      expect(getResponseUrl(config)).toBe('/api');
    });

    it('should prefer URL over baseURL when both are present', () => {
      const config = { url: '/api/patients', baseURL: '/api' };
      expect(getResponseUrl(config)).toBe('/api/patients');
    });

    it('should return empty string when neither URL nor baseURL is present', () => {
      const config = {};
      expect(getResponseUrl(config)).toBe('');
    });

    it('should handle null/undefined config properties', () => {
      expect(getResponseUrl({ url: undefined, baseURL: undefined })).toBe('');
      expect(getResponseUrl({ url: undefined })).toBe('');
      expect(getResponseUrl({ baseURL: undefined })).toBe('');
    });
  });

  describe('getFormattedError', () => {
    beforeEach(() => {
      // Mock axios.isAxiosError
      (axios.isAxiosError as unknown as jest.Mock) = jest.fn();
    });

    describe('Happy Paths', () => {
      it('should handle string errors', () => {
        const result = getFormattedError('Custom error message');
        expect(result).toEqual({
          title: 'Error',
          message: 'Custom error message',
        });
      });

      it('should handle Error instances', () => {
        const error = new Error('Test error');
        (axios.isAxiosError as unknown as jest.Mock).mockReturnValue(false);

        const result = getFormattedError(error);
        expect(result).toEqual({
          title: 'Error',
          message: 'Test error',
        });
      });

      it('should handle null/undefined errors', () => {
        expect(getFormattedError(null)).toEqual({
          title: 'Error',
          message: 'An unexpected error occurred',
        });

        expect(getFormattedError(undefined)).toEqual({
          title: 'Error',
          message: 'An unexpected error occurred',
        });
      });

      it('should handle unknown error types', () => {
        const result = getFormattedError({ someProperty: 'value' });
        expect(result).toEqual({
          title: 'Error',
          message: 'An unknown error occurred',
        });
      });
    });

    describe('Axios Error Handling', () => {
      beforeEach(() => {
        (axios.isAxiosError as unknown as jest.Mock).mockReturnValue(true);
      });

      it('should handle 400 Bad Request', () => {
        const error = {
          response: { status: 400 },
          isAxiosError: true,
        };

        const result = getFormattedError(error);
        expect(result).toEqual({
          title: 'Bad Request',
          message:
            'Invalid input parameters. Please check your request and try again.',
        });
      });

      it('should handle 401 Unauthorized', () => {
        const error = {
          response: { status: 401 },
          isAxiosError: true,
        };

        const result = getFormattedError(error);
        expect(result).toEqual({
          title: 'Unauthorized',
          message:
            'You are not authorized to perform this action. Please log in again.',
        });
      });

      it('should handle 403 Forbidden', () => {
        const error = {
          response: { status: 403 },
          isAxiosError: true,
        };

        const result = getFormattedError(error);
        expect(result).toEqual({
          title: 'Unauthorized',
          message:
            'You are not authorized to perform this action. Please log in again.',
        });
      });

      it('should handle 404 Not Found', () => {
        const error = {
          response: { status: 404 },
          isAxiosError: true,
        };

        const result = getFormattedError(error);
        expect(result).toEqual({
          title: 'Not Found',
          message: 'The requested resource was not found.',
        });
      });

      it('should handle 500 Server Error', () => {
        const error = {
          response: { status: 500 },
          isAxiosError: true,
        };

        const result = getFormattedError(error);
        expect(result).toEqual({
          title: 'Server Error',
          message: 'The server encountered an error. Please try again later.',
        });
      });

      it('should handle 502 Bad Gateway', () => {
        const error = {
          response: { status: 502 },
          isAxiosError: true,
        };

        const result = getFormattedError(error);
        expect(result).toEqual({
          title: 'Server Error',
          message: 'The server encountered an error. Please try again later.',
        });
      });

      it('should handle 503 Service Unavailable', () => {
        const error = {
          response: { status: 503 },
          isAxiosError: true,
        };

        const result = getFormattedError(error);
        expect(result).toEqual({
          title: 'Server Error',
          message: 'The server encountered an error. Please try again later.',
        });
      });

      it('should handle 504 Gateway Timeout', () => {
        const error = {
          response: { status: 504 },
          isAxiosError: true,
        };

        const result = getFormattedError(error);
        expect(result).toEqual({
          title: 'Server Error',
          message: 'The server encountered an error. Please try again later.',
        });
      });

      it('should handle unknown status codes with response data message', () => {
        const error = {
          response: {
            status: 418,
            data: { message: 'I am a teapot' },
          },
          message: 'Axios error message',
          isAxiosError: true,
        };

        const result = getFormattedError(error);
        expect(result).toEqual({
          title: 'Error',
          message: 'I am a teapot',
        });
      });

      it('should handle unknown status codes with axios message', () => {
        const error = {
          response: {
            status: 418,
            data: {},
          },
          message: 'Axios error message',
          isAxiosError: true,
        };

        const result = getFormattedError(error);
        expect(result).toEqual({
          title: 'Error',
          message: 'Axios error message',
        });
      });

      it('should handle unknown status codes with default message', () => {
        const error = {
          response: {
            status: 418,
            data: {},
          },
          isAxiosError: true,
        };

        const result = getFormattedError(error);
        expect(result).toEqual({
          title: 'Error',
          message: 'An unknown error occurred',
        });
      });

      it('should handle axios errors without response but with Error instance', () => {
        const error = new Error('Network timeout');
        (axios.isAxiosError as unknown as jest.Mock).mockReturnValue(true);

        const result = getFormattedError(error);
        expect(result).toEqual({
          title: 'Error',
          message: 'Network timeout',
        });
      });

      it('should handle axios errors without response and not Error instance', () => {
        const error = {
          isAxiosError: true,
          message: 'Request timeout',
        };

        const result = getFormattedError(error);
        expect(result).toEqual({
          title: 'Network Error',
          message:
            'Unable to connect to the server. Please check your internet connection.',
        });
      });
    });
  });
});
