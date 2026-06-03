export { default as initAppI18n } from './i18n';
export { useTranslation } from 'react-i18next';
export {
  getUserPreferredLocale,
  getMergedTranslations,
  normalizeTranslationKey,
  extractObservationFormTranslations,
  type ObservationFormTranslations,
} from './translationService';
