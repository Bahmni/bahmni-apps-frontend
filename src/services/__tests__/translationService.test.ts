import {
  getTranslations,
  getUserPreferredLocale,
  getTranslationFile,
} from '../translationService';
import {
  BUNDLED_TRANSLATIONS_URL_TEMPLATE,
  LOCALE_STORAGE_KEY,
  DEFAULT_LOCALE,
} from '@constants/app';
import notificationService from '../notificationService';
import axios from 'axios';
import { CONFIG_TRANSLATIONS_URL_TEMPLATE } from '@constants/config';

// Mock dependencies
jest.mock('../notificationService');
jest.mock('@utils/common');
jest.mock('axios');

describe('Translation Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(console, 'error').mockImplementation(() => {});
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

  describe('getTranslationFile', () => {
    beforeEach(() => {
      jest.clearAllMocks();
      jest.spyOn(console, 'error').mockImplementation(() => {});
    });

    afterEach(() => {
      jest.restoreAllMocks();
    });

    // Happy Path
    it('should successfully fetch and return translation data', async () => {
      // Arrange
      const mockData = { key1: 'value1', key2: 'value2' };
      (axios.get as jest.Mock).mockResolvedValue({ data: mockData });

      // Act
      const url = 'http://example.com/translations';
      const result = await getTranslationFile(url);

      // Assert
      expect(result).toEqual(mockData);
      expect(axios.get).toHaveBeenCalledWith(url);
      // eslint-disable-next-line no-console
      expect(console.error).not.toHaveBeenCalled();
    });

    // Error Cases
    it('should return empty object and log error when request fails', async () => {
      // Arrange
      const error = new Error('Network error');
      (axios.get as jest.Mock).mockRejectedValue(error);

      // Act
      const url = 'http://example.com/translations';
      const result = await getTranslationFile(url);

      // Assert
      expect(result).toEqual({});
      expect(axios.get).toHaveBeenCalledWith(url);
      // eslint-disable-next-line no-console
      expect(console.error).toHaveBeenCalledWith(
        `Failed to load translations from ${url}:`,
        error,
      );
    });

    it('should return empty object when response is invalid', async () => {
      // Arrange
      (axios.get as jest.Mock).mockResolvedValue({ data: null });

      // Act
      const url = 'http://example.com/translations';
      const result = await getTranslationFile(url);

      // Assert
      expect(result).toEqual({});
      expect(axios.get).toHaveBeenCalledWith(url);
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

      // Mock axios responses
      (axios.get as jest.Mock).mockImplementation((url: string) => {
        if (url === configUrl) {
          return Promise.resolve({ data: configTranslations });
        } else if (url === bundledUrl) {
          return Promise.resolve({ data: bundledTranslations });
        }
        return Promise.reject(new Error('Unexpected URL'));
      });

      // Act
      const result = await getTranslations(language, namespace);

      // Assert
      expect(axios.get).toHaveBeenCalledWith(configUrl);
      expect(axios.get).toHaveBeenCalledWith(bundledUrl);

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

      // Mock axios responses
      (axios.get as jest.Mock).mockImplementation((url: string) => {
        if (url === esConfigUrl || url === esBundledUrl) {
          return Promise.resolve({ data: esTranslations });
        } else if (url === enConfigUrl || url === enBundledUrl) {
          return Promise.resolve({ data: enTranslations });
        }
        return Promise.reject(new Error('Unexpected URL'));
      });

      // Act
      const result = await getTranslations(language, namespace);

      // Assert
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

      // Mock axios responses
      (axios.get as jest.Mock).mockResolvedValue({ data: translations });

      // Act
      const result = await getTranslations(language, namespace);

      // Assert
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

      // Mock axios responses - both return empty objects
      (axios.get as jest.Mock).mockResolvedValue({ data: {} });

      // Act
      const result = await getTranslations(language, namespace);

      // Assert
      expect(result).toEqual({
        [language]: {
          [namespace]: {},
        },
      });
    });

    it('should handle failed requests gracefully', async () => {
      // Arrange
      const language = 'en';
      const namespace = 'clinical';

      // Mock axios to simulate failed requests
      (axios.get as jest.Mock).mockRejectedValue(new Error('Network error'));

      // Act
      const result = await getTranslations(language, namespace);

      // Assert
      expect(result).toEqual({
        [language]: {
          [namespace]: {},
        },
      });
    });
  });
});
