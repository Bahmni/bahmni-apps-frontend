import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import enTranslations from './public/locales/locale_en.json';
import { BAHMNI_APPOINTMENTS_NAMESPACE } from './src/constants/app';

const initTestI18n = () => {
  i18n.use(initReactI18next).init({
    lng: 'en',
    fallbackLng: 'en',
    debug: false,
    ns: [BAHMNI_APPOINTMENTS_NAMESPACE],
    defaultNS: BAHMNI_APPOINTMENTS_NAMESPACE,
    resources: {
      en: { [BAHMNI_APPOINTMENTS_NAMESPACE]: enTranslations },
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
