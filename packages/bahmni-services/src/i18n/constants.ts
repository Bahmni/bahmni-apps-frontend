import { BASE_PATH } from '../constants/app';

export const DEFAULT_LOCALE = 'en';
export const LOCALE_STORAGE_KEY = 'NG_TRANSLATE_LANG_KEY';

export const BUNDLED_TRANSLATIONS_URL_TEMPLATE = (
  namespace: string,
  lang: string,
) => BASE_PATH + `${namespace}/locales/locale_${lang}.json`;

export const CONFIG_TRANSLATIONS_URL_TEMPLATE = (
  namespace: string,
  lang: string,
) => `/bahmni_config/openmrs/i18n/${namespace}/locale_${lang}.json`;
