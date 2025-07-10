/**
 * Registration Module Configuration Constants
 * Following existing patterns from app.ts
 */

const OPENMRS_REST_V1 = '/openmrs/ws/rest/v1';
const OPENMRS_FHIR_R4 = '/openmrs/ws/fhir2/R4';

// Registration Configuration
export const REGISTRATION_CONFIG = {
  // Search Configuration
  DEFAULT_PAGE_SIZE: 10,
  MAX_SEARCH_RESULTS: 100,
  SEARCH_DEBOUNCE_MS: 300,

  // Photo Configuration
  MAX_PHOTO_SIZE_MB: 5,
  MAX_PHOTO_WIDTH: 800,
  MAX_PHOTO_HEIGHT: 600,
  PHOTO_COMPRESSION_QUALITY: 0.8,
  SUPPORTED_PHOTO_FORMATS: ['image/jpeg', 'image/png', 'image/jpg'],

  // Form Configuration
  AUTO_CALCULATE_AGE: true,
  REQUIRED_IDENTIFIERS_MIN: 1,
  ADDRESS_HIERARCHY_ENABLED: true,

  // Validation Configuration
  MIN_NAME_LENGTH: 2,
  MAX_NAME_LENGTH: 50,
  MIN_AGE: 0,
  MAX_AGE: 150,
  MIN_BIRTH_YEAR: 1900,

  // UI Configuration
  FORM_WIZARD_STEPS: 6,
  ENABLE_PHOTO_CAPTURE: true,
  ENABLE_BARCODE_SCANNER: false,
  ENABLE_DUPLICATE_DETECTION: true,

  // Export Configuration
  EXPORT_FORMATS: ['CSV', 'PDF', 'JSON'],
  MAX_EXPORT_RECORDS: 1000,

  // Cache Configuration
  SEARCH_CACHE_TTL_MS: 300000, // 5 minutes
  FORM_AUTO_SAVE_INTERVAL_MS: 30000, // 30 seconds
} as const;

// Registration API Endpoints
export const REGISTRATION_ENDPOINTS = {
  // Patient Search
  PATIENT_SEARCH: (query: string, limit: number = 10, startIndex: number = 0) =>
    `${OPENMRS_REST_V1}/patient?q=${encodeURIComponent(query)}&limit=${limit}&startIndex=${startIndex}&v=custom:(uuid,display,identifiers:(uuid,identifier,identifierType:(uuid,name,display),preferred),person:(uuid,display,gender,age,birthdate,birthdateEstimated,names:(uuid,display,givenName,middleName,familyName,preferred),addresses:(uuid,display,address1,address2,cityVillage,stateProvince,country,postalCode,preferred)))`,

  // Advanced Patient Search
  PATIENT_SEARCH_ADVANCED: (criteria: Record<string, string>, limit: number = 10, startIndex: number = 0) => {
    const params = new URLSearchParams();
    Object.entries(criteria).forEach(([key, value]) => {
      if (value) params.append(key, value);
    });
    params.append('limit', limit.toString());
    params.append('startIndex', startIndex.toString());
    params.append('v', 'custom:(uuid,display,identifiers:(uuid,identifier,identifierType:(uuid,name,display),preferred),person:(uuid,display,gender,age,birthdate,birthdateEstimated,names:(uuid,display,givenName,middleName,familyName,preferred),addresses:(uuid,display,address1,address2,cityVillage,stateProvince,country,postalCode,preferred)))');
    return `${OPENMRS_REST_V1}/patient?${params.toString()}`;
  },

  // Patient CRUD
  PATIENT_RESOURCE: (uuid?: string) =>
    `${OPENMRS_REST_V1}/patient${uuid ? `/${uuid}` : ''}?v=full`,

  // Patient Identifiers
  PATIENT_IDENTIFIER_TYPES: () =>
    `${OPENMRS_REST_V1}/patientidentifiertype?v=custom:(uuid,name,description,format,required,formatDescription,retired)`,

  // Person Attributes
  PERSON_ATTRIBUTE_TYPES: () =>
    `${OPENMRS_REST_V1}/personattributetype?v=custom:(uuid,name,description,format,required,searchable,retired,concept:(uuid,display))`,

  // Address Hierarchy
  ADDRESS_HIERARCHY: (uuid?: string) =>
    `${OPENMRS_REST_V1}/addresshierarchy${uuid ? `/${uuid}` : ''}?v=custom:(uuid,name,level,parent,children:(uuid,name,level))`,

  // Relationships
  RELATIONSHIP_TYPES: () =>
    `${OPENMRS_REST_V1}/relationshiptype?v=custom:(uuid,display,aIsToB,bIsToA,description,weight,preferred,retired)`,

  PATIENT_RELATIONSHIPS: (patientUuid: string) =>
    `${OPENMRS_REST_V1}/relationship?person=${patientUuid}&v=custom:(uuid,display,personA:(uuid,display,gender,age,birthdate,names:(uuid,display,givenName,middleName,familyName,preferred),addresses:(uuid,display,address1,cityVillage,stateProvince,country,preferred)),personB:(uuid,display,gender,age,birthdate,names:(uuid,display,givenName,middleName,familyName,preferred),addresses:(uuid,display,address1,cityVillage,stateProvince,country,preferred)),relationshipType:(uuid,display,aIsToB,bIsToA),startDate,endDate,voided)`,

  RELATIONSHIP_RESOURCE: (uuid?: string) =>
    `${OPENMRS_REST_V1}/relationship${uuid ? `/${uuid}` : ''}?v=full`,

  // Patient History (using audit log)
  PATIENT_HISTORY: (patientUuid: string, limit: number = 50) =>
    `${OPENMRS_REST_V1}/patient/${patientUuid}/history?limit=${limit}&v=custom:(uuid,changeType,changeDescription,changedBy:(uuid,display,username),dateChanged,changes)`,

  // Locations
  LOCATIONS: () =>
    `${OPENMRS_REST_V1}/location?v=custom:(uuid,display,name,description,retired)`,

  // Concepts (for person attributes)
  CONCEPT_SEARCH: (term: string, limit: number = 20, locale: string = 'en') =>
    `${OPENMRS_REST_V1}/concept?q=${encodeURIComponent(term)}&limit=${limit}&locale=${locale}&v=custom:(uuid,display,name,datatype,conceptClass)`,

  // Photo upload
  PATIENT_PHOTO: (patientUuid: string) =>
    `${OPENMRS_REST_V1}/patient/${patientUuid}/photo`,
} as const;

// Registration Form Field Names
export const REGISTRATION_FORM_FIELDS = {
  // Demographics
  GIVEN_NAME: 'givenName',
  MIDDLE_NAME: 'middleName',
  FAMILY_NAME: 'familyName',
  GENDER: 'gender',
  BIRTHDATE: 'birthdate',
  AGE: 'age',
  BIRTHDATE_ESTIMATED: 'birthdateEstimated',

  // Identifiers
  IDENTIFIERS: 'identifiers',
  IDENTIFIER_VALUE: 'identifier',
  IDENTIFIER_TYPE: 'identifierType',
  IDENTIFIER_LOCATION: 'location',
  IDENTIFIER_PREFERRED: 'preferred',

  // Address
  ADDRESS: 'address',
  ADDRESS_1: 'address1',
  ADDRESS_2: 'address2',
  CITY_VILLAGE: 'cityVillage',
  STATE_PROVINCE: 'stateProvince',
  COUNTRY: 'country',
  POSTAL_CODE: 'postalCode',
  COUNTY_DISTRICT: 'countyDistrict',

  // Attributes
  ATTRIBUTES: 'attributes',
  ATTRIBUTE_TYPE: 'attributeType',
  ATTRIBUTE_VALUE: 'value',

  // Photo
  PHOTO: 'photo',
  PHOTO_CONTENT_TYPE: 'contentType',
  PHOTO_DATA: 'data',
} as const;

// Registration Validation Messages
export const REGISTRATION_VALIDATION_MESSAGES = {
  REQUIRED_FIELD: 'This field is required',
  INVALID_EMAIL: 'Please enter a valid email address',
  INVALID_PHONE: 'Please enter a valid phone number',
  INVALID_DATE: 'Please enter a valid date',
  INVALID_AGE: 'Age must be between 0 and 150',
  INVALID_BIRTHDATE: 'Birth date cannot be in the future',
  INVALID_NAME: 'Name must be between 2 and 50 characters and contain only letters, spaces, and hyphens',
  INVALID_IDENTIFIER: 'Please enter a valid identifier',
  DUPLICATE_IDENTIFIER: 'This identifier already exists',
  INVALID_PHOTO_SIZE: 'Photo size must be less than 5MB',
  INVALID_PHOTO_FORMAT: 'Photo must be in JPEG or PNG format',
  INVALID_PHOTO_DIMENSIONS: 'Photo dimensions are too large',
  DUPLICATE_PATIENT: 'A patient with similar details already exists',
  MISSING_REQUIRED_IDENTIFIER: 'At least one identifier is required',
  INVALID_RELATIONSHIP: 'Please select a valid relationship type',
  INVALID_DATE_RANGE: 'End date must be after start date',
} as const;

// Registration Error Codes
export const REGISTRATION_ERROR_CODES = {
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  DUPLICATE_PATIENT: 'DUPLICATE_PATIENT',
  DUPLICATE_IDENTIFIER: 'DUPLICATE_IDENTIFIER',
  NETWORK_ERROR: 'NETWORK_ERROR',
  SERVER_ERROR: 'SERVER_ERROR',
  AUTHENTICATION_ERROR: 'AUTHENTICATION_ERROR',
  AUTHORIZATION_ERROR: 'AUTHORIZATION_ERROR',
  RESOURCE_NOT_FOUND: 'RESOURCE_NOT_FOUND',
  INVALID_REQUEST: 'INVALID_REQUEST',
  PHOTO_UPLOAD_ERROR: 'PHOTO_UPLOAD_ERROR',
  RELATIONSHIP_ERROR: 'RELATIONSHIP_ERROR',
  HISTORY_ERROR: 'HISTORY_ERROR',
} as const;

// Registration Events (for analytics)
export const REGISTRATION_EVENTS = {
  PATIENT_SEARCH_STARTED: 'patient_search_started',
  PATIENT_SEARCH_COMPLETED: 'patient_search_completed',
  PATIENT_SEARCH_FAILED: 'patient_search_failed',
  PATIENT_CREATION_STARTED: 'patient_creation_started',
  PATIENT_CREATION_COMPLETED: 'patient_creation_completed',
  PATIENT_CREATION_FAILED: 'patient_creation_failed',
  PATIENT_EDIT_STARTED: 'patient_edit_started',
  PATIENT_EDIT_COMPLETED: 'patient_edit_completed',
  PATIENT_EDIT_FAILED: 'patient_edit_failed',
  PHOTO_UPLOAD_STARTED: 'photo_upload_started',
  PHOTO_UPLOAD_COMPLETED: 'photo_upload_completed',
  PHOTO_UPLOAD_FAILED: 'photo_upload_failed',
  RELATIONSHIP_CREATED: 'relationship_created',
  RELATIONSHIP_UPDATED: 'relationship_updated',
  RELATIONSHIP_DELETED: 'relationship_deleted',
  PATIENT_HISTORY_VIEWED: 'patient_history_viewed',
  PATIENT_HISTORY_EXPORTED: 'patient_history_exported',
  DUPLICATE_DETECTION_TRIGGERED: 'duplicate_detection_triggered',
  FORM_VALIDATION_FAILED: 'form_validation_failed',
  WIZARD_STEP_COMPLETED: 'wizard_step_completed',
  WIZARD_STEP_SKIPPED: 'wizard_step_skipped',
  WIZARD_ABANDONED: 'wizard_abandoned',
} as const;

// Registration Permissions
export const REGISTRATION_PERMISSIONS = {
  VIEW_PATIENTS: 'View Patients',
  ADD_PATIENTS: 'Add Patients',
  EDIT_PATIENTS: 'Edit Patients',
  DELETE_PATIENTS: 'Delete Patients',
  VIEW_PATIENT_IDENTIFIERS: 'View Patient Identifiers',
  EDIT_PATIENT_IDENTIFIERS: 'Edit Patient Identifiers',
  VIEW_PATIENT_ADDRESSES: 'View Patient Addresses',
  EDIT_PATIENT_ADDRESSES: 'Edit Patient Addresses',
  VIEW_PATIENT_ATTRIBUTES: 'View Patient Attributes',
  EDIT_PATIENT_ATTRIBUTES: 'Edit Patient Attributes',
  VIEW_RELATIONSHIPS: 'View Relationships',
  EDIT_RELATIONSHIPS: 'Edit Relationships',
  VIEW_PATIENT_HISTORY: 'View Patient History',
  EXPORT_PATIENT_DATA: 'Export Patient Data',
  UPLOAD_PATIENT_PHOTOS: 'Upload Patient Photos',
  MERGE_PATIENTS: 'Merge Patients',
} as const;

// Registration Navigation Paths
export const REGISTRATION_PATHS = {
  SEARCH: '/registration/search',
  CREATE: '/registration/create',
  EDIT: '/registration/edit/:uuid',
  PATIENT_DETAILS: '/registration/patient/:uuid',
  RELATIONSHIPS: '/registration/patient/:uuid/relationships',
  HISTORY: '/registration/patient/:uuid/history',
  PHOTO: '/registration/patient/:uuid/photo',
} as const;

// Registration Storage Keys
export const REGISTRATION_STORAGE_KEYS = {
  SEARCH_CACHE: 'registration.search.cache',
  FORM_DRAFT: 'registration.form.draft',
  RECENT_SEARCHES: 'registration.recent.searches',
  USER_PREFERENCES: 'registration.user.preferences',
  WIZARD_PROGRESS: 'registration.wizard.progress',
} as const;

// Registration Date Formats
export const REGISTRATION_DATE_FORMATS = {
  DISPLAY: 'DD/MM/YYYY',
  API: 'YYYY-MM-DD',
  DATETIME_DISPLAY: 'DD/MM/YYYY HH:mm:ss',
  DATETIME_API: 'YYYY-MM-DDTHH:mm:ss.SSSZ',
  TIME_DISPLAY: 'HH:mm:ss',
  RELATIVE: 'relative', // for moment.js fromNow()
} as const;

// Registration Gender Options
export const REGISTRATION_GENDER_OPTIONS = [
  { value: 'M', label: 'Male', code: 'M' },
  { value: 'F', label: 'Female', code: 'F' },
  { value: 'O', label: 'Other', code: 'O' },
] as const;

// Registration Wizard Steps
export const REGISTRATION_WIZARD_STEPS = [
  { id: 'demographics', name: 'Demographics', order: 1 },
  { id: 'identifiers', name: 'Identifiers', order: 2 },
  { id: 'address', name: 'Address', order: 3 },
  { id: 'attributes', name: 'Attributes', order: 4 },
  { id: 'photo', name: 'Photo', order: 5 },
  { id: 'summary', name: 'Summary', order: 6 },
] as const;

// Registration Search Types
export const REGISTRATION_SEARCH_TYPES = {
  GENERAL: 'general',
  ADVANCED: 'advanced',
  IDENTIFIER: 'identifier',
  NAME: 'name',
  DEMOGRAPHICS: 'demographics',
} as const;

// Registration Export Types
export const REGISTRATION_EXPORT_TYPES = {
  CSV: 'csv',
  PDF: 'pdf',
  JSON: 'json',
  EXCEL: 'excel',
} as const;

// Registration Photo Capture Sources
export const REGISTRATION_PHOTO_SOURCES = {
  CAMERA: 'camera',
  FILE: 'file',
  URL: 'url',
} as const;

// Registration Relationship Directions
export const REGISTRATION_RELATIONSHIP_DIRECTIONS = {
  A_TO_B: 'aIsToB',
  B_TO_A: 'bIsToA',
} as const;

// Registration History Change Types
export const REGISTRATION_HISTORY_CHANGE_TYPES = {
  CREATE: 'CREATE',
  UPDATE: 'UPDATE',
  DELETE: 'DELETE',
  VOID: 'VOID',
  UNVOID: 'UNVOID',
} as const;

// Registration Notification Types
export const REGISTRATION_NOTIFICATION_TYPES = {
  SUCCESS: 'success',
  ERROR: 'error',
  WARNING: 'warning',
  INFO: 'info',
} as const;

// Registration Loading States
export const REGISTRATION_LOADING_STATES = {
  IDLE: 'idle',
  LOADING: 'loading',
  SUCCESS: 'success',
  ERROR: 'error',
} as const;
