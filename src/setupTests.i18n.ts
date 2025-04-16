import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';


const initTestI18n = () => {
  // Load English translations synchronously for tests
  const enTranslations = require('../public/locales/locale_en.json');
  
  i18n
    .use(initReactI18next)
    .init({
      lng: 'en',
      fallbackLng: 'en',
      debug: false,
      ns: ['clinical'],
      defaultNS: 'clinical',
      resources: {
        en: { clinical: enTranslations }
      },
      interpolation: {
        escapeValue: false,
      },
      react: {
        useSuspense: false,
      },
    });

  return i18n;
};

export default initTestI18n();
