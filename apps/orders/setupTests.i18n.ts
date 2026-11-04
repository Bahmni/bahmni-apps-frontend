import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import enTranslations from './public/locales/locale_en.json';
import esTranslations from './public/locales/locale_es.json';
import frTranslations from './public/locales/locale_fr.json';

const initTestI18n = () => {
  i18n.use(initReactI18next).init({
    lng: 'en',
    fallbackLng: 'en',
    debug: false,
    ns: ['orders'],
    defaultNS: 'orders',
    resources: {
      en: { orders: enTranslations },
      es: { orders: esTranslations },
      fr: { orders: frTranslations },
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
