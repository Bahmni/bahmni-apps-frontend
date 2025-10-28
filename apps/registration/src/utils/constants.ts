// Validation regex patterns
export const NAME_REGEX = /^[a-zA-Z\s]*$/;
export const PHONE_REGEX = /^\+?[0-9]*$/;

// Age constraints
export const MAX_AGE_YEARS = 120;
export const MAX_AGE_MONTHS = 11;
export const MAX_AGE_DAYS = 31;

// Address field mapping
export const ADDRESS_FIELD_MAPPING = {
  district: 'countyDistrict',
  state: 'stateProvince',
  pincode: 'postalCode',
} as const;

// Debounce delay for address search (ms)
export const ADDRESS_SEARCH_DEBOUNCE_MS = 300;

// Min search length for address hierarchy
export const MIN_SEARCH_LENGTH = 2;
