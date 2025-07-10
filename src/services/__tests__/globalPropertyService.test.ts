import { clearGlobalPropertyCache, getGlobalProperty, isAuditLogEnabled } from '../globalPropertyService';
import { GLOBAL_PROPERTY_URL } from '@constants/app';
import { AUDIT_LOG_GLOBAL_PROPERTY } from '@constants/auditLog';
import { AUDIT_LOG_ERROR_MESSAGES } from '@constants/errors';
import i18next from 'i18next';
import {get} from '../api';

// Mock dependencies
jest.mock('../api');
jest.mock('i18next');

const mockGet = get as jest.MockedFunction<typeof get>;
const mockI18next = i18next as jest.Mocked<typeof i18next>;

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
        `${GLOBAL_PROPERTY_URL}?property=test.property`
      );
      expect(result).toBe(mockValue);
    });

    it('should fetch and return boolean global property value as string', async () => {
      const mockValue = true;
      mockGet.mockResolvedValue(mockValue);

      const result = await getGlobalProperty('test.boolean.property');

      expect(mockGet).toHaveBeenCalledWith(
        `${GLOBAL_PROPERTY_URL}?property=test.boolean.property`
      );
      expect(result).toBe('true');
    });

    it('should fetch and return number global property value as string', async () => {
      const mockValue = 123;
      mockGet.mockResolvedValue(mockValue);

      const result = await getGlobalProperty('test.number.property');

      expect(mockGet).toHaveBeenCalledWith(
        `${GLOBAL_PROPERTY_URL}?property=test.number.property`
      );
      expect(result).toBe('123');
    });

    it('should return null when API returns null or undefined', async () => {
      mockGet.mockResolvedValue(null);

      const result = await getGlobalProperty('test.null.property');

      expect(mockGet).toHaveBeenCalledWith(
        `${GLOBAL_PROPERTY_URL}?property=test.null.property`
      );
      expect(result).toBe(null);
    });

    it('should return null when API returns undefined', async () => {
      mockGet.mockResolvedValue(undefined);

      const result = await getGlobalProperty('test.undefined.property');

      expect(mockGet).toHaveBeenCalledWith(
        `${GLOBAL_PROPERTY_URL}?property=test.undefined.property`
      );
      expect(result).toBe(null);
    });

    it('should return null when API returns empty string due to cache logic', async () => {
      const mockFreshGet = get as jest.MockedFunction<typeof get>;
      
      mockFreshGet.mockResolvedValue('');

      const result = await getGlobalProperty('test.empty.property');

      expect(mockFreshGet).toHaveBeenCalledWith(
        `${GLOBAL_PROPERTY_URL}?property=test.empty.property`
      );
      // Due to the cache logic `return globalPropertyCache.get(property) || null;`
      // empty strings are converted to null
      expect(result).toBe(null);
    });

    it('should handle API errors and return null', async () => {
      const mockError = new Error('API Error');
      mockGet.mockRejectedValue(mockError);
      mockI18next.t.mockReturnValue('Global property fetch failed for property: test.error.property');

      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      const result = await getGlobalProperty('test.error.property');

      expect(mockGet).toHaveBeenCalledWith(
        `${GLOBAL_PROPERTY_URL}?property=test.error.property`
      );
      expect(result).toBe(null);
      expect(mockI18next.t).toHaveBeenCalledWith(
        AUDIT_LOG_ERROR_MESSAGES.GLOBAL_PROPERTY_FETCH_FAILED,
        { property: 'test.error.property' }
      );
      expect(consoleSpy).toHaveBeenCalledWith(
        'Global property fetch failed for property: test.error.property',
        mockError
      );

      consoleSpy.mockRestore();
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
      expect(result1).toBe(null);

      // Second call should return from cache
      const result2 = await getGlobalProperty('test.null.cache.property');
      expect(mockFreshGet).toHaveBeenCalledTimes(1); // Still only called once
      expect(result2).toBe(null);
    });

    it('should handle different property names correctly', async () => {
      const testCases = [
        'simple.property',
        'complex.nested.property.name',
        'property-with-dashes',
        'property_with_underscores',
        'PropertyWithCamelCase',
        'property.with.123.numbers'
      ];

      for (const propertyName of testCases) {
        mockGet.mockResolvedValue(`value-for-${propertyName}`);
        
        const result = await getGlobalProperty(propertyName);
        
        expect(mockGet).toHaveBeenCalledWith(
          `${GLOBAL_PROPERTY_URL}?property=${propertyName}`
        );
        expect(result).toBe(`value-for-${propertyName}`);
        
        mockGet.mockClear();
      }
    });
  });

  describe('isAuditLogEnabled', () => {
    afterEach(() => {
      clearGlobalPropertyCache();
    });

    it('should return true when audit log property is "true"', async () => {
      const mockFreshGet = get as jest.MockedFunction<typeof get>;
      
      mockFreshGet.mockResolvedValue('true');

      const result = await isAuditLogEnabled();

      expect(mockFreshGet).toHaveBeenCalledWith(
        `${GLOBAL_PROPERTY_URL}?property=${AUDIT_LOG_GLOBAL_PROPERTY}`
      );
      expect(result).toBe(true);
    });

    it('should return false when audit log property is "false"', async () => {
      const mockFreshGet = get as jest.MockedFunction<typeof get>;
      
      mockFreshGet.mockResolvedValue('false');

      const result = await isAuditLogEnabled();

      expect(mockFreshGet).toHaveBeenCalledWith(
        `${GLOBAL_PROPERTY_URL}?property=${AUDIT_LOG_GLOBAL_PROPERTY}`
      );
      expect(result).toBe(false);
    });

    it('should return false when audit log property is null', async () => {
      const mockFreshGet = get as jest.MockedFunction<typeof get>;
      
      mockFreshGet.mockResolvedValue(null);

      const result = await isAuditLogEnabled();

      expect(result).toBe(false);
    });

    it('should return false when audit log property is any other string', async () => {
      const mockFreshGet = get as jest.MockedFunction<typeof get>;
      
      const testValues = ['True', 'TRUE', 'yes', 'enabled', '1', 'random-value'];

      for (const value of testValues) {
        mockFreshGet.mockResolvedValue(value);
        
        const result = await isAuditLogEnabled();
        
        expect(result).toBe(false);
        mockFreshGet.mockClear();
      }
    });

    it('should handle errors and return false', async () => {
      const mockFreshGet = get as jest.MockedFunction<typeof get>;
      
      const mockError = new Error('API Error');
      mockFreshGet.mockRejectedValue(mockError);

      const result = await isAuditLogEnabled();

      expect(result).toBe(false);
      // isAuditLogEnabled doesn't have its own error handling - it relies on getGlobalProperty
      // which handles errors internally and returns null, causing isAuditLogEnabled to return false
    });

    it('should use cached value from getGlobalProperty', async () => {
      const mockFreshGet = get as jest.MockedFunction<typeof get>;
      
      mockFreshGet.mockResolvedValue('true');

      // First call getGlobalProperty to cache the value
      await getGlobalProperty(AUDIT_LOG_GLOBAL_PROPERTY);
      expect(mockFreshGet).toHaveBeenCalledTimes(1);

      // Then call isAuditLogEnabled, which should use the cached value
      const result = await isAuditLogEnabled();
      expect(mockFreshGet).toHaveBeenCalledTimes(1); // Still only called once
      expect(result).toBe(true);
    });
  });

  describe('clearGlobalPropertyCache', () => {
    it('should clear the global property cache', async () => {
      const mockFreshGet = get as jest.MockedFunction<typeof get>;
      
      mockFreshGet.mockResolvedValue('true');
      
      // First call getGlobalProperty to cache the value
      await getGlobalProperty(AUDIT_LOG_GLOBAL_PROPERTY);
      expect(mockFreshGet).toHaveBeenCalledTimes(1);

      const result = await isAuditLogEnabled();
      expect(mockFreshGet).toHaveBeenCalledTimes(1);
      expect(result).toBe(true);

      clearGlobalPropertyCache();

      const anotherResult = await isAuditLogEnabled();
      expect(mockFreshGet).toHaveBeenCalledTimes(2); // Should call API again after cache clear
      expect(anotherResult).toBe(true);
    });
  });
});