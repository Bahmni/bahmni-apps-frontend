import { FormMetadata } from './models';
import { FormData, FormControlData } from './observationFormsTransformer';

/**
 * Validation error structure
 */
export interface ValidationError {
  field: string;
  message: string;
  type: 'required' | 'invalid_type' | 'invalid_format' | 'custom';
}

/**
 * Validation result
 */
export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
}

/**
 * Validates a single form control based on its type
 */
function validateControl(control: FormControlData): ValidationError[] {
  const errors: ValidationError[] = [];

  // Skip validation for section headers
  if (control.type === 'section') {
    return errors;
  }

  // Validate concept UUID is present
  if (!control.conceptUuid) {
    errors.push({
      field: control.id,
      message: 'Control must have a concept UUID',
      type: 'required',
    });
  }

  // Type-specific validation
  if (control.value !== null && control.value !== undefined) {
    switch (control.type) {
      case 'number':
        if (typeof control.value !== 'number') {
          errors.push({
            field: control.id,
            message: 'Number field must contain a numeric value',
            type: 'invalid_type',
          });
        }
        break;

      case 'date':
      case 'datetime':
        if (
          !(control.value instanceof Date) &&
          typeof control.value !== 'string'
        ) {
          errors.push({
            field: control.id,
            message: 'Date field must contain a Date object or ISO string',
            type: 'invalid_type',
          });
        }
        break;

      case 'select':
      case 'multiselect':
        if (typeof control.value !== 'object' || !('uuid' in control.value)) {
          errors.push({
            field: control.id,
            message: 'Select field must contain a concept value with uuid',
            type: 'invalid_type',
          });
        }
        break;

      case 'text':
        if (typeof control.value !== 'string') {
          errors.push({
            field: control.id,
            message: 'Text field must contain a string value',
            type: 'invalid_type',
          });
        }
        break;
    }
  }

  // Recursively validate group members
  if (control.groupMembers && control.groupMembers.length > 0) {
    control.groupMembers.forEach((member) => {
      errors.push(...validateControl(member));
    });
  }

  return errors;
}

/**
 * Validates form data structure and content
 *
 * @param formData - The form data to validate
 * @param metadata - Optional form metadata for additional validation rules
 * @returns ValidationResult with isValid flag and array of errors
 */
export function validateFormData(
  formData: FormData,
  metadata?: FormMetadata,
): ValidationResult {
  const errors: ValidationError[] = [];

  // Check if form data exists
  if (!formData) {
    errors.push({
      field: 'root',
      message: 'Form data is required',
      type: 'required',
    });
    return { isValid: false, errors };
  }

  // Check if controls array exists
  if (!formData.controls || !Array.isArray(formData.controls)) {
    errors.push({
      field: 'controls',
      message: 'Form data must contain a controls array',
      type: 'required',
    });
    return { isValid: false, errors };
  }

  // Validate each control
  formData.controls.forEach((control) => {
    errors.push(...validateControl(control));
  });

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Checks if form has any data entered (non-null values)
 *
 * @param formData - The form data to check
 * @returns true if form has any values, false if all fields are empty
 */
export function hasFormData(formData: FormData): boolean {
  if (!formData?.controls) {
    return false;
  }

  const checkControl = (control: FormControlData): boolean => {
    // Check if control has a value
    if (control.value !== null && control.value !== undefined) {
      return true;
    }

    // Recursively check group members
    if (control.groupMembers && control.groupMembers.length > 0) {
      return control.groupMembers.some(checkControl);
    }

    return false;
  };

  return formData.controls.some(checkControl);
}

/**
 * Validates that required fields have values
 * Note: This is a basic implementation. In the future, required field info
 * should come from form metadata/schema
 *
 * @param formData - The form data to validate
 * @param requiredFields - Array of field IDs that are required
 * @returns ValidationResult
 */
export function validateRequiredFields(
  formData: FormData,
  requiredFields: string[],
): ValidationResult {
  const errors: ValidationError[] = [];

  const findControl = (
    controls: FormControlData[],
    fieldId: string,
  ): FormControlData | null => {
    for (const control of controls) {
      if (control.id === fieldId) {
        return control;
      }
      if (control.groupMembers) {
        const found = findControl(control.groupMembers, fieldId);
        if (found) return found;
      }
    }
    return null;
  };

  requiredFields.forEach((fieldId) => {
    const control = findControl(formData.controls, fieldId);
    if (control?.value === null || control?.value === undefined) {
      errors.push({
        field: fieldId,
        message: `Field ${fieldId} is required`,
        type: 'required',
      });
    }
  });

  return {
    isValid: errors.length === 0,
    errors,
  };
}
