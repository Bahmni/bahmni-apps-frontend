import {
  CONFIG_TRANSLATIONS_URL_TEMPLATE,
  BUNDLED_TRANSLATIONS_URL_TEMPLATE,
  LOCALE_STORAGE_KEY,
  DEFAULT_LOCALE,
} from '@constants/app';
import axios from 'axios';

/**
 * Fetches user's preferred locale from the local storage.
 * @returns The user's preferred locale code if valid, or DEFAULT_LOCALE if not found or invalid
 */
export const getUserPreferredLocale = (): string => {
  const localeStorageKey = localStorage.getItem(LOCALE_STORAGE_KEY);
  const userLocale = localeStorageKey || DEFAULT_LOCALE;
  return userLocale;
};

/**
 * Fetches translations from a URL using axios.
 * Returns an empty object if the request fails for any reason.
 *
 * @param url - URL to fetch translations from
 * @returns A promise that resolves to a translations object or empty object on failure
 */
export const getTranslationFile = async (
  url: string,
): Promise<Record<string, string>> => {
  try {
    const response = await axios.get(url);
    if (!response || !response.data) {
      console.error(`Invalid response from ${url}`);
      return {};
    }
    return response.data;
  } catch (error) {
    console.error(`Failed to load translations from ${url}:`, error);
    return {};
  }
};

/**
 * Fetches and merges translations from standard and local config sources.
 * This function retrieves translations from both bundled and configuration sources,
 * then merges them with configuration translations taking precedence.
 * Either source can fail independently without affecting the other.
 *
 * @param lang - Language code to fetch translations for (e.g., 'en', 'es')
 * @returns A promise that resolves to a merged translations object where config translations override bundled ones
 * @throws Will not throw errors, but will log warnings for failed fetches
 */
const getMergedTranslations = async (
  lang: string,
): Promise<Record<string, string>> => {
  let bundledTranslations: Record<string, string> = {};
  let configTranslations: Record<string, string> = {};

  bundledTranslations = await getTranslationFile(
    BUNDLED_TRANSLATIONS_URL_TEMPLATE(lang),
  );

  configTranslations = await getTranslationFile(
    CONFIG_TRANSLATIONS_URL_TEMPLATE(lang),
  );

  return { ...bundledTranslations, ...configTranslations };
};

/**
 * Fetches translations for a specified language and English fallback if needed.
 * This function follows the i18next resource structure where translations are
 * organized by language code and namespace.
 *
 * @param lang - Language code to fetch translations for (e.g., 'en', 'es')
 * @param namespace - Namespace for the translations (e.g., 'clinical')
 * @returns Promise resolving to an object with translations keyed by language code
 * @throws Will not throw errors, but will return empty translations on failure
 * @example
 * // Returns { es: { clinical: {...translations} }, en: { clinical: {...fallback} } }
 * await getTranslations('es', 'clinical')
 * // Returns { en: { clinical: {...translations} } }
 * await getTranslations('en', 'clinical')
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
    [namespace]: await getMergedTranslations(lang),
  };

  // Add English fallback for non-English languages
  if (lang !== 'en') {
    translations.en = {
      [namespace]: await getMergedTranslations('en'),
    };
  }

  return translations;
};
