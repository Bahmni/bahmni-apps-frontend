import {
  camelToScreamingSnakeCase,
  convertToSentenceCase,
} from '@bahmni/services';
import type { PersonAttributeField } from '../../hooks/usePersonAttributeFields';
import type { PersonAttributesData } from '../../models/patient';

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
  value: string | number | boolean | undefined,
  validationConfig: ValidationConfig,
  t: (key: string | string[], params?: Record<string, unknown>) => string,
): { isValid: boolean; error: string } => {
  if (!value) {
    return { isValid: true, error: '' };
  }

  const regex = new RegExp(validationConfig.pattern);
  const isValid = regex.test(value as string);

  return {
    isValid,
    error: isValid ? '' : t(validationConfig.errorMessage),
  };
};

export const validateAllFields = (
  fieldsToShow: PersonAttributeField[],
  formData: PersonAttributesData,
  t: (key: string | string[], params?: Record<string, unknown>) => string,
  fieldValidationConfig?: FieldValidationConfig,
): ValidationResult => {
  const errors: Record<string, string> = {};
  let isValid = true;

  fieldsToShow.forEach((field) => {
    const fieldName = field.name;
    const value = formData[fieldName];
    const isRequired = field.required ?? false;

    if (
      isRequired &&
      (!value || (typeof value === 'string' && !value.trim()))
    ) {
      errors[fieldName] = t(
        [
          `REGISTRATION_FIELD_REQUIRED_${camelToScreamingSnakeCase(fieldName)}`,
          'REGISTRATION_FIELD_REQUIRED_ERROR',
        ],
        { field: convertToSentenceCase(fieldName) },
      );
      isValid = false;
      return;
    }

    const validationConfig = getValidationConfig(
      fieldName,
      fieldValidationConfig,
    );

    if (validationConfig && value && t) {
      const result = validateField(value, validationConfig, t);
      if (!result.isValid) {
        errors[fieldName] = result.error;
        isValid = false;
      }
    }
  });

  return { isValid, errors };
};
