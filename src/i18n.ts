import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import { LOCALE_COOKIE_NAME } from './constants/i18n';

const BASE_PATH = process.env.PUBLIC_URL || '/';

/**
 * Fetches and merges translations from standard and local config sources
 * @param lng Language code to fetch translations for
 * @returns Merged translations object
 */
const fetchTranslations = async (lng: string): Promise<Record<string, string>> => {
  const standardConfigUrl = `/bahmni_config/openmrs/i18n/home/locale_${lng}.json`;
  const localConfigUrl = `${BASE_PATH}locales/locale_${lng}.json`;
  
  try {
    // Fetch both sources in parallel and handle potential failures
    const [standardConfig, localConfig] = await Promise.all([
      fetch(standardConfigUrl)
        .then(res => res.ok ? res.json() : {})
        .catch(() => ({})),
      fetch(localConfigUrl)
        .then(res => res.ok ? res.json() : {})
        .catch(() => ({}))
    ]);
    
    // Local config takes precedence over standard config
    return { ...standardConfig, ...localConfig };
  } catch (error) {
    console.error(`Failed to load translations for ${lng}:`, error);
    return {};
  }
};

/**
 * Initialize i18n with pre-loaded translations
 */
const initI18n = async () => {
  // Get language from cookie or use fallback
  const cookieLng = document.cookie.replace(
    /(?:(?:^|.*;\s*)NG_TRANSLATE_LANG_KEY\s*=\s*([^;]*).*$)|^.*$/, 
    '$1'
  );
  
  const lng = (cookieLng || 'en').split('-')[0]; // Get base language code
  
  // Pre-load translations
  const translations = {
    [lng]: { clinical: await fetchTranslations(lng) }
  };
  
  // Also load English as fallback if needed
  if (lng !== 'en') {
    translations.en = { clinical: await fetchTranslations('en') };
  }
  
  // Initialize i18next with pre-loaded translations
  await i18n
    .use(LanguageDetector)
    .use(initReactI18next)
    .init({
      fallbackLng: 'en',
      debug: true,
      ns: ['clinical'],
      defaultNS: 'clinical',
      resources: translations,
      detection: {
        order: ['cookie', 'localStorage', 'navigator', 'htmlTag'],
        lookupCookie: LOCALE_COOKIE_NAME,
        caches: ['cookie'],
        cookieOptions: {
          path: '/',
          sameSite: 'strict'
        }
      },
      interpolation: {
        escapeValue: false,
      },
      react: {
        useSuspense: true,
      },
    });
    
  return i18n;
};

// Export the i18n instance for direct access
export const i18nInstance = i18n;

// Export the initialization promise as default
export default await initI18n();
