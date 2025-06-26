export const CLINICAL_V2_CONFIG_BASE_URL =
  '/bahmni_config/openmrs/apps/clinical/v2';

export const CONFIG_TRANSLATIONS_URL_TEMPLATE = (lang: string) =>
  `/bahmni_config/openmrs/i18n/clinical/locale_${lang}.json`;
export const CLINICAL_CONFIG_URL = CLINICAL_V2_CONFIG_BASE_URL + '/app.json';
export const MEDICATIONS_CONFIG_URL =
  CLINICAL_V2_CONFIG_BASE_URL + '/medication.json';
export const DASHBOARD_CONFIG_URL = (dashboardURL: string) =>
  `${CLINICAL_V2_CONFIG_BASE_URL}/dashboards/${dashboardURL}`;
