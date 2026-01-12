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
  normalizeTranslationKey,
  extractObservationFormTranslations,
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
      const configUrl = CONFIG_TRANSLATIONS_URL_TEMPLATE(namespace, language);
      const bundledUrl = BUNDLED_TRANSLATIONS_URL_TEMPLATE(namespace, language);

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
      const esConfigUrl = CONFIG_TRANSLATIONS_URL_TEMPLATE(namespace, language);
      const esBundledUrl = BUNDLED_TRANSLATIONS_URL_TEMPLATE(
        namespace,
        language,
      );
      const enConfigUrl = CONFIG_TRANSLATIONS_URL_TEMPLATE(namespace, 'en');
      const enBundledUrl = BUNDLED_TRANSLATIONS_URL_TEMPLATE(namespace, 'en');

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

  describe('normalizeTranslationKey', () => {
    it('should normalize translation key with module and field name', () => {
      const result = normalizeTranslationKey('registration', 'National ID');
      expect(result).toBe('REGISTRATION_NATIONAL_ID');
    });

    it('should replace spaces with underscores', () => {
      const result = normalizeTranslationKey('clinical', 'Blood Pressure');
      expect(result).toBe('CLINICAL_BLOOD_PRESSURE');
    });

    it('should remove special characters except underscores', () => {
      const result = normalizeTranslationKey('registration', 'City/Village');
      expect(result).toBe('REGISTRATION_CITYVILLAGE');
    });

    it('should handle single word inputs', () => {
      const result = normalizeTranslationKey('home', 'title');
      expect(result).toBe('HOME_TITLE');
    });

    it('should convert to uppercase', () => {
      const result = normalizeTranslationKey('registration', 'firstName');
      expect(result).toBe('REGISTRATION_FIRSTNAME');
    });

    it('should handle already uppercase inputs', () => {
      const result = normalizeTranslationKey('REGISTRATION', 'NAME');
      expect(result).toBe('REGISTRATION_NAME');
    });

    it('should handle mixed case inputs', () => {
      const result = normalizeTranslationKey('Registration', 'FirstName');
      expect(result).toBe('REGISTRATION_FIRSTNAME');
    });

    it('should handle field names with numbers', () => {
      const result = normalizeTranslationKey('clinical', 'Ward 2B');
      expect(result).toBe('CLINICAL_WARD_2B');
    });

    it('should handle multiple spaces', () => {
      const result = normalizeTranslationKey(
        'registration',
        'Address   Line   One',
      );
      expect(result).toBe('REGISTRATION_ADDRESS_LINE_ONE');
    });

    it('should handle field names with hyphens', () => {
      const result = normalizeTranslationKey('clinical', 'Patient-ID');
      expect(result).toBe('CLINICAL_PATIENTID');
    });

    it('should handle field names with dots', () => {
      const result = normalizeTranslationKey('registration', 'email.address');
      expect(result).toBe('REGISTRATION_EMAILADDRESS');
    });

    it('should preserve existing underscores in field name', () => {
      const result = normalizeTranslationKey('clinical', 'patient_name');
      expect(result).toBe('CLINICAL_PATIENT_NAME');
    });

    it('should handle field names with parentheses', () => {
      const result = normalizeTranslationKey('clinical', 'Temperature (C)');
      expect(result).toBe('CLINICAL_TEMPERATURE_C');
    });

    it('should handle complex field names', () => {
      const result = normalizeTranslationKey(
        'registration',
        "Patient's ID Number (2024)",
      );
      expect(result).toBe('REGISTRATION_PATIENTS_ID_NUMBER_2024');
    });

    it('should handle field names with spaces', () => {
      const result = normalizeTranslationKey('clinical', 'patient name');
      expect(result).toBe('CLINICAL_PATIENT_NAME');
    });

    it('should handle camelCase field names', () => {
      const result = normalizeTranslationKey('registration', 'phoneNumber');
      expect(result).toBe('REGISTRATION_PHONENUMBER');
    });
  });

  describe('extractObservationFormTranslations', () => {
    it('should extract translations from API array response for specified locale', () => {
      const apiResponse = [
        {
          locale: 'en',
          labels: {
            BLOOD_PRESSURE_1: 'Blood Pressure',
            TEMPERATURE_2: 'Temperature',
          },
          concepts: {
            PULSE_14: 'Pulse',
            SITTING_21: 'Sitting',
          },
        },
        {
          locale: 'es',
          labels: {
            BLOOD_PRESSURE_1: 'Presión Arterial',
            TEMPERATURE_2: 'Temperatura',
          },
          concepts: {
            PULSE_14: 'Frecuencia del pulso',
            SITTING_21: 'Sentado',
          },
        },
      ];

      const result = extractObservationFormTranslations(apiResponse, 'es');

      expect(result).toEqual({
        labels: {
          BLOOD_PRESSURE_1: 'Presión Arterial',
          TEMPERATURE_2: 'Temperatura',
        },
        concepts: {
          PULSE_14: 'Frecuencia del pulso',
          SITTING_21: 'Sentado',
        },
      });
    });

    it('should return empty translations when locale not found in array', () => {
      const apiResponse = [
        {
          locale: 'en',
          labels: { FIELD_1: 'Field 1' },
          concepts: { CONCEPT_1: 'Concept 1' },
        },
      ];

      const result = extractObservationFormTranslations(apiResponse, 'fr');

      expect(result).toEqual({ labels: {}, concepts: {} });
    });

    it('should return empty translations when data is not an array', () => {
      const result = extractObservationFormTranslations(
        { invalid: 'data' },
        'en',
      );
      expect(result).toEqual({ labels: {}, concepts: {} });
    });

    it('should handle null or undefined data', () => {
      expect(extractObservationFormTranslations(null, 'en')).toEqual({
        labels: {},
        concepts: {},
      });
      expect(extractObservationFormTranslations(undefined, 'en')).toEqual({
        labels: {},
        concepts: {},
      });
    });

    it('should handle missing labels or concepts in API response', () => {
      const apiResponse = [
        {
          locale: 'en',
          labels: { FIELD_1: 'Field 1' },
          // concepts missing
        },
      ];

      const result = extractObservationFormTranslations(apiResponse, 'en');

      expect(result).toEqual({
        labels: { FIELD_1: 'Field 1' },
        concepts: {},
      });
    });
  });
});
