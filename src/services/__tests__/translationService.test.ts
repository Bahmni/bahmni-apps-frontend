import { getMergedTranslations } from '../translationService';
import {
  CONFIG_TRANSLATIONS_URL_TEMPLATE,
  BUNDLED_TRANSLATIONS_URL_TEMPLATE,
} from '@constants/i18n';

// Mock the global fetch function
const mockFetch = jest.fn();
global.fetch = mockFetch;

describe('Translation Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getMergedTranslations', () => {
    it('should fetch and merge translations from both sources', async () => {
      // Arrange
      const language = 'en';
      const configUrl = CONFIG_TRANSLATIONS_URL_TEMPLATE.replace(
        '{{lng}}',
        language,
      );
      const bundledUrl = BUNDLED_TRANSLATIONS_URL_TEMPLATE.replace(
        '{{lng}}',
        language,
      );

      const configTranslations = {
        key1: 'Config Value 1',
        key3: 'Config Value 3',
      };

      const bundledTranslations = {
        key1: 'Bundled Value 1',
        key2: 'Bundled Value 2',
      };

      // Mock fetch responses
      mockFetch.mockImplementation((url) => {
        if (url === configUrl) {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve(configTranslations),
          });
        } else if (url === bundledUrl) {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve(bundledTranslations),
          });
        }
        return Promise.reject(new Error('Unexpected URL'));
      });

      // Act
      const result = await getMergedTranslations(language);

      // Assert
      expect(mockFetch).toHaveBeenCalledTimes(2);
      expect(mockFetch).toHaveBeenCalledWith(configUrl);
      expect(mockFetch).toHaveBeenCalledWith(bundledUrl);

      // Config translations should override bundled translations
      expect(result).toEqual({
        key1: 'Config Value 1', // From config (overrides bundled)
        key2: 'Bundled Value 2', // From bundled only
        key3: 'Config Value 3', // From config only
      });
    });

    it('should handle failure of config translations source', async () => {
      // Arrange
      const language = 'en';
      const configUrl = CONFIG_TRANSLATIONS_URL_TEMPLATE.replace(
        '{{lng}}',
        language,
      );
      const bundledUrl = BUNDLED_TRANSLATIONS_URL_TEMPLATE.replace(
        '{{lng}}',
        language,
      );

      const bundledTranslations = {
        key1: 'Bundled Value 1',
        key2: 'Bundled Value 2',
      };

      // Mock fetch responses
      mockFetch.mockImplementation((url) => {
        if (url === configUrl) {
          return Promise.resolve({
            ok: false,
            status: 404,
          });
        } else if (url === bundledUrl) {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve(bundledTranslations),
          });
        }
        return Promise.reject(new Error('Unexpected URL'));
      });

      // Spy on console.warn
      const consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation();

      // Act
      const result = await getMergedTranslations(language);

      // Assert
      expect(mockFetch).toHaveBeenCalledTimes(2);
      expect(consoleWarnSpy).toHaveBeenCalledWith(
        `Failed to load translations from ${configUrl} with status 404`,
      );

      // Should still have bundled translations
      expect(result).toEqual(bundledTranslations);

      // Restore console.warn
      consoleWarnSpy.mockRestore();
    });

    it('should handle failure of bundled translations source', async () => {
      // Arrange
      const language = 'en';
      const configUrl = CONFIG_TRANSLATIONS_URL_TEMPLATE.replace(
        '{{lng}}',
        language,
      );
      const bundledUrl = BUNDLED_TRANSLATIONS_URL_TEMPLATE.replace(
        '{{lng}}',
        language,
      );

      const configTranslations = {
        key1: 'Config Value 1',
        key3: 'Config Value 3',
      };

      // Mock fetch responses
      mockFetch.mockImplementation((url) => {
        if (url === configUrl) {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve(configTranslations),
          });
        } else if (url === bundledUrl) {
          return Promise.resolve({
            ok: false,
            status: 500,
          });
        }
        return Promise.reject(new Error('Unexpected URL'));
      });

      // Spy on console.warn
      const consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation();

      // Act
      const result = await getMergedTranslations(language);

      // Assert
      expect(mockFetch).toHaveBeenCalledTimes(2);
      expect(consoleWarnSpy).toHaveBeenCalledWith(
        `Failed to load translations from ${bundledUrl} with status 500`,
      );

      // Should still have config translations
      expect(result).toEqual(configTranslations);

      // Restore console.warn
      consoleWarnSpy.mockRestore();
    });

    it('should handle network errors for config translations', async () => {
      // Arrange
      const language = 'en';
      const configUrl = CONFIG_TRANSLATIONS_URL_TEMPLATE.replace(
        '{{lng}}',
        language,
      );
      const bundledUrl = BUNDLED_TRANSLATIONS_URL_TEMPLATE.replace(
        '{{lng}}',
        language,
      );

      const bundledTranslations = {
        key1: 'Bundled Value 1',
        key2: 'Bundled Value 2',
      };

      const networkError = new Error('Network error');

      // Mock fetch responses
      mockFetch.mockImplementation((url) => {
        if (url === configUrl) {
          return Promise.reject(networkError);
        } else if (url === bundledUrl) {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve(bundledTranslations),
          });
        }
        return Promise.reject(new Error('Unexpected URL'));
      });

      // Spy on console.warn
      const consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation();

      // Act
      const result = await getMergedTranslations(language);

      // Assert
      expect(mockFetch).toHaveBeenCalledTimes(2);
      expect(consoleWarnSpy).toHaveBeenCalledWith(
        `Failed to load translations from ${configUrl}:`,
        networkError,
      );

      // Should still have bundled translations
      expect(result).toEqual(bundledTranslations);

      // Restore console.warn
      consoleWarnSpy.mockRestore();
    });

    it('should handle network errors for bundled translations', async () => {
      // Arrange
      const language = 'en';
      const configUrl = CONFIG_TRANSLATIONS_URL_TEMPLATE.replace(
        '{{lng}}',
        language,
      );
      const bundledUrl = BUNDLED_TRANSLATIONS_URL_TEMPLATE.replace(
        '{{lng}}',
        language,
      );

      const configTranslations = {
        key1: 'Config Value 1',
        key3: 'Config Value 3',
      };

      const networkError = new Error('Network error');

      // Mock fetch responses
      mockFetch.mockImplementation((url) => {
        if (url === configUrl) {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve(configTranslations),
          });
        } else if (url === bundledUrl) {
          return Promise.reject(networkError);
        }
        return Promise.reject(new Error('Unexpected URL'));
      });

      // Spy on console.warn
      const consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation();

      // Act
      const result = await getMergedTranslations(language);

      // Assert
      expect(mockFetch).toHaveBeenCalledTimes(2);
      expect(consoleWarnSpy).toHaveBeenCalledWith(
        `Failed to load translations from ${bundledUrl}:`,
        networkError,
      );

      // Should still have config translations
      expect(result).toEqual(configTranslations);

      // Restore console.warn
      consoleWarnSpy.mockRestore();
    });

    it('should handle failure of both translation sources', async () => {
      // Arrange
      const language = 'en';
      const configUrl = CONFIG_TRANSLATIONS_URL_TEMPLATE.replace(
        '{{lng}}',
        language,
      );
      const bundledUrl = BUNDLED_TRANSLATIONS_URL_TEMPLATE.replace(
        '{{lng}}',
        language,
      );

      // Mock fetch responses
      mockFetch.mockImplementation((url) => {
        if (url === configUrl) {
          return Promise.resolve({
            ok: false,
            status: 404,
          });
        } else if (url === bundledUrl) {
          return Promise.resolve({
            ok: false,
            status: 500,
          });
        }
        return Promise.reject(new Error('Unexpected URL'));
      });

      // Spy on console.warn
      const consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation();

      // Act
      const result = await getMergedTranslations(language);

      // Assert
      expect(mockFetch).toHaveBeenCalledTimes(2);
      expect(consoleWarnSpy).toHaveBeenCalledTimes(2);

      // Should return empty object when both sources fail
      expect(result).toEqual({});

      // Restore console.warn
      consoleWarnSpy.mockRestore();
    });

    it('should handle JSON parsing errors', async () => {
      // Arrange
      const language = 'en';
      const configUrl = CONFIG_TRANSLATIONS_URL_TEMPLATE.replace(
        '{{lng}}',
        language,
      );
      const bundledUrl = BUNDLED_TRANSLATIONS_URL_TEMPLATE.replace(
        '{{lng}}',
        language,
      );

      const jsonError = new Error('Invalid JSON');

      // Mock fetch responses
      mockFetch.mockImplementation((url) => {
        if (url === configUrl) {
          return Promise.resolve({
            ok: true,
            json: () => Promise.reject(jsonError),
          });
        } else if (url === bundledUrl) {
          return Promise.resolve({
            ok: true,
            json: () => Promise.reject(jsonError),
          });
        }
        return Promise.reject(new Error('Unexpected URL'));
      });

      // Spy on console.warn
      const consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation();

      // Act
      const result = await getMergedTranslations(language);

      // Assert
      expect(mockFetch).toHaveBeenCalledTimes(2);
      expect(consoleWarnSpy).toHaveBeenCalledTimes(2);

      // Should return empty object when both sources fail
      expect(result).toEqual({});

      // Restore console.warn
      consoleWarnSpy.mockRestore();
    });

    it('should correctly replace language code in URLs', async () => {
      // Arrange
      const language = 'fr';
      const configUrl = CONFIG_TRANSLATIONS_URL_TEMPLATE.replace(
        '{{lng}}',
        language,
      );
      const bundledUrl = BUNDLED_TRANSLATIONS_URL_TEMPLATE.replace(
        '{{lng}}',
        language,
      );

      // Mock fetch responses
      mockFetch.mockImplementation(() => {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({}),
        });
      });

      // Act
      await getMergedTranslations(language);

      // Assert
      expect(mockFetch).toHaveBeenCalledTimes(2);
      expect(mockFetch).toHaveBeenCalledWith(configUrl);
      expect(mockFetch).toHaveBeenCalledWith(bundledUrl);
    });
  });
});
