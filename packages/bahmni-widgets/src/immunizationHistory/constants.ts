export const FHIR_EXT_IMMUNIZATION_DRUG =
  'http://fhir.bahmni.org/ext/immunization/administeredProduct'; // NOSONAR
export const ENTERING_PROVIDER_CODE = 'EP';
export const ORDERING_PROVIDER_CODE = 'OP';
export const ADD_IMMUNIZATIONS_PRIVILEGE = 'Add Immunizations';

export const ADMINISTERED_COLUMN_FIELDS: string[] = [
  'code',
  'doseSequence',
  'drugName',
  'administeredOn',
  'administeredLocation',
];

export const ADMINISTERED_EXPANDED_FIELDS: string[] = [
  'route',
  'site',
  'manufacturer',
  'batchNumber',
  'expiryDate',
  'recordedBy',
  'orderedBy',
];

export const NOT_ADMINISTERED_COLUMN_FIELDS: string[] = [
  'code',
  'reason',
  'date',
  'recordedBy',
];

export const ADMINISTERED_COLUMN_SORTABILITY: Record<string, boolean> = {
  code: false,
  doseSequence: false,
  drugName: true,
  administeredOn: true,
  administeredLocation: true,
};

export const ADMINISTERED_COLUMN_FILTERABILITY: Record<string, boolean> = {
  code: true,
  doseSequence: false,
  drugName: true,
  administeredOn: true,
  administeredLocation: true,
};

export const ADMINISTERED_COLUMN_FILTER_TYPE: Record<
  string,
  'text' | 'select' | 'dateRange'
> = {
  administeredOn: 'dateRange',
  administeredLocation: 'select',
  code: 'select',
};

export const ADMINISTERED_COLUMN_GROUPABILITY: Record<string, boolean> = {
  administeredLocation: true,
  code: true,
};

export const NOT_ADMINISTERED_COLUMN_SORTABILITY: Record<string, boolean> = {
  code: true,
  reason: false,
  date: true,
  recordedBy: true,
};
