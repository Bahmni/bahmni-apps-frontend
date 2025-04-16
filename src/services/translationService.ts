import {
  CONFIG_TRANSLATIONS_URL_TEMPLATE,
  BUNDLED_TRANSLATIONS_URL_TEMPLATE,
} from '@constants/i18n';

/**
 * Safely fetches translations from a URL, returning an empty object on failure
 * @param url The URL to fetch translations from
 * @returns Promise that resolves to translation object or empty object on failure
 */
const safeGetTranslations = async (
  url: string,
): Promise<Record<string, string>> => {
  try {
    const response = await fetch(url);
    if (!response.ok) {
      console.warn(
        `Failed to load translations from ${url} with status ${response.status}`,
      );
      return {};
    }
    return await response.json();
  } catch (error) {
    console.warn(`Failed to load translations from ${url}:`, error);
    return {};
  }
};

/**
 * Fetches and merges translations from standard and local config sources
 * Either source can fail independently without affecting the other
 * @param lng Language code to fetch translations for
 * @returns Merged translations object
 */
export const getMergedTranslations = async (
  lng: string,
): Promise<Record<string, string>> => {
  const configTranslationsURL = CONFIG_TRANSLATIONS_URL_TEMPLATE.replace(
    '{{lng}}',
    lng,
  );
  const bundledTranslationsURL = BUNDLED_TRANSLATIONS_URL_TEMPLATE.replace(
    '{{lng}}',
    lng,
  );

  const configTranslations = await safeGetTranslations(configTranslationsURL);
  const bundledTranslations = await safeGetTranslations(bundledTranslationsURL);

  return { ...bundledTranslations, ...configTranslations };
};
