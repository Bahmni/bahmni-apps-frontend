// Export the default initialized i18n instance
export { default as initAppI18n } from './i18n';
export { useTranslation } from 'react-i18next';
export {
  getUserPreferredLocale,
  normalizeTranslationKey,
  extractObservationFormTranslations,
  type ObservationFormTranslations,
} from './translationService';
