/**
 * Interface representing patient form data for registration
 */
export interface PatientFormData {
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
  houseNumber: string;
  locality: string;
  district: string;
  city: string;
  state: string;
  pincode: string;
  phoneNumber: string;
  altPhoneNumber: string;
  email: string;
}

/**
 * Initial values for patient form data
 */
export const INITIAL_FORM_DATA: PatientFormData = {
  patientIdFormat: '',
  entryType: false,
  firstName: '',
  middleName: '',
  lastName: '',
  gender: '',
  ageYears: '',
  ageMonths: '',
  ageDays: '',
  dateOfBirth: '',
  birthTime: '',
  houseNumber: '',
  locality: '',
  district: '',
  city: '',
  state: '',
  pincode: '',
  phoneNumber: '',
  altPhoneNumber: '',
  email: '',
};
