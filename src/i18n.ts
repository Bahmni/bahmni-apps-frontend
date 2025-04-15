import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

const BASE_PATH = process.env.PUBLIC_URL || '/';

// Pre-load translations for a specific language
const loadMergedTranslations = async (lng: string) => {
  try {
    const standardConfigUrl = `/bahmni_config/openmrs/i18n/home/locale_${lng}.json`;
    const localConfigUrl = `${BASE_PATH}locales/locale_${lng}.json`;
    
    const [standardConfig, localConfig] = await Promise.all([
      fetch(standardConfigUrl).then(res => res.json()).catch(() => ({})),
      fetch(localConfigUrl).then(res => res.json()).catch(() => ({}))
    ]);
    
    return { ...localConfig, ...standardConfig }; // Local config overrides standard config
  } catch (error) {
    console.error(`Failed to load translations for ${lng}:`, error);
    return {};
  }
};

// Initialize i18n after loading translations for the default language
const initializeI18n = async () => {
  // Detect user language or use fallback
  const detectedLng = localStorage.getItem('i18nextLng') || 
                      document.cookie.replace(/(?:(?:^|.*;\s*)NG_TRANSLATE_LANG_KEY\s*=\s*([^;]*).*$)|^.*$/, '$1') || 
                      navigator.language || 
                      'en';
  
  const lng = detectedLng.split('-')[0]; // Get base language code
  
  // Pre-load translations for detected language
  const resources = {
    [lng]: {
      clinical: await loadMergedTranslations(lng)
    }
  };
  
  // Also load English as fallback if not already loaded
  if (lng !== 'en') {
    resources.en = {
      clinical: await loadMergedTranslations('en')
    };
  }
  
  // Initialize i18next with pre-loaded resources
  await i18n
    .use(LanguageDetector)
    .use(initReactI18next)
    .init({
      fallbackLng: 'en',
      debug: true,
      ns: ['clinical'],
      defaultNS: 'clinical',
      resources, // Pre-loaded resources
      detection: {
        order: ['cookie', 'localStorage', 'navigator', 'htmlTag'],
        lookupCookie: 'NG_TRANSLATE_LANG_KEY',
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

// Export the initialization function and i18n instance
export const i18nInstance = i18n;
export default await initializeI18n();
