import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import Backend from 'i18next-http-backend';
import LanguageDetector from 'i18next-browser-languagedetector';


i18n
  .use(Backend)
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    fallbackLng: 'en',
    debug: process.env.NODE_ENV === 'development',
    ns: ['translation'],
    defaultNS: 'translation',
    detection: {
      order: ['cookie', 'localStorage', 'navigator', 'htmlTag'],
      lookupCookie: 'bahmni_locale', // Match Bahmni's existing cookie name
      caches: ['cookie'],
      cookieOptions: {
        path: '/',
        sameSite: 'strict'
      }},
    interpolation: {
      escapeValue: false,
    },
    backend: {
      loadPath: '/locales/{{lng}}/{{ns}}.json',
    },
    react: {
      useSuspense: true,
    },
  });

export default i18n;
