import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import Backend from 'i18next-http-backend';
import LanguageDetector from 'i18next-browser-languagedetector';

const mergeTranslations = async (lng: string) => {
  const standardConfigUrl = `bahmni_config/openmrs/i18n/home/locale_${lng}.json`;
  const localConfigUrl = `/locales/locale_${lng}.json`;
  const [standardConfig, localConfig] = await Promise.all([
    fetch(standardConfigUrl).then((res) => res.json()),
    fetch(localConfigUrl).then((res) => res.json()),
  ]);
  return { ...localConfig,  ...standardConfig }; // Local config overrides standard config
};

i18n
  .use(Backend)
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    fallbackLng: 'en',
    debug: process.env.NODE_ENV === 'development',
    ns: ['translation'],
    defaultNS: process.env.REACT_APP_DEFAULT_NAMESPACE || 'translation',

    detection: {
      order: ['cookie', 'localStorage', 'navigator', 'htmlTag'],
      lookupCookie: 'NG_TRANSLATE_LANG_KEY', // Match Bahmni's existing cookie name
      caches: ['cookie'],
      cookieOptions: {
        path: '/',
        sameSite: 'strict'
      }},
    interpolation: {
      escapeValue: false,
    },
    backend: {
      loadPath: '/locales/locale_{{lng}}.json',
      parse: async (data: string, lng: string) => {
        const mergedTranslations = await mergeTranslations(lng);
        return mergedTranslations;
      }
    }, // Properly closed backend object
    react: {
      useSuspense: true,
    },
  });

export default i18n;
