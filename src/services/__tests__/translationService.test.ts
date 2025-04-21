import { getTranslations, getUserPreferredLocale } from '../translationService';
import {
  CONFIG_TRANSLATIONS_URL_TEMPLATE,
  BUNDLED_TRANSLATIONS_URL_TEMPLATE,
  LOCALE_STORAGE_KEY,
  DEFAULT_LOCALE,
} from '@constants/app';
import notificationService from '../notificationService';
import * as apiService from '../api';

// Mock dependencies
jest.mock('../notificationService');
jest.mock('@utils/common');
jest.mock('../api');

describe('Translation Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getUserPreferredLocale', () => {
    beforeEach(() => {
      // Reset mocks before each test
      jest.clearAllMocks();

      // Mock localStorage
      Object.defineProperty(window, 'localStorage', {
        value: {
          getItem: jest.fn(),
          setItem: jest.fn(),
          clear: jest.fn(),
        },
        writable: true,
      });

      // Mock Intl.getCanonicalLocales
      global.Intl.getCanonicalLocales = jest
        .fn()
        .mockImplementation((locale) => {
          if (locale === 'invalid') {
            throw new Error('Invalid language tag');
          }
          return [locale];
        });
    });

    it('should return DEFAULT_LOCALE when no localStorage value is found', () => {
      // Arrange
      (localStorage.getItem as jest.Mock).mockReturnValue(null);

      // Act
      const result = getUserPreferredLocale();

      // Assert
      expect(localStorage.getItem).toHaveBeenCalledWith(LOCALE_STORAGE_KEY);
      expect(result).toBe(DEFAULT_LOCALE);
      expect(notificationService.showError).not.toHaveBeenCalled();
    });
  });

  describe('getTranslations', () => {
    beforeEach(() => {
      jest.clearAllMocks();
    });

    // Happy Path Tests
    it('should fetch and merge translations for requested language', async () => {
      // Arrange
      const language = 'en';
      const namespace = 'clinical';
      const configUrl = CONFIG_TRANSLATIONS_URL_TEMPLATE(language);
      const bundledUrl = BUNDLED_TRANSLATIONS_URL_TEMPLATE(language);

      const configTranslations = {
        key1: 'Config Value 1',
        key3: 'Config Value 3',
      };

      const bundledTranslations = {
        key1: 'Bundled Value 1',
        key2: 'Bundled Value 2',
      };

      // Mock API responses
      jest.spyOn(apiService, 'get').mockImplementation((url: string) => {
        if (url === configUrl) {
          return Promise.resolve(configTranslations);
        } else if (url === bundledUrl) {
          return Promise.resolve(bundledTranslations);
        }
        return Promise.reject(new Error('Unexpected URL'));
      });

      // Act
      const result = await getTranslations(language, namespace);

      // Assert
      expect(apiService.get).toHaveBeenCalledTimes(2);
      expect(apiService.get).toHaveBeenCalledWith(configUrl);
      expect(apiService.get).toHaveBeenCalledWith(bundledUrl);

      // Config translations should override bundled translations
      expect(result).toEqual({
        [language]: {
          [namespace]: {
            key1: 'Config Value 1', // From config (overrides bundled)
            key2: 'Bundled Value 2', // From bundled only
            key3: 'Config Value 3', // From config only
          },
        },
      });
    });

    it('should include English fallback for non-English languages', async () => {
      // Arrange
      const language = 'es';
      const namespace = 'clinical';
      const esConfigUrl = CONFIG_TRANSLATIONS_URL_TEMPLATE(language);
      const esBundledUrl = BUNDLED_TRANSLATIONS_URL_TEMPLATE(language);
      const enConfigUrl = CONFIG_TRANSLATIONS_URL_TEMPLATE('en');
      const enBundledUrl = BUNDLED_TRANSLATIONS_URL_TEMPLATE('en');

      const esTranslations = { key1: 'Spanish Value' };
      const enTranslations = {
        key1: 'English Value',
        key2: 'Another English Value',
      };

      // Mock API responses
      jest.spyOn(apiService, 'get').mockImplementation((url: string) => {
        if (url === esConfigUrl || url === esBundledUrl) {
          return Promise.resolve(esTranslations);
        } else if (url === enConfigUrl || url === enBundledUrl) {
          return Promise.resolve(enTranslations);
        }
        return Promise.reject(new Error('Unexpected URL'));
      });

      // Act
      const result = await getTranslations(language, namespace);

      // Assert
      expect(apiService.get).toHaveBeenCalledTimes(4); // 2 for Spanish, 2 for English fallback
      expect(result).toEqual({
        [language]: {
          [namespace]: { ...esTranslations },
        },
        en: {
          [namespace]: { ...enTranslations },
        },
      });
    });

    it('should not fetch English fallback when language is English', async () => {
      // Arrange
      const language = 'en';
      const namespace = 'clinical';
      const translations = { key1: 'English Value' };

      // Mock API responses
      jest.spyOn(apiService, 'get').mockResolvedValue(translations);

      // Act
      const result = await getTranslations(language, namespace);

      // Assert
      expect(apiService.get).toHaveBeenCalledTimes(2); // Only for English, no fallback
      expect(result).toEqual({
        en: {
          [namespace]: { ...translations },
        },
      });
    });

    // Sad Path Tests

    it('should handle empty translation objects', async () => {
      // Arrange
      const language = 'en';
      const namespace = 'clinical';

      // Mock API responses - both return empty objects
      jest.spyOn(apiService, 'get').mockResolvedValue({});

      // Act
      const result = await getTranslations(language, namespace);

      // Assert
      expect(apiService.get).toHaveBeenCalledTimes(2);
      expect(result).toEqual({
        [language]: {
          [namespace]: {},
        },
      });
    });

    it('should handle non-string values in translation objects', async () => {
      // Arrange
      const language = 'en';
      const namespace = 'clinical';

      // Mock API responses with non-string values
      const mixedTranslations = {
        key1: 'String value',
        key2: 123,
        key3: true,
        key4: { nested: 'object' },
      };

      jest
        .spyOn(apiService, 'get')
        .mockResolvedValue(
          mixedTranslations as unknown as Record<string, string>,
        );

      // Act
      const result = await getTranslations(language, namespace);

      // Assert
      expect(apiService.get).toHaveBeenCalledTimes(2);
      expect(result).toEqual({
        [language]: {
          [namespace]: mixedTranslations,
        },
      });
    });
  });
});
