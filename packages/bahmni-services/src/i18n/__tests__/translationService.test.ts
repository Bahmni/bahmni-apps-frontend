import { get } from '../../api';
import {
  BUNDLED_TRANSLATIONS_URL_TEMPLATE,
  LOCALE_STORAGE_KEY,
  DEFAULT_LOCALE,
  CONFIG_TRANSLATIONS_URL_TEMPLATE,
} from '../constants';
import {
  getTranslations,
  getUserPreferredLocale,
  getTranslationFile,
} from '../translationService';

jest.mock('../../api');

const mockGet = get as jest.MockedFunction<typeof get>;

describe('Translation Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  describe('getUserPreferredLocale', () => {
    beforeEach(() => {
      jest.clearAllMocks();

      Object.defineProperty(globalThis, 'localStorage', {
        value: {
          getItem: jest.fn(),
          setItem: jest.fn(),
          clear: jest.fn(),
        },
        writable: true,
      });

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
      (localStorage.getItem as jest.Mock).mockReturnValue(null);

      const result = getUserPreferredLocale();

      expect(localStorage.getItem).toHaveBeenCalledWith(LOCALE_STORAGE_KEY);
      expect(result).toBe(DEFAULT_LOCALE);
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

    it('should successfully fetch and return translation data', async () => {
      const mockData = { key1: 'value1', key2: 'value2' };
      mockGet.mockResolvedValue(mockData);

      const url = 'http://example.com/translations';
      const result = await getTranslationFile(url);

      expect(result).toEqual(mockData);
      expect(mockGet).toHaveBeenCalledWith(url);
      // eslint-disable-next-line no-console
      expect(console.error).not.toHaveBeenCalled();
    });

    it('should return empty object and log error when request fails', async () => {
      const error = new Error('Network error');
      mockGet.mockRejectedValue(error);

      const url = 'http://example.com/translations';
      const result = await getTranslationFile(url);

      expect(result).toEqual({});
      expect(mockGet).toHaveBeenCalledWith(url);
      // eslint-disable-next-line no-console
      expect(console.error).toHaveBeenCalledWith(
        `Failed to load translations from ${url}:`,
        error,
      );
    });

    it('should return empty object when response is invalid', async () => {
      mockGet.mockResolvedValue(null);

      const url = 'http://example.com/translations';
      const result = await getTranslationFile(url);

      expect(result).toEqual({});
      expect(mockGet).toHaveBeenCalledWith(url);
    });
  });

  describe('getTranslations', () => {
    beforeEach(() => {
      jest.clearAllMocks();
    });

    it('should fetch and merge translations for requested language', async () => {
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

      mockGet.mockImplementation((url: string) => {
        if (url === configUrl) {
          return Promise.resolve(configTranslations);
        } else if (url === bundledUrl) {
          return Promise.resolve(bundledTranslations);
        }
        return Promise.reject(new Error('Unexpected URL'));
      });

      const result = await getTranslations(language, namespace);

      expect(get).toHaveBeenCalledWith(configUrl);
      expect(get).toHaveBeenCalledWith(bundledUrl);

      expect(result).toEqual({
        [language]: {
          [namespace]: {
            key1: 'Config Value 1',
            key2: 'Bundled Value 2',
            key3: 'Config Value 3',
          },
        },
      });
    });

    it('should include English fallback for non-English languages', async () => {
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

      mockGet.mockImplementation((url: string) => {
        if (url === esConfigUrl || url === esBundledUrl) {
          return Promise.resolve(esTranslations);
        } else if (url === enConfigUrl || url === enBundledUrl) {
          return Promise.resolve(enTranslations);
        }
        return Promise.reject(new Error('Unexpected URL'));
      });

      const result = await getTranslations(language, namespace);

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
      const language = 'en';
      const namespace = 'clinical';
      const translations = { key1: 'English Value' };

      mockGet.mockResolvedValue(translations);

      const result = await getTranslations(language, namespace);

      expect(result).toEqual({
        en: {
          [namespace]: { ...translations },
        },
      });
    });

    it('should handle empty translation objects', async () => {
      const language = 'en';
      const namespace = 'clinical';

      mockGet.mockResolvedValue({});

      const result = await getTranslations(language, namespace);

      expect(result).toEqual({
        [language]: {
          [namespace]: {},
        },
      });
    });

    it('should handle failed requests gracefully', async () => {
      const language = 'en';
      const namespace = 'clinical';

      mockGet.mockRejectedValue(new Error('Network error'));

      const result = await getTranslations(language, namespace);

      expect(result).toEqual({
        [language]: {
          [namespace]: {},
        },
      });
    });
  });
});
