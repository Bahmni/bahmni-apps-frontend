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
}

/**
 * Patient Address Information Data
 */
export interface AddressData {
  address1: string;
  address2: string;
  countyDistrict: string;
  cityVillage: string;
  stateProvince: string;
  postalCode: string;
}

/**
 * Patient Contact Information Data
 */
export interface ContactData {
  phoneNumber: string;
  altPhoneNumber: string;
}

/**
 * Patient Additional Information Data
 */
export interface AdditionalData {
  email: string;
}
