export {
  getPatientById,
  getFormattedPatientById,
  searchPatientByNameOrId,
  searchPatientByCustomAttribute,
  getPrimaryIdentifierType,
  createPatient,
  getIdentifierData,
  getGenders,
  getAddressHierarchyEntries,
} from './patientService';
export {
  type FormattedPatientData,
  type PatientSearchResultBundle,
  type PatientSearchResult,
  type IdentifierSource,
  type IdentifierType,
  type IdentifierTypesResponse,
  type CreatePatientRequest,
  type CreatePatientResponse,
  type PatientName,
  type PatientAddress,
  type PatientIdentifier,
  type PatientAttribute,
  type AddressHierarchyEntry,
} from './models';
export {
  MAX_PATIENT_AGE_YEARS,
  PHONE_NUMBER_UUID,
  EMAIL_UUID,
  ALTERNATE_PHONE_NUMBER_UUID,
} from './constants';
