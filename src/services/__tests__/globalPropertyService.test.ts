import { GLOBAL_PROPERTY_URL } from '@constants/app';
import { get } from '../api';
import { getGlobalProperty } from '../globalPropertyService';

// Mock dependencies
jest.mock('../api');
jest.mock('i18next');

const mockGet = get as jest.MockedFunction<typeof get>;

describe('globalPropertyService', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getGlobalProperty', () => {
    it('should fetch and return string global property value', async () => {
      const mockValue = 'test-string-value';
      mockGet.mockResolvedValue(mockValue);

      const result = await getGlobalProperty('test.property');

      expect(mockGet).toHaveBeenCalledWith(
        GLOBAL_PROPERTY_URL('test.property'),
      );
      expect(result).toBe(mockValue);
    });

    it('should fetch and return boolean global property value as string', async () => {
      const mockValue = true;
      mockGet.mockResolvedValue(mockValue);

      const result = await getGlobalProperty('test.boolean.property');

      expect(mockGet).toHaveBeenCalledWith(
        GLOBAL_PROPERTY_URL('test.boolean.property'),
      );
      expect(result).toBe('true');
    });

    it('should fetch and return number global property value as string', async () => {
      const mockValue = 123;
      mockGet.mockResolvedValue(mockValue);

      const result = await getGlobalProperty('test.number.property');

      expect(mockGet).toHaveBeenCalledWith(
        GLOBAL_PROPERTY_URL('test.number.property'),
      );
      expect(result).toBe('123');
    });

    it('should return null when API returns null or undefined', async () => {
      mockGet.mockResolvedValue(null);

      const result = await getGlobalProperty('test.null.property');

      expect(mockGet).toHaveBeenCalledWith(
        GLOBAL_PROPERTY_URL('test.null.property'),
      );
      expect(result).toBeNull();
    });

    it('should return null when API returns undefined', async () => {
      mockGet.mockResolvedValue(undefined);

      const result = await getGlobalProperty('test.undefined.property');

      expect(mockGet).toHaveBeenCalledWith(
        GLOBAL_PROPERTY_URL('test.undefined.property'),
      );
      expect(result).toBeNull();
    });

    it('should return null when API returns empty string due to cache logic', async () => {
      const mockFreshGet = get as jest.MockedFunction<typeof get>;

      mockFreshGet.mockResolvedValue('');

      const result = await getGlobalProperty('test.empty.property');

      expect(mockFreshGet).toHaveBeenCalledWith(
        GLOBAL_PROPERTY_URL('test.empty.property'),
      );
      // Due to the cache logic `return globalPropertyCache.get(property) || null;`
      // empty strings are converted to null
      expect(result).toBeNull();
    });

    it('should cache global property values and return from cache on subsequent calls', async () => {
      const mockFreshGet = get as jest.MockedFunction<typeof get>;

      const mockValue = 'cached-value';
      mockFreshGet.mockResolvedValue(mockValue);

      // First call should hit the API
      const result1 = await getGlobalProperty('test.cache.property');
      expect(mockFreshGet).toHaveBeenCalledTimes(1);
      expect(result1).toBe(mockValue);

      // Second call should return from cache
      const result2 = await getGlobalProperty('test.cache.property');
      expect(mockFreshGet).toHaveBeenCalledTimes(1); // Still only called once
      expect(result2).toBe(mockValue);
    });

    it('should cache null values and return from cache', async () => {
      const mockFreshGet = get as jest.MockedFunction<typeof get>;

      mockFreshGet.mockResolvedValue(null);

      // First call should hit the API
      const result1 = await getGlobalProperty('test.null.cache.property');
      expect(mockFreshGet).toHaveBeenCalledTimes(1);
      expect(result1).toBeNull();

      // Second call should return from cache
      const result2 = await getGlobalProperty('test.null.cache.property');
      expect(mockFreshGet).toHaveBeenCalledTimes(1); // Still only called once
      expect(result2).toBeNull();
    });

    it('should handle different property names correctly', async () => {
      const testCases = [
        'simple.property',
        'complex.nested.property.name',
        'property-with-dashes',
        'property_with_underscores',
        'PropertyWithCamelCase',
        'property.with.123.numbers',
      ];

      for (const propertyName of testCases) {
        mockGet.mockResolvedValue(`value-for-${propertyName}`);

        const result = await getGlobalProperty(propertyName);

        expect(mockGet).toHaveBeenCalledWith(GLOBAL_PROPERTY_URL(propertyName));
        expect(result).toBe(`value-for-${propertyName}`);

        mockGet.mockClear();
      }
    });
  });
});
