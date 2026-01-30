import type { RelationshipType } from '../../components/forms/patientRelationships/RelationshipRow';
import {
  clearRelationshipTypesCache,
  getRelationshipTypesFromCache,
  saveRelationshipTypesToCache,
} from '../relationshipTypesCache';

describe('relationshipTypesCache', () => {
  const mockRelationshipTypes: RelationshipType[] = [
    { uuid: 'type1', aIsToB: 'Parent', bIsToA: 'Child' },
    { uuid: 'type2', aIsToB: 'Sibling', bIsToA: 'Sibling' },
  ];

  beforeEach(() => {
    localStorage.clear();
    jest.clearAllMocks();
    jest.restoreAllMocks();
  });

  afterEach(() => {
    localStorage.clear();
    jest.restoreAllMocks();
  });

  describe('saveRelationshipTypesToCache', () => {
    it('should save relationship types to localStorage', () => {
      saveRelationshipTypesToCache(mockRelationshipTypes);

      const cached = localStorage.getItem('bahmni_relationship_types');
      expect(cached).not.toBeNull();

      const parsedCache = JSON.parse(cached!);
      expect(parsedCache.data).toEqual(mockRelationshipTypes);
      expect(parsedCache.version).toBe('1.0');
      expect(parsedCache.timestamp).toBeGreaterThan(0);
    });

    it('should handle localStorage errors gracefully', () => {
      const setItemSpy = jest
        .spyOn(Storage.prototype, 'setItem')
        .mockImplementation(() => {
          throw new Error('localStorage is full');
        });

      expect(() => {
        saveRelationshipTypesToCache(mockRelationshipTypes);
      }).not.toThrow();

      setItemSpy.mockRestore();
    });
  });

  describe('getRelationshipTypesFromCache', () => {
    it('should retrieve valid cached data', () => {
      saveRelationshipTypesToCache(mockRelationshipTypes);

      const retrieved = getRelationshipTypesFromCache();
      expect(retrieved).toEqual(mockRelationshipTypes);
    });

    it('should return null when cache does not exist', () => {
      const retrieved = getRelationshipTypesFromCache();
      expect(retrieved).toBeNull();
    });

    it('should return null and clear cache when version is outdated', () => {
      const outdatedCache = {
        version: '0.9',
        timestamp: Date.now(),
        data: mockRelationshipTypes,
      };
      localStorage.setItem(
        'bahmni_relationship_types',
        JSON.stringify(outdatedCache),
      );

      const retrieved = getRelationshipTypesFromCache();
      expect(retrieved).toBeNull();
      expect(localStorage.getItem('bahmni_relationship_types')).toBeNull();
    });

    it('should return null and clear cache when data is expired', () => {
      const expiredCache = {
        version: '1.0',
        timestamp: Date.now() - 8 * 24 * 60 * 60 * 1000, // 8 days ago
        data: mockRelationshipTypes,
      };
      localStorage.setItem(
        'bahmni_relationship_types',
        JSON.stringify(expiredCache),
      );

      const retrieved = getRelationshipTypesFromCache();
      expect(retrieved).toBeNull();
      expect(localStorage.getItem('bahmni_relationship_types')).toBeNull();
    });

    it('should return null and clear cache when data structure is invalid', () => {
      const invalidCache = {
        version: '1.0',
        timestamp: Date.now(),
        data: [{ invalid: 'structure' }],
      };
      localStorage.setItem(
        'bahmni_relationship_types',
        JSON.stringify(invalidCache),
      );

      const retrieved = getRelationshipTypesFromCache();
      expect(retrieved).toBeNull();
      expect(localStorage.getItem('bahmni_relationship_types')).toBeNull();
    });

    it('should return null and clear cache when data is not an array', () => {
      const invalidCache = {
        version: '1.0',
        timestamp: Date.now(),
        data: 'not an array',
      };
      localStorage.setItem(
        'bahmni_relationship_types',
        JSON.stringify(invalidCache),
      );

      const retrieved = getRelationshipTypesFromCache();
      expect(retrieved).toBeNull();
      expect(localStorage.getItem('bahmni_relationship_types')).toBeNull();
    });

    it('should return null and clear cache when property types are invalid', () => {
      const invalidCache = {
        version: '1.0',
        timestamp: Date.now(),
        data: [
          { uuid: 123, aIsToB: 'Parent', bIsToA: 'Child' }, // uuid is number, not string
        ],
      };
      localStorage.setItem(
        'bahmni_relationship_types',
        JSON.stringify(invalidCache),
      );

      const retrieved = getRelationshipTypesFromCache();
      expect(retrieved).toBeNull();
      expect(localStorage.getItem('bahmni_relationship_types')).toBeNull();
    });

    it('should handle JSON parse errors gracefully', () => {
      localStorage.setItem('bahmni_relationship_types', 'invalid json');

      const retrieved = getRelationshipTypesFromCache();
      expect(retrieved).toBeNull();
    });

    it('should handle localStorage getItem errors gracefully', () => {
      const getItemSpy = jest
        .spyOn(Storage.prototype, 'getItem')
        .mockImplementation(() => {
          throw new Error('localStorage access denied');
        });

      const retrieved = getRelationshipTypesFromCache();
      expect(retrieved).toBeNull();

      getItemSpy.mockRestore();
    });
  });

  describe('clearRelationshipTypesCache', () => {
    it('should clear the cache from localStorage', () => {
      saveRelationshipTypesToCache(mockRelationshipTypes);
      expect(localStorage.getItem('bahmni_relationship_types')).not.toBeNull();

      clearRelationshipTypesCache();
      expect(localStorage.getItem('bahmni_relationship_types')).toBeNull();
    });

    it('should handle localStorage errors gracefully', () => {
      const removeItemSpy = jest
        .spyOn(Storage.prototype, 'removeItem')
        .mockImplementation(() => {
          throw new Error('localStorage access denied');
        });

      expect(() => {
        clearRelationshipTypesCache();
      }).not.toThrow();

      removeItemSpy.mockRestore();
    });
  });

  describe('Cache integration', () => {
    it('should save and retrieve data correctly', () => {
      saveRelationshipTypesToCache(mockRelationshipTypes);
      const retrieved = getRelationshipTypesFromCache();

      expect(retrieved).toEqual(mockRelationshipTypes);
    });

    it('should handle cache lifecycle correctly', () => {
      // Cache is empty initially
      expect(getRelationshipTypesFromCache()).toBeNull();

      // Save data
      saveRelationshipTypesToCache(mockRelationshipTypes);
      expect(getRelationshipTypesFromCache()).toEqual(mockRelationshipTypes);

      // Clear cache
      clearRelationshipTypesCache();
      expect(getRelationshipTypesFromCache()).toBeNull();
    });
  });
});
