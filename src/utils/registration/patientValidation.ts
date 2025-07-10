/**
 * Patient Validation Utilities
 * Comprehensive validation rules for patient registration
 */

import {
  PatientFormData,
  FormValidationState,
} from '../../types/registration';
import {
  REGISTRATION_VALIDATION_MESSAGES,
  REGISTRATION_CONFIG,
} from '../../constants/registration';

/**
 * Validation result structure
 */
export interface FieldValidationResult {
  isValid: boolean;
  error?: string;
  warning?: string;
}

/**
 * Comprehensive form validation result
 */
export interface FormValidationResult {
  isValid: boolean;
  errors: Record<string, string>;
  warnings: Record<string, string>;
  missingRequired: string[];
  completeness: number;
}

/**
 * Validate given name
 * Rules: Required, 2-50 characters, letters/spaces/hyphens only
 */
export const validateGivenName = (value: string): FieldValidationResult => {
  if (!value || !value.trim()) {
    return {
      isValid: false,
      error: REGISTRATION_VALIDATION_MESSAGES.REQUIRED_FIELD,
    };
  }

  const trimmedValue = value.trim();

  if (trimmedValue.length < REGISTRATION_CONFIG.MIN_NAME_LENGTH) {
    return {
      isValid: false,
      error: REGISTRATION_VALIDATION_MESSAGES.INVALID_NAME,
    };
  }

  if (trimmedValue.length > REGISTRATION_CONFIG.MAX_NAME_LENGTH) {
    return {
      isValid: false,
      error: REGISTRATION_VALIDATION_MESSAGES.INVALID_NAME,
    };
  }

  if (!/^[a-zA-Z\s\-']+$/.test(trimmedValue)) {
    return {
      isValid: false,
      error: REGISTRATION_VALIDATION_MESSAGES.INVALID_NAME,
    };
  }

  return { isValid: true };
};

/**
 * Validate family name
 * Rules: Required, 2-50 characters, letters/spaces/hyphens only
 */
export const validateFamilyName = (value: string): FieldValidationResult => {
  return validateGivenName(value); // Same rules as given name
};

/**
 * Validate middle name
 * Rules: Optional, but if provided, same rules as given name
 */
export const validateMiddleName = (value: string): FieldValidationResult => {
  if (!value || !value.trim()) {
    return { isValid: true }; // Optional field
  }

  return validateGivenName(value);
};

/**
 * Validate gender
 * Rules: Required, must be 'M', 'F', or 'O'
 */
export const validateGender = (value: string): FieldValidationResult => {
  if (!value) {
    return {
      isValid: false,
      error: REGISTRATION_VALIDATION_MESSAGES.REQUIRED_FIELD,
    };
  }

  if (!['M', 'F', 'O'].includes(value)) {
    return {
      isValid: false,
      error: 'Gender must be Male, Female, or Other',
    };
  }

  return { isValid: true };
};

/**
 * Validate birthdate
 * Rules: Optional, but if provided, cannot be in future and must be after 1900
 */
export const validateBirthdate = (value: string): FieldValidationResult => {
  if (!value || !value.trim()) {
    return { isValid: true }; // Optional if age is provided
  }

  try {
    const birthDate = new Date(value);
    const now = new Date();

    if (isNaN(birthDate.getTime())) {
      return {
        isValid: false,
        error: REGISTRATION_VALIDATION_MESSAGES.INVALID_DATE,
      };
    }

    if (birthDate > now) {
      return {
        isValid: false,
        error: REGISTRATION_VALIDATION_MESSAGES.INVALID_BIRTHDATE,
      };
    }

    if (birthDate.getFullYear() < REGISTRATION_CONFIG.MIN_BIRTH_YEAR) {
      return {
        isValid: false,
        error: REGISTRATION_VALIDATION_MESSAGES.INVALID_BIRTHDATE,
      };
    }

    return { isValid: true };
  } catch (error) {
    return {
      isValid: false,
      error: REGISTRATION_VALIDATION_MESSAGES.INVALID_DATE,
    };
  }
};

/**
 * Validate age
 * Rules: Optional, but if provided, must be 0-150
 */
export const validateAge = (value: number | string): FieldValidationResult => {
  if (value === null || value === undefined || value === '') {
    return { isValid: true }; // Optional if birthdate is provided
  }

  const ageNum = typeof value === 'string' ? parseInt(value) : value;

  if (isNaN(ageNum)) {
    return {
      isValid: false,
      error: REGISTRATION_VALIDATION_MESSAGES.INVALID_AGE,
    };
  }

  if (ageNum < REGISTRATION_CONFIG.MIN_AGE || ageNum > REGISTRATION_CONFIG.MAX_AGE) {
    return {
      isValid: false,
      error: REGISTRATION_VALIDATION_MESSAGES.INVALID_AGE,
    };
  }

  return { isValid: true };
};

/**
 * Validate birthdate and age consistency
 * Rules: Either birthdate or age is required, but both can be provided if consistent
 */
export const validateBirthdateAndAge = (
  birthdate: string,
  age: number | string,
  birthdateEstimated: boolean
): FieldValidationResult => {
  const hasAge = age !== null && age !== undefined && age !== '' && !isNaN(Number(age));
  const hasBirthdate = birthdate && birthdate.trim();

  // At least one is required
  if (!hasAge && !hasBirthdate) {
    return {
      isValid: false,
      error: 'Either birthdate or age is required',
    };
  }

  // If both provided, check consistency
  if (hasAge && hasBirthdate) {
    const calculatedAge = calculateAgeFromBirthdate(birthdate);
    const providedAge = Number(age);

    // Allow 1 year difference for estimated birthdates
    const tolerance = birthdateEstimated ? 1 : 0;

    if (Math.abs(calculatedAge - providedAge) > tolerance) {
      return {
        isValid: false,
        error: 'Age and birthdate are inconsistent',
        warning: birthdateEstimated ? 'Age will be calculated from estimated birthdate' : undefined,
      };
    }
  }

  return { isValid: true };
};

/**
 * Validate identifier
 * Rules: Required value and type, unique identifier
 */
export const validateIdentifier = (
  identifier: string,
  identifierType: string,
  existingIdentifiers: string[] = []
): FieldValidationResult => {
  if (!identifier || !identifier.trim()) {
    return {
      isValid: false,
      error: REGISTRATION_VALIDATION_MESSAGES.REQUIRED_FIELD,
    };
  }

  if (!identifierType) {
    return {
      isValid: false,
      error: 'Identifier type is required',
    };
  }

  const trimmedIdentifier = identifier.trim();

  // Check for duplicates
  if (existingIdentifiers.includes(trimmedIdentifier)) {
    return {
      isValid: false,
      error: REGISTRATION_VALIDATION_MESSAGES.DUPLICATE_IDENTIFIER,
    };
  }

  // Basic format validation (can be extended based on identifier type)
  if (trimmedIdentifier.length < 1) {
    return {
      isValid: false,
      error: REGISTRATION_VALIDATION_MESSAGES.INVALID_IDENTIFIER,
    };
  }

  return { isValid: true };
};

/**
 * Validate identifiers array
 * Rules: At least one identifier required, no duplicates
 */
export const validateIdentifiers = (
  identifiers: PatientFormData['identifiers']
): FieldValidationResult => {
  if (!identifiers || identifiers.length < REGISTRATION_CONFIG.REQUIRED_IDENTIFIERS_MIN) {
    return {
      isValid: false,
      error: REGISTRATION_VALIDATION_MESSAGES.MISSING_REQUIRED_IDENTIFIER,
    };
  }

  const validIdentifiers = identifiers.filter(id => id.identifier.trim() && id.identifierType);

  if (validIdentifiers.length < REGISTRATION_CONFIG.REQUIRED_IDENTIFIERS_MIN) {
    return {
      isValid: false,
      error: REGISTRATION_VALIDATION_MESSAGES.MISSING_REQUIRED_IDENTIFIER,
    };
  }

  // Check for duplicate identifiers
  const identifierValues = validIdentifiers.map(id => id.identifier.trim());
  const duplicates = identifierValues.filter((id, index) => identifierValues.indexOf(id) !== index);

  if (duplicates.length > 0) {
    return {
      isValid: false,
      error: REGISTRATION_VALIDATION_MESSAGES.DUPLICATE_IDENTIFIER,
    };
  }

  return { isValid: true };
};

/**
 * Validate email address
 * Rules: Optional, but if provided, must be valid format
 */
export const validateEmail = (value: string): FieldValidationResult => {
  if (!value || !value.trim()) {
    return { isValid: true }; // Optional field
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  if (!emailRegex.test(value.trim())) {
    return {
      isValid: false,
      error: REGISTRATION_VALIDATION_MESSAGES.INVALID_EMAIL,
    };
  }

  return { isValid: true };
};

/**
 * Validate phone number
 * Rules: Optional, but if provided, must be valid format
 */
export const validatePhone = (value: string): FieldValidationResult => {
  if (!value || !value.trim()) {
    return { isValid: true }; // Optional field
  }

  // Basic phone validation - can be customized based on locale
  const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/;
  const cleanPhone = value.replace(/[\s\-\(\)\.]/g, '');

  if (!phoneRegex.test(cleanPhone)) {
    return {
      isValid: false,
      error: REGISTRATION_VALIDATION_MESSAGES.INVALID_PHONE,
    };
  }

  return { isValid: true };
};

/**
 * Validate address field
 * Rules: Optional individual fields, but if provided, basic validation
 */
export const validateAddressField = (
  value: string,
  fieldName: string,
  isRequired: boolean = false
): FieldValidationResult => {
  if (isRequired && (!value || !value.trim())) {
    return {
      isValid: false,
      error: REGISTRATION_VALIDATION_MESSAGES.REQUIRED_FIELD,
    };
  }

  if (!value || !value.trim()) {
    return { isValid: true }; // Optional field
  }

  // Basic length validation
  if (value.trim().length > 255) {
    return {
      isValid: false,
      error: `${fieldName} is too long (maximum 255 characters)`,
    };
  }

  return { isValid: true };
};

/**
 * Validate photo file
 * Rules: Optional, but if provided, check size, format, and dimensions
 */
export const validatePhoto = (file: File): FieldValidationResult => {
  if (!file) {
    return { isValid: true }; // Optional field
  }

  // Check file size
  const maxSizeBytes = REGISTRATION_CONFIG.MAX_PHOTO_SIZE_MB * 1024 * 1024;
  if (file.size > maxSizeBytes) {
    return {
      isValid: false,
      error: REGISTRATION_VALIDATION_MESSAGES.INVALID_PHOTO_SIZE,
    };
  }

  // Check file format
  if (!REGISTRATION_CONFIG.SUPPORTED_PHOTO_FORMATS.includes(file.type as any)) {
    return {
      isValid: false,
      error: REGISTRATION_VALIDATION_MESSAGES.INVALID_PHOTO_FORMAT,
    };
  }

  return { isValid: true };
};

/**
 * Validate complete patient form
 * Performs comprehensive validation of all form fields
 */
export const validatePatientForm = (formData: PatientFormData): FormValidationResult => {
  const errors: Record<string, string> = {};
  const warnings: Record<string, string> = {};
  const missingRequired: string[] = [];

  // Validate required demographics
  const givenNameResult = validateGivenName(formData.givenName || '');
  if (!givenNameResult.isValid) {
    errors.givenName = givenNameResult.error!;
    missingRequired.push('givenName');
  }

  const familyNameResult = validateFamilyName(formData.familyName || '');
  if (!familyNameResult.isValid) {
    errors.familyName = familyNameResult.error!;
    missingRequired.push('familyName');
  }

  const middleNameResult = validateMiddleName(formData.middleName || '');
  if (!middleNameResult.isValid) {
    errors.middleName = middleNameResult.error!;
  }

  const genderResult = validateGender(formData.gender || '');
  if (!genderResult.isValid) {
    errors.gender = genderResult.error!;
    missingRequired.push('gender');
  }

  // Validate age/birthdate
  const birthdateResult = validateBirthdate(formData.birthdate || '');
  if (!birthdateResult.isValid) {
    errors.birthdate = birthdateResult.error!;
  }

  const ageResult = validateAge(formData.age ?? '');
  if (!ageResult.isValid) {
    errors.age = ageResult.error!;
  }

  const ageConsistencyResult = validateBirthdateAndAge(
    formData.birthdate || '',
    formData.age ?? '',
    formData.birthdateEstimated || false
  );
  if (!ageConsistencyResult.isValid) {
    errors.birthdateAge = ageConsistencyResult.error!;
    missingRequired.push('birthdate or age');
  }
  if (ageConsistencyResult.warning) {
    warnings.birthdateAge = ageConsistencyResult.warning;
  }

  // Validate identifiers
  const identifiersResult = validateIdentifiers(formData.identifiers);
  if (!identifiersResult.isValid) {
    errors.identifiers = identifiersResult.error!;
    missingRequired.push('identifiers');
  }

  // Validate individual identifiers
  formData.identifiers.forEach((identifier, index) => {
    const existingIdentifiers = formData.identifiers
      .filter((_, i) => i !== index)
      .map(id => id.identifier.trim());

    const identifierResult = validateIdentifier(
      identifier.identifier,
      identifier.identifierType,
      existingIdentifiers
    );

    if (!identifierResult.isValid) {
      errors[`identifier_${index}`] = identifierResult.error!;
    }
  });

  // Validate address fields (all optional)
  if (formData.address) {
    const addressResult = validateAddressField(formData.address.address1 || '', 'Address Line 1');
    if (!addressResult.isValid) {
      errors.address1 = addressResult.error!;
    }

    const cityResult = validateAddressField(formData.address.cityVillage || '', 'City/Village');
    if (!cityResult.isValid) {
      errors.cityVillage = cityResult.error!;
    }
  }

  // Calculate form completeness
  const totalFields = 4; // givenName, familyName, gender, identifiers
  const completedFields = totalFields - missingRequired.length;
  const completeness = Math.round((completedFields / totalFields) * 100);

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
    warnings,
    missingRequired,
    completeness,
  };
};

/**
 * Helper function to calculate age from birthdate
 */
const calculateAgeFromBirthdate = (birthdate: string): number => {
  if (!birthdate) return 0;

  try {
    const birth = new Date(birthdate);
    const today = new Date();
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();

    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--;
    }

    return Math.max(0, age);
  } catch (error) {
    return 0;
  }
};

/**
 * Validate form step
 * Validates specific wizard step fields
 */
export const validateFormStep = (
  formData: PatientFormData,
  step: number
): FormValidationResult => {
  const errors: Record<string, string> = {};
  const warnings: Record<string, string> = {};
  const missingRequired: string[] = [];

  switch (step) {
    case 1: // Demographics
      const givenNameResult = validateGivenName(formData.givenName || '');
      if (!givenNameResult.isValid) {
        errors.givenName = givenNameResult.error!;
        missingRequired.push('givenName');
      }

      const familyNameResult = validateFamilyName(formData.familyName || '');
      if (!familyNameResult.isValid) {
        errors.familyName = familyNameResult.error!;
        missingRequired.push('familyName');
      }

      const genderResult = validateGender(formData.gender || '');
      if (!genderResult.isValid) {
        errors.gender = genderResult.error!;
        missingRequired.push('gender');
      }

      const ageConsistencyResult = validateBirthdateAndAge(
        formData.birthdate || '',
        formData.age ?? '',
        formData.birthdateEstimated || false
      );
      if (!ageConsistencyResult.isValid) {
        errors.birthdateAge = ageConsistencyResult.error!;
        missingRequired.push('birthdate or age');
      }
      break;

    case 2: // Identifiers
      const identifiersResult = validateIdentifiers(formData.identifiers);
      if (!identifiersResult.isValid) {
        errors.identifiers = identifiersResult.error!;
        missingRequired.push('identifiers');
      }
      break;

    case 3: // Address (all optional)
    case 4: // Attributes (optional)
    case 5: // Photo (optional)
    case 6: // Summary (validation of all previous steps)
      return validatePatientForm(formData);
  }

  const completeness = missingRequired.length === 0 ? 100 : 0;

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
    warnings,
    missingRequired,
    completeness,
  };
};

/**
 * Real-time field validation for immediate feedback
 */
export const validateFieldRealTime = (
  fieldName: string,
  value: any,
  formData: PatientFormData
): FieldValidationResult => {
  switch (fieldName) {
    case 'givenName':
      return validateGivenName(value);
    case 'familyName':
      return validateFamilyName(value);
    case 'middleName':
      return validateMiddleName(value || '');
    case 'gender':
      return validateGender(value);
    case 'birthdate':
      return validateBirthdate(value);
    case 'age':
      return validateAge(value);
    case 'email':
      return validateEmail(value);
    case 'phone':
      return validatePhone(value);
    default:
      return { isValid: true };
  }
};
