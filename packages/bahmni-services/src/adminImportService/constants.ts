import { OPENMRS_REST_V1 } from '../constants/app';

export const ADMIN_IMPORT_BASE_URL = `${OPENMRS_REST_V1}/bahmnicore/admin/upload`;
export const ADMIN_IMPORT_STATUS_URL = `${ADMIN_IMPORT_BASE_URL}/status`;
export const IMPORT_ERROR_FILE_BASE_URL = '/uploaded-files/mrs';

export const STATUS_COMPLETED_WITH_ERRORS = 'COMPLETED_WITH_ERRORS';

export const IMPORT_TYPES = [
  {
    key: 'concept',
    labelKey: 'ADMIN_CSV_TYPE_CONCEPT',
    url: `${ADMIN_IMPORT_BASE_URL}/concept`,
  },
  {
    key: 'conceptset',
    labelKey: 'ADMIN_CSV_TYPE_CONCEPT_SET',
    url: `${ADMIN_IMPORT_BASE_URL}/conceptset`,
  },
  {
    key: 'program',
    labelKey: 'ADMIN_CSV_TYPE_PROGRAM',
    url: `${ADMIN_IMPORT_BASE_URL}/program`,
  },
  {
    key: 'patient',
    labelKey: 'ADMIN_CSV_TYPE_PATIENT',
    url: `${ADMIN_IMPORT_BASE_URL}/patient`,
  },
  {
    key: 'encounter',
    labelKey: 'ADMIN_CSV_TYPE_ENCOUNTER',
    url: `${ADMIN_IMPORT_BASE_URL}/encounter`,
  },
  {
    key: 'form2encounter',
    labelKey: 'ADMIN_CSV_TYPE_FORM2_ENCOUNTER',
    url: `${ADMIN_IMPORT_BASE_URL}/form2encounter`,
  },
  {
    key: 'drug',
    labelKey: 'ADMIN_CSV_TYPE_DRUG',
    url: `${ADMIN_IMPORT_BASE_URL}/drug`,
  },
  {
    key: 'labResults',
    labelKey: 'ADMIN_CSV_TYPE_LAB_RESULTS',
    url: `${ADMIN_IMPORT_BASE_URL}/labResults`,
  },
  {
    key: 'referenceterms',
    labelKey: 'ADMIN_CSV_TYPE_REFERENCE_TERMS',
    url: `${ADMIN_IMPORT_BASE_URL}/referenceterms`,
  },
  {
    key: 'updateReferenceTerms',
    labelKey: 'ADMIN_CSV_TYPE_UPDATE_REFERENCE_TERMS',
    url: `${ADMIN_IMPORT_BASE_URL}/referenceterms/new`,
  },
  {
    key: 'relationship',
    labelKey: 'ADMIN_CSV_TYPE_RELATIONSHIP',
    url: `${ADMIN_IMPORT_BASE_URL}/relationship`,
  },
] as const;
