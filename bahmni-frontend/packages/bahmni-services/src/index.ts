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
export {
  type FormatDateResult,
  calculateAge,
  formatDateTime,
  formatDate,
  formatDateDistance,
  calculateOnsetDate,
  sortByDate,
  DATE_FORMAT,
  DATE_PICKER_INPUT_FORMAT,
  DATE_TIME_FORMAT,
  ISO_DATE_FORMAT,
  FULL_MONTH_DATE_FORMAT,
} from './date';
export { type Notification, notificationService } from './notification';
export {
  type FormattedAllergy,
  AllergyStatus,
  AllergySeverity,
  type AllergenType,
  getAllergies,
  getFormattedAllergies,
} from './allergyService';
export {
  getConditions,
  getFormattedConditions,
  type FormattedCondition,
  ConditionStatus,
} from './conditionService';
export {
  getPatientDiagnoses,
  type Diagnosis,
  type DiagnosisInputEntry,
  type DiagnosesByDate,
} from './diagnosesService';
export {
  getPatientMedications,
  getPatientMedicationBundle,
  type FormattedMedicationRequest,
  type MedicationRequest,
  MedicationStatus,
} from './medicationRequestService';
export {
  getPatientRadiologyInvestigations,
  getPatientRadiologyInvestigationBundle,
  type RadiologyInvestigation,
} from './radiologyInvestigationService';
export {
  getPatientLabTestsBundle,
  getPatientLabInvestigations,
  groupLabTestsByDate,
  type FormattedLabTest,
  LabTestPriority,
  type LabTestsByDate,
} from './labInvestigationService';

export {
  getClinicalConfig,
  getDashboardConfig,
  getMedicationConfig,
  type ClinicalConfig,
  type DashboardConfig,
  type MedicationJSONConfig,
  type DashboardSectionConfig,
  type Dashboard,
} from './configService';

export { getCurrentUser, type User } from './userService';
export {
  getCurrentProvider,
  type Provider,
  type Person,
} from './providerService';
export { findActiveEncounterInSession } from './encounterSessionService';

export {
  dispatchAuditEvent,
  AUDIT_LOG_EVENT_DETAILS,
  initializeAuditListener,
  type AuditEventType,
} from './auditLogService';
