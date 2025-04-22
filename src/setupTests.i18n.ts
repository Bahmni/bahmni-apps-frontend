import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import enTranslations from '../public/locales/locale_en.json';

const initTestI18n = () => {
  i18n.use(initReactI18next).init({
    lng: 'en',
    fallbackLng: 'en',
    debug: false,
    ns: ['clinical'],
    defaultNS: 'clinical',
    resources: {
      en: { clinical: enTranslations },
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
