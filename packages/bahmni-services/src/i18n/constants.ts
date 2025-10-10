import { BASE_PATH } from '../constants/app';

export const BUNDLED_TRANSLATIONS_URL_TEMPLATE = (lang: string) =>
  BASE_PATH + `assets/locales/locale_${lang}.json`;

export const DEFAULT_LOCALE = 'en';
export const LOCALE_STORAGE_KEY = 'NG_TRANSLATE_LANG_KEY';
export const CLINICAL_NAMESPACE = 'clinical';
export const CONFIG_TRANSLATIONS_URL_TEMPLATE = (lang: string) =>
  `/bahmni_config/openmrs/i18n/clinical/locale_${lang}.json`;
export const REGISTRATION_CONFIG_TRANSLATIONS_URL_TEMPLATE = (lang: string) =>
  `/bahmni_config/openmrs/i18n/registration/locale_${lang}.json`;
