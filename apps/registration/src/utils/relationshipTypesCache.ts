import type { RelationshipType } from '../components/forms/patientRelationships/RelationshipRow';

const CACHE_KEY = 'bahmni_relationship_types';
const CACHE_VERSION = '1.0';
const CACHE_EXPIRY_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

interface CachedData {
  version: string;
  timestamp: number;
  data: RelationshipType[];
}

/**
 * Saves relationship types to localStorage with timestamp and version
 */
export const saveRelationshipTypesToCache = (
  data: RelationshipType[],
): void => {
  try {
    const cacheData: CachedData = {
      version: CACHE_VERSION,
      timestamp: Date.now(),
      data,
    };
    localStorage.setItem(CACHE_KEY, JSON.stringify(cacheData));
  } catch {
    // Silently fail if localStorage is full or disabled
  }
};

/**
 * Retrieves relationship types from localStorage if valid
 * Returns null if cache is expired, invalid, or doesn't exist
 */
export const getRelationshipTypesFromCache = (): RelationshipType[] | null => {
  try {
    const cached = localStorage.getItem(CACHE_KEY);
    if (!cached) {
      return null;
    }

    const cacheData: CachedData = JSON.parse(cached);

    // Validate cache version
    if (cacheData.version !== CACHE_VERSION) {
      localStorage.removeItem(CACHE_KEY);
      return null;
    }

    // Check if cache is expired
    const age = Date.now() - cacheData.timestamp;
    if (age > CACHE_EXPIRY_MS) {
      localStorage.removeItem(CACHE_KEY);
      return null;
    }

    // Validate data structure
    if (
      !Array.isArray(cacheData.data) ||
      !cacheData.data.every(
        (item) =>
          item &&
          typeof item === 'object' &&
          typeof item.uuid === 'string' &&
          typeof item.aIsToB === 'string' &&
          typeof item.bIsToA === 'string',
      )
    ) {
      localStorage.removeItem(CACHE_KEY);
      return null;
    }

    return cacheData.data;
  } catch {
    // If any error occurs, clear the cache and return null
    try {
      localStorage.removeItem(CACHE_KEY);
    } catch {
      // Ignore errors when clearing cache
    }
    return null;
  }
};

/**
 * Clears the relationship types cache
 */
export const clearRelationshipTypesCache = (): void => {
  try {
    localStorage.removeItem(CACHE_KEY);
  } catch {
    // Silently fail if localStorage access is denied
  }
};
