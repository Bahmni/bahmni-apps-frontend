/**
 * Basic Information validation errors
 */
export interface BasicInfoErrors {
  firstName: string;
  middleName: string;
  lastName: string;
}

/**
 * Profile validation errors
 */
export interface ValidationErrors {
  firstName: string;
  lastName: string;
  gender: string;
  dateOfBirth: string;
}

/**
 * Age validation errors
 */
export interface AgeErrors {
  ageYears: string;
  ageMonths: string;
  ageDays: string;
}

/**
 * Date validation errors
 */
export interface DateErrors {
  dateOfBirth: string;
}

/**
 * Address validation errors
 */
export interface AddressErrors {
  district: string;
  state: string;
  pincode: string;
}

/**
 * Profile validation errors for store
 */
export interface ProfileValidationErrors {
  firstName: string;
  middleName: string;
  lastName: string;
  gender: string;
  dateOfBirth: string;
}

/**
 * Age validation errors for store
 */
export interface AgeValidationErrors {
  ageYears: string;
  ageMonths: string;
  ageDays: string;
}

/**
 * Validation result interface
 */
export interface ValidationResult {
  isValid: boolean;
  errors: {
    profile: ProfileValidationErrors;
    age: AgeValidationErrors;
    address: AddressErrors;
  };
}
