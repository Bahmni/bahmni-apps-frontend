import i18n from 'i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import { initReactI18next } from 'react-i18next';
import { LOCALE_STORAGE_KEY } from './constants';
import { getTranslations, getUserPreferredLocale } from './translationService';

/**
 * Initialize i18n with pre-loaded translations for a specific namespace
 * This function should be called before rendering the app
 *
 * @param namespace - The namespace for translations (e.g., 'clinical', 'registration')
 * @returns Initialized i18n instance
 */
export const initI18n = async (namespace: string) => {
  const userPreferredLocale = getUserPreferredLocale();
  const translations = await getTranslations(userPreferredLocale, namespace);

  await i18n
    .use(LanguageDetector)
    .use(initReactI18next)
    .init({
      fallbackLng: 'en',
      ns: [namespace],
      defaultNS: namespace,
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

export default initI18n;
