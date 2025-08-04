import { decode } from 'html-entities';
import {
  decodeHtmlEntities,
  isOpenMRSWebServiceApi,
  getResponseUrl,
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
});
