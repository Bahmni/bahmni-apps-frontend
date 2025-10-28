/**
 * Interface representing name field validation errors
 */
export interface NameErrors {
  firstName: string;
  middleName: string;
  lastName: string;
}

/**
 * Interface representing form validation errors for required fields
 */
export interface ValidationErrors {
  firstName: string;
  lastName: string;
  gender: string;
  dateOfBirth: string;
}

/**
 * Interface representing age field validation errors
 */
export interface AgeErrors {
  ageYears: string;
  ageMonths: string;
  ageDays: string;
}

/**
 * Interface representing date field validation errors
 */
export interface DateErrors {
  dateOfBirth: string;
}

/**
 * Initial values for name validation errors
 */
export const INITIAL_NAME_ERRORS: NameErrors = {
  firstName: '',
  middleName: '',
  lastName: '',
};

/**
 * Initial values for form validation errors
 */
export const INITIAL_VALIDATION_ERRORS: ValidationErrors = {
  firstName: '',
  lastName: '',
  gender: '',
  dateOfBirth: '',
};

/**
 * Initial values for age validation errors
 */
export const INITIAL_AGE_ERRORS: AgeErrors = {
  ageYears: '',
  ageMonths: '',
  ageDays: '',
};

/**
 * Initial values for date validation errors
 */
export const INITIAL_DATE_ERRORS: DateErrors = {
  dateOfBirth: '',
};
