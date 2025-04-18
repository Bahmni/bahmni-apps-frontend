import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import { LOCALE_COOKIE_NAME, CLINICAL_NAMESPACE } from './constants/app';
import {
  getTranslations,
  getUserPreferredLocale,
} from '@services/translationService';

/**
 * Initialize i18n with pre-loaded translations
 * This is exported as a function to be called before rendering the app
 */
export const initI18n = async () => {
  const userPreferredLocale = getUserPreferredLocale();
  const translations = await getTranslations(
    userPreferredLocale,
    CLINICAL_NAMESPACE,
  );

  await i18n
    .use(LanguageDetector)
    .use(initReactI18next)
    .init({
      fallbackLng: 'en',
      debug: true,
      ns: [CLINICAL_NAMESPACE],
      defaultNS: CLINICAL_NAMESPACE,
      resources: translations,
      detection: {
        order: ['localStorage'],
        lookupLocalStorage: LOCALE_COOKIE_NAME,
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
