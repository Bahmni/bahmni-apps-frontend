import type { PersonAttributeField } from '../../../hooks/usePersonAttributeFields';
import type { ContactData } from '../../../models/patient';

export interface ValidationConfig {
  pattern: string;
  errorMessage: string;
}

export interface ValidationResult {
  isValid: boolean;
  errors: Record<string, string>;
}

export interface FieldValidationConfig {
  [fieldName: string]: ValidationConfig;
}

export const getValidationConfig = (
  fieldName: string,
  fieldValidationConfig?: FieldValidationConfig,
): ValidationConfig | undefined => {
  const validationRule = fieldValidationConfig?.[fieldName];
  if (!validationRule) return undefined;

  return {
    pattern: validationRule.pattern,
    errorMessage: validationRule.errorMessage,
  };
};

export const validateField = (
  value: string | undefined,
  validationConfig: ValidationConfig,
): { isValid: boolean; error: string } => {
  if (!value) {
    return { isValid: true, error: '' };
  }

  const regex = new RegExp(validationConfig.pattern);
  const isValid = regex.test(value);

  return {
    isValid,
    error: isValid ? '' : validationConfig.errorMessage,
  };
};

export const validateAllFields = (
  fieldsToShow: PersonAttributeField[],
  formData: ContactData,
  fieldValidationConfig?: FieldValidationConfig,
): ValidationResult => {
  const errors: Record<string, string> = {};
  let isValid = true;

  fieldsToShow.forEach((field) => {
    const fieldName = field.name;
    const value = formData[fieldName as keyof ContactData] as string;
    const validationConfig = getValidationConfig(
      fieldName,
      fieldValidationConfig,
    );

    if (validationConfig && value) {
      const result = validateField(value, validationConfig);
      if (!result.isValid) {
        errors[fieldName] = result.error;
        isValid = false;
      }
    }
  });

  return { isValid, errors };
};

export const isNumericPhoneValue = (value: string): boolean => {
  const numericRegex = /^\+?[0-9]*$/;
  return numericRegex.test(value);
};
