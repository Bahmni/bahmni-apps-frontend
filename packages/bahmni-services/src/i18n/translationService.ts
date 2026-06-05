import { get } from '../api';
import {
  BUNDLED_TRANSLATIONS_URL_TEMPLATE,
  LOCALE_STORAGE_KEY,
  DEFAULT_LOCALE,
  CONFIG_TRANSLATIONS_URL_TEMPLATE,
} from './constants';

/**
 * Fetches user's preferred locale from the local storage.
 * @returns The user's preferred locale code if valid, or DEFAULT_LOCALE if not found or invalid
 */
export const getUserPreferredLocale = (): string => {
  const localeStorageKey = localStorage.getItem(LOCALE_STORAGE_KEY);
  const userLocale = localeStorageKey ?? DEFAULT_LOCALE;
  return userLocale;
};

/**
 * Fetches translations from a URL using the API service.
 * Returns an empty object if the request fails for any reason.
 *
 * @param url - URL to fetch translations from
 * @returns A promise that resolves to a translations object or empty object on failure
 */
export const getTranslationFile = async (
  url: string,
): Promise<Record<string, string>> => {
  try {
    const response = await get<Record<string, string>>(url);
    if (!response) {
      // eslint-disable-next-line no-console
      console.error(`Invalid response from ${url}`);
      return {};
    }
    return response;
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error(`Failed to load translations from ${url}:`, error);
    return {};
  }
};
/**
 * Fetches and merges translations from bundled and namespace-specific config sources.
 * This function retrieves translations from both bundled and configuration sources,
 * then merges them with configuration translations taking precedence.
 * Either source can fail independently without affecting the other.
 *
 * @param namespace - Namespace for the translations (e.g., 'clinical', 'registration')
 * @param lang - Language code to fetch translations for (e.g., 'en', 'es')
 * @returns A promise that resolves to a merged translations object where config translations override bundled ones
 * @throws Will not throw errors, but will log warnings for failed fetches
 */
const getMergedTranslations = async (
  namespace: string,
  lang: string,
): Promise<Record<string, string>> => {
  let bundledTranslations: Record<string, string> = {};
  let configTranslations: Record<string, string> = {};

  bundledTranslations = await getTranslationFile(
    BUNDLED_TRANSLATIONS_URL_TEMPLATE(namespace, lang),
  );

  configTranslations = await getTranslationFile(
    CONFIG_TRANSLATIONS_URL_TEMPLATE(namespace, lang),
  );

  return {
    ...bundledTranslations,
    ...configTranslations,
  };
};

/**
 * Fetches translations for a specified language and English fallback if needed.
 * This function follows the i18next resource structure where translations are
 * organized by language code and namespace.
 *
 * @param lang - Language code to fetch translations for (e.g., 'en', 'es')
 * @param namespace - Namespace for the translations (e.g., 'clinical', 'registration')
 * @returns Promise resolving to an object with translations keyed by language code
 * @throws Will not throw errors, but will return empty translations on failure
 */
export const getTranslations = async (
  lang: string,
  namespace: string,
): Promise<Record<string, Record<string, Record<string, string>>>> => {
  const translations: Record<
    string,
    Record<string, Record<string, string>>
  > = {};

  // Get translations for requested language
  translations[lang] = {
    [namespace]: await getMergedTranslations(namespace, lang),
  };

  // Add English fallback for non-English languages
  if (lang !== 'en') {
    translations.en = {
      [namespace]: await getMergedTranslations(namespace, 'en'),
    };
  }

  return translations;
};

export const normalizeTranslationKey = (
  module: string,
  fieldName: string,
): string => {
  const normalizedModule = module.toUpperCase();
  const normalizedFieldName = fieldName
    .toUpperCase()
    .replace(/\s+/g, '_')
    .replace(/[^A-Z0-9_]/g, '');
  return `${normalizedModule}_${normalizedFieldName}`;
};

/**
 * Observation form translations structure
 */
export interface ObservationFormTranslations {
  labels: Record<string, string>;
  concepts: Record<string, string>;
}

/**
 * Extracts translations for observation forms from API response for a specific locale
 * @param data - API response array containing translations
 * @param locale - The locale to extract translations for (e.g., 'en', 'es')
 * @returns ObservationFormTranslations object with labels and concepts
 */
export const extractObservationFormTranslations = (
  data: unknown,
  locale: string,
): ObservationFormTranslations => {
  const defaultTranslations: ObservationFormTranslations = {
    labels: {},
    concepts: {},
  };

  if (!Array.isArray(data)) {
    return defaultTranslations;
  }

  const localeData = data.find(
    (item) =>
      item &&
      typeof item === 'object' &&
      'locale' in item &&
      item.locale === locale,
  );

  if (!localeData || typeof localeData !== 'object') {
    return defaultTranslations;
  }

  return {
    labels: (localeData.labels as Record<string, string>) ?? {},
    concepts: (localeData.concepts as Record<string, string>) ?? {},
  };
};
