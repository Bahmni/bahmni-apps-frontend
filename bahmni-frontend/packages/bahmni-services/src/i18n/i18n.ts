import i18n from 'i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import { initReactI18next } from 'react-i18next';
import { getTranslations, getUserPreferredLocale } from './translationService';
import { LOCALE_STORAGE_KEY, CLINICAL_NAMESPACE } from './constants';

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
      ns: [CLINICAL_NAMESPACE],
      defaultNS: CLINICAL_NAMESPACE,
      resources: translations,
      detection: {
        order: ['localStorage'],
        lookupLocalStorage: LOCALE_STORAGE_KEY,
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
