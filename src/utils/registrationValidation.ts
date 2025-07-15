/**
 * Registration Validation Utilities
 * 
 * Comprehensive validation utilities for patient registration forms
 * based on the AngularJS validation patterns and business rules.
 */

import { 
  PatientFormData, 
  ValidationError, 
  ValidationResult,
  RegistrationConfig,
  PatientFormField 
} from '@types/registration';

/**
 * Validate required fields based on configuration
 */
export const validateRequiredFields = (
  formData: PatientFormData,
  config?: RegistrationConfig
): ValidationError[] => {
  const errors: ValidationError[] = [];

  // Primary identifier validation
  if (!formData.primaryIdentifier.identifier.trim()) {
    errors.push({
      field: 'primaryIdentifier.identifier',
      message: 'REGISTRATION_ERROR_PATIENT_ID_REQUIRED'
    });
  }

  // Name validation
  if (!formData.name.givenName.trim()) {
    errors.push({
      field: 'name.givenName',
      message: 'REGISTRATION_ERROR_FIRST_NAME_REQUIRED'
    });
  }

  if (!formData.name.familyName.trim()) {
    errors.push({
      field: 'name.familyName',
      message: 'REGISTRATION_ERROR_LAST_NAME_REQUIRED'
    });
  }

  // Gender validation
  if (!formData.demographics.gender) {
    errors.push({
      field: 'demographics.gender',
      message: 'REGISTRATION_ERROR_GENDER_REQUIRED'
    });
  }

  // Age or birthdate validation
  const hasAge = formData.demographics.age.years > 0 || 
                 formData.demographics.age.months > 0 || 
                 formData.demographics.age.days > 0;
  const hasBirthdate = !!formData.demographics.birthdate;

  if (config?.dobMandatory) {
    if (!hasBirthdate) {
      errors.push({
        field: 'demographics.birthdate',
        message: 'REGISTRATION_ERROR_BIRTHDATE_REQUIRED'
      });
    }
  } else {
    if (!hasAge && !hasBirthdate) {
      errors.push({
        field: 'demographics.age',
        message: 'REGISTRATION_ERROR_AGE_OR_BIRTHDATE_REQUIRED'
      });
    }
  }

  return errors;
};

/**
 * Validate field formats and patterns
 */
export const validateFieldFormats = (
  formData: PatientFormData
): ValidationError[] => {
  const errors: ValidationError[] = [];

  // Email format validation (if email attribute exists)
  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (formData.attributes) {
    formData.attributes.forEach((attr, index) => {
      if (attr.attributeType.name.toLowerCase().includes('email') && 
          attr.value && 
          !emailPattern.test(attr.value)) {
        errors.push({
          field: `attributes.${index}.value`,
          message: 'REGISTRATION_ERROR_INVALID_EMAIL_FORMAT'
        });
      }
    });
  }

  // Phone number format validation (basic)
  const phonePattern = /^[\d\s\-\+\(\)]+$/;
  if (formData.attributes) {
    formData.attributes.forEach((attr, index) => {
      if (attr.attributeType.name.toLowerCase().includes('phone') && 
          attr.value && 
          !phonePattern.test(attr.value)) {
        errors.push({
          field: `attributes.${index}.value`,
          message: 'REGISTRATION_ERROR_INVALID_PHONE_FORMAT'
        });
      }
    });
  }

  // Postal code format validation (if present)
  if (formData.address.postalCode) {
    const postalCodePattern = /^[\w\s\-]+$/;
    if (!postalCodePattern.test(formData.address.postalCode)) {
      errors.push({
        field: 'address.postalCode',
        message: 'REGISTRATION_ERROR_INVALID_POSTAL_CODE_FORMAT'
      });
    }
  }

  return errors;
};

/**
 * Validate age constraints
 */
export const validateAgeConstraints = (
  formData: PatientFormData
): ValidationError[] => {
  const errors: ValidationError[] = [];
  const { age } = formData.demographics;

  // Age range validation
  if (age.years < 0 || age.years > 120) {
    errors.push({
      field: 'demographics.age.years',
      message: 'REGISTRATION_ERROR_INVALID_AGE_YEARS'
    });
  }

  if (age.months < 0 || age.months > 12) {
    errors.push({
      field: 'demographics.age.months',
      message: 'REGISTRATION_ERROR_INVALID_AGE_MONTHS'
    });
  }

  if (age.days < 0 || age.days > 31) {
    errors.push({
      field: 'demographics.age.days',
      message: 'REGISTRATION_ERROR_INVALID_AGE_DAYS'
    });
  }

  return errors;
};

/**
 * Validate birthdate constraints
 */
export const validateBirthdateConstraints = (
  formData: PatientFormData
): ValidationError[] => {
  const errors: ValidationError[] = [];
  const { birthdate } = formData.demographics;

  if (birthdate) {
    const birthDate = new Date(birthdate);
    const today = new Date();
    
    // Birthdate cannot be in the future
    if (birthDate > today) {
      errors.push({
        field: 'demographics.birthdate',
        message: 'REGISTRATION_ERROR_BIRTHDATE_FUTURE'
      });
    }

    // Birthdate cannot be too far in the past (more than 120 years)
    const maxAge = new Date();
    maxAge.setFullYear(maxAge.getFullYear() - 120);
    if (birthDate < maxAge) {
      errors.push({
        field: 'demographics.birthdate',
        message: 'REGISTRATION_ERROR_BIRTHDATE_TOO_OLD'
      });
    }
  }

  return errors;
};

/**
 * Validate identifier format and uniqueness
 */
export const validateIdentifier = (
  identifier: string,
  identifierType: any
): ValidationError[] => {
  const errors: ValidationError[] = [];

  if (!identifier.trim()) {
    errors.push({
      field: 'primaryIdentifier.identifier',
      message: 'REGISTRATION_ERROR_IDENTIFIER_REQUIRED'
    });
    return errors;
  }

  // Basic format validation (alphanumeric and some special characters)
  const identifierPattern = /^[a-zA-Z0-9\-_]+$/;
  if (!identifierPattern.test(identifier)) {
    errors.push({
      field: 'primaryIdentifier.identifier',
      message: 'REGISTRATION_ERROR_IDENTIFIER_INVALID_FORMAT'
    });
  }

  // Length validation
  if (identifier.length < 3) {
    errors.push({
      field: 'primaryIdentifier.identifier',
      message: 'REGISTRATION_ERROR_IDENTIFIER_TOO_SHORT'
    });
  }

  if (identifier.length > 50) {
    errors.push({
      field: 'primaryIdentifier.identifier',
      message: 'REGISTRATION_ERROR_IDENTIFIER_TOO_LONG'
    });
  }

  return errors;
};

/**
 * Validate patient attributes based on their types
 */
export const validatePatientAttributes = (
  formData: PatientFormData,
  config?: RegistrationConfig
): ValidationError[] => {
  const errors: ValidationError[] = [];

  if (!formData.attributes || !config?.attributeTypes) {
    return errors;
  }

  formData.attributes.forEach((attr, index) => {
    const attributeType = attr.attributeType;

    // Required attribute validation
    if (attributeType.required && (!attr.value || attr.value.toString().trim() === '')) {
      errors.push({
        field: `attributes.${index}.value`,
        message: `REGISTRATION_ERROR_ATTRIBUTE_REQUIRED_${attributeType.name.toUpperCase()}`
      });
    }

    // Datatype-specific validation
    if (attr.value) {
      switch (attributeType.datatype) {
        case 'org.openmrs.customdatatype.datatype.DateDatatype':
          const dateValue = new Date(attr.value);
          if (isNaN(dateValue.getTime())) {
            errors.push({
              field: `attributes.${index}.value`,
              message: 'REGISTRATION_ERROR_INVALID_DATE_FORMAT'
            });
          }
          break;

        case 'org.openmrs.customdatatype.datatype.BooleanDatatype':
          if (typeof attr.value !== 'boolean' && 
              attr.value !== 'true' && 
              attr.value !== 'false') {
            errors.push({
              field: `attributes.${index}.value`,
              message: 'REGISTRATION_ERROR_INVALID_BOOLEAN_VALUE'
            });
          }
          break;

        case 'org.openmrs.customdatatype.datatype.FreeTextDatatype':
          if (typeof attr.value !== 'string') {
            errors.push({
              field: `attributes.${index}.value`,
              message: 'REGISTRATION_ERROR_INVALID_TEXT_VALUE'
            });
          }
          break;
      }
    }
  });

  return errors;
};

/**
 * Main validation function that combines all validation rules
 */
export const validatePatientForm = (
  formData: PatientFormData,
  config?: RegistrationConfig
): ValidationResult => {
  const allErrors: ValidationError[] = [
    ...validateRequiredFields(formData, config),
    ...validateFieldFormats(formData),
    ...validateAgeConstraints(formData),
    ...validateBirthdateConstraints(formData),
    ...validateIdentifier(formData.primaryIdentifier.identifier, formData.primaryIdentifier.identifierType),
    ...validatePatientAttributes(formData, config),
  ];

  return {
    isValid: allErrors.length === 0,
    errors: allErrors,
  };
};

/**
 * Validate a specific field
 */
export const validateField = (
  field: PatientFormField,
  value: any,
  formData: PatientFormData,
  config?: RegistrationConfig
): ValidationError[] => {
  // Create a temporary form data object with the updated field
  const tempFormData = { ...formData };
  
  // Update the specific field (this is a simplified approach)
  // In a real implementation, you'd need to handle nested field updates properly
  (tempFormData as any)[field] = value;

  const fullValidation = validatePatientForm(tempFormData, config);
  
  // Return only errors related to the specific field
  return fullValidation.errors.filter(error => error.field.startsWith(field));
};

/**
 * Get validation error message for a specific field
 */
export const getFieldError = (
  field: string,
  errors: ValidationError[]
): string | undefined => {
  const error = errors.find(err => err.field === field);
  return error?.message;
};

/**
 * Check if a field has validation errors
 */
export const hasFieldError = (
  field: string,
  errors: ValidationError[]
): boolean => {
  return errors.some(err => err.field === field);
};
