export { get, post, put, del } from './api';
export { initAppI18n, useTranslation } from './i18n';
export {
  getPatientById,
  getFormattedPatientById,
  type FormattedPatientData,
} from './patientService';
export {
  searchPatients,
  searchPatientsFormatted,
  getPatientSearchResults,
  type PatientSearchResult,
  type PatientSearchResponse,
  type FormattedPatientSearchResult,
} from './patientSearchService';
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
  getTodayDate,
} from './date';
export { type Notification, notificationService } from './notification';
export {
  type FormattedAllergy,
  AllergyStatus,
  AllergySeverity,
  type AllergenType,
  getAllergies,
  getFormattedAllergies,
  fetchAndFormatAllergenConcepts,
  fetchReactionConcepts,
} from './allergyService';
export {
  getConditions,
  getFormattedConditions,
  type FormattedCondition,
  type ConditionInputEntry,
  ConditionStatus,
} from './conditionService';
export {
  getPatientDiagnoses,
  type Diagnosis,
  type DiagnosisInputEntry,
  type DiagnosesByDate,
} from './diagnosesService';
export {
  searchConcepts,
  searchFHIRConcepts,
  searchFHIRConceptsByName,
  type ConceptSearch,
  type ConceptClass,
} from './conceptService';
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
  getFlattenedInvestigations,
  type FlattenedInvestigations,
  type OrderType,
  type OrderTypeResponse,
} from './investigationService';

export {
  getClinicalConfig,
  getDashboardConfig,
  getMedicationConfig,
  type ClinicalConfig,
  type DashboardConfig,
  type MedicationJSONConfig,
  type DashboardSectionConfig,
  type Dashboard,
  type Frequency,
} from './configService';

export { getCurrentUser, type User } from './userService';
export {
  getCurrentProvider,
  type Provider,
  type Person,
} from './providerService';
export { findActiveEncounterInSession } from './encounterSessionService';

export { getActiveVisit } from './encounterService';

export {
  dispatchAuditEvent,
  AUDIT_LOG_EVENT_DETAILS,
  initializeAuditListener,
  type AuditEventType,
  logAuditEvent,
} from './auditLogService';

export {
  HL7_CONDITION_CLINICAL_STATUS_CODE_SYSTEM,
  HL7_CONDITION_VERIFICATION_STATUS_CODE_SYSTEM,
  HL7_CONDITION_CATEGORY_CODE_SYSTEM,
  HL7_CONDITION_CATEGORY_CONDITION_CODE,
  HL7_CONDITION_CATEGORY_DIAGNOSIS_CODE,
  FHIR_ENCOUNTER_TYPE_CODE_SYSTEM,
} from './constants/fhir';

export { OPENMRS_REST_V1, OPENMRS_FHIR_R4 } from './constants/app';
