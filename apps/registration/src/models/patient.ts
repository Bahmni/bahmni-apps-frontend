/**
 * Patient Profile/Basic Information Data
 */
export interface BasicInfoData {
  patientIdFormat: string;
  entryType: boolean;
  firstName: string;
  middleName: string;
  lastName: string;
  gender: string;
  ageYears: string;
  ageMonths: string;
  ageDays: string;
  dateOfBirth: string;
  birthTime: string;
  nameUuid?: string;
}

/**
 * Patient Address Information Data
 */
export interface AddressData {
  address1?: string;
  address2?: string;
  countyDistrict?: string;
  cityVillage?: string;
  stateProvince?: string;
  postalCode?: string;
}

/**
 * Patient Person Attributes Data
 * Used by both Contact Info and Additional Info sections
 * Supports dynamic fields based on configuration
 * Supports various data types: string, number, boolean for different attribute formats
 */
export interface PersonAttributesData {
  [key: string]: string | number | boolean | undefined;
}

/**
 * Patient Additional Identifiers Data
 * Key-value pairs where key is identifier type UUID and value is the identifier
 */
export interface AdditionalIdentifiersData {
  [identifierTypeUuid: string]: string;
}
