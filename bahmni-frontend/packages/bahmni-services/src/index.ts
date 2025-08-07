export { get, post, put, del } from './api';
export { initAppI18n, useTranslation } from './i18n';
export {
  getPatientById,
  getFormattedPatientById,
  type FormattedPatientData,
} from './patientService';
export { getFormattedError } from './errorHandling';
export {
  capitalize,
  generateId,
  getCookieByName,
  isStringEmpty,
  getPriorityByOrder,
  groupByDate,
  filterReplacementEntries,
} from './utils';
export { type Notification, notificationService } from './notification';
export {
  type FormattedAllergy,
  AllergyStatus,
  AllergySeverity,
  type AllergenType,
  getPatientAllergiesBundle,
  getAllergies,
  formatAllergies,
  fetchAndFormatAllergenConcepts,
  fetchReactionConcepts,
  getFormattedAllergies,
} from './allergyService';

export {
  getClinicalConfig, getDashboardConfig, getMedicationConfig,
  type ClinicalConfig, type DashboardConfig, type MedicationJSONConfig, type ClinicalConfigContextType
} from './configService';
