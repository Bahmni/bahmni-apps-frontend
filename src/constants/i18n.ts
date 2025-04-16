export const LOCALE_COOKIE_NAME = 'NG_TRANSLATE_LANG_KEY';

// Base path for application resources
export const BASE_PATH = process.env.PUBLIC_URL || '/';

// URL templates for translation sources
export const CONFIG_TRANSLATIONS_URL_TEMPLATE = `/bahmni_config/openmrs/i18n/clinical/locale_{{lng}}.json`;
export const BUNDLED_TRANSLATIONS_URL_TEMPLATE = `${BASE_PATH}locales/locale_{{lng}}.json`;
