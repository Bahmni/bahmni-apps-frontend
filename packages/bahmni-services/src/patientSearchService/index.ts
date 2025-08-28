export {
  searchPatients,
  getPatientSearchResults,
} from './patientSearchService';

export {
  formatPatientName,
  formatRegistrationDate,
  formatPatientSearchResult,
  formatPatientSearchResults,
  isValidSearchTerm,
  sortPatientsByIdentifierAscending,
} from './utils';

export type {
  PatientSearchResult,
  PatientSearchResponse,
  PatientSearchParams,
  FormattedPatientSearchResult,
} from './models';

export {
  PATIENT_SEARCH_BASE_URL,
  PATIENT_SEARCH_CONFIG,
  PATIENT_SEARCH_DEFAULTS,
} from './constants';
