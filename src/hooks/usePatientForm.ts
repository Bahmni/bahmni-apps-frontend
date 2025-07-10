import { useState, useCallback, useMemo, useEffect } from 'react';
import {
  PatientFormData,
  CreatePatientRequest,
  UpdatePatientRequest,
  OpenMRSPatient,
} from '../types/registration';
import { REGISTRATION_CONFIG } from '../constants/registration';
import { RegistrationService } from '../services/registration/registrationService';
import { validatePatientForm } from '../utils/registration/patientValidation';
import {
  mapFormToCreateRequest,
  mapFormToUpdateRequest,
  mapOpenMRSToForm,
} from '../utils/registration/patientMapper';

/**
 * Patient Form Hook
 * Provides comprehensive form state management for patient creation and editing
 */

interface UsePatientFormState {
  formData: PatientFormData;
  errors: Record<string, string>;
  touched: Record<string, boolean>;
  isValid: boolean;
  isDirty: boolean;
  isLoading: boolean;
  isSubmitting: boolean;
  submitError: string | null;
  validationMode: 'onChange' | 'onBlur' | 'onSubmit';
  completeness: {
    percentage: number;
    completedFields: number;
    totalFields: number;
  };
}

interface UsePatientFormActions {
  updateField: (field: string, value: any) => void;
  updateFields: (fields: Partial<PatientFormData>) => void;
  validateField: (field: string) => Promise<void>;
  validateForm: () => Promise<boolean>;
  setFieldTouched: (field: string, touched?: boolean) => void;
  setFieldError: (field: string, error: string | null) => void;
  clearErrors: () => void;
  resetForm: (data?: Partial<PatientFormData>) => void;
  submitForm: () => Promise<OpenMRSPatient | null>;
  loadPatient: (patientUuid: string) => Promise<void>;
  setValidationMode: (mode: 'onChange' | 'onBlur' | 'onSubmit') => void;
}

interface UsePatientFormReturn
  extends UsePatientFormState,
    UsePatientFormActions {
  canSubmit: boolean;
  hasChanges: boolean;
  getFieldError: (field: string) => string | null;
  isFieldTouched: (field: string) => boolean;
  isFieldValid: (field: string) => boolean;
}

interface UsePatientFormOptions {
  mode?: 'create' | 'edit';
  patientUuid?: string;
  initialData?: Partial<PatientFormData>;
  validationMode?: 'onChange' | 'onBlur' | 'onSubmit';
  autoSave?: boolean;
  autoSaveInterval?: number;
  enableDraftSave?: boolean;
}

const DEFAULT_FORM_DATA: PatientFormData = {
  // Demographics
  givenName: '',
  middleName: '',
  familyName: '',
  gender: 'M' as const,
  birthdate: '',
  age: undefined,
  birthdateEstimated: false,

  // Identifiers
  identifiers: [],

  // Address
  address: {
    address1: '',
    address2: '',
    cityVillage: '',
    stateProvince: '',
    country: '',
    postalCode: '',
    countyDistrict: '',
    preferred: true,
  },

  // Attributes
  attributes: [],

  // Photo
  photo: undefined,
};

/**
 * Custom hook for patient form management
 * @param options - Configuration options for the hook
 * @returns Patient form state and actions
 */
export const usePatientForm = (
  options: UsePatientFormOptions = {},
): UsePatientFormReturn => {
  const {
    mode = 'create',
    patientUuid,
    initialData = {},
    validationMode: initialValidationMode = 'onBlur',
    autoSave = false,
    autoSaveInterval = REGISTRATION_CONFIG.FORM_AUTO_SAVE_INTERVAL_MS,
    enableDraftSave = true,
  } = options;

  // State management
  const [formData, setFormData] = useState<PatientFormData>({
    ...DEFAULT_FORM_DATA,
    ...initialData,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [validationMode, setValidationMode] = useState(initialValidationMode);
  const [originalFormData, setOriginalFormData] = useState<PatientFormData>({
    ...DEFAULT_FORM_DATA,
    ...initialData,
  });

  // Computed values
  const isValid = useMemo(() => {
    return Object.keys(errors).length === 0;
  }, [errors]);

  const isDirty = useMemo(() => {
    return JSON.stringify(formData) !== JSON.stringify(originalFormData);
  }, [formData, originalFormData]);

  const completeness = useMemo(() => {
    const fields = [
      'givenName',
      'familyName',
      'gender',
      'birthdate',
      'age',
      'identifiers',
      'address.address1',
      'address.cityVillage',
      'address.stateProvince',
      'address.country',
    ];

    let completedFields = 0;

    fields.forEach((field) => {
      const value = field.includes('.')
        ? field.split('.').reduce((obj, key) => obj?.[key], formData as any)
        : formData[field as keyof PatientFormData];

      if (value !== undefined && value !== null && value !== '') {
        if (Array.isArray(value) && value.length > 0) {
          completedFields++;
        } else if (!Array.isArray(value)) {
          completedFields++;
        }
      }
    });

    return {
      completedFields,
      totalFields: fields.length,
      percentage: Math.round((completedFields / fields.length) * 100),
    };
  }, [formData]);

  const canSubmit = useMemo(() => {
    return isValid && !isSubmitting && isDirty;
  }, [isValid, isSubmitting, isDirty]);

  const hasChanges = useMemo(() => isDirty, [isDirty]);

  // Update field value
  const updateField = useCallback(
    (field: string, value: any) => {
      setFormData((prev) => {
        const newData = { ...prev };

        // Handle nested field updates (e.g., 'address.address1')
        if (field.includes('.')) {
          const keys = field.split('.');
          let current = newData as any;

          for (let i = 0; i < keys.length - 1; i++) {
            if (!current[keys[i]]) {
              current[keys[i]] = {};
            }
            current = current[keys[i]];
          }

          current[keys[keys.length - 1]] = value;
        } else {
          (newData as any)[field] = value;
        }

        return newData;
      });

      // Clear field error when value changes
      if (errors[field]) {
        setErrors((prev) => {
          const newErrors = { ...prev };
          delete newErrors[field];
          return newErrors;
        });
      }

      // Validate on change if enabled
      if (validationMode === 'onChange') {
        validateField(field);
      }
    },
    [errors, validationMode],
  );

  // Update multiple fields
  const updateFields = useCallback(
    (fields: Partial<PatientFormData>) => {
      setFormData((prev) => ({ ...prev, ...fields }));

      // Clear errors for updated fields
      const fieldKeys = Object.keys(fields);
      if (fieldKeys.some((key) => errors[key])) {
        setErrors((prev) => {
          const newErrors = { ...prev };
          fieldKeys.forEach((key) => {
            delete newErrors[key];
          });
          return newErrors;
        });
      }
    },
    [errors],
  );

  // Validate single field
  const validateField = useCallback(
    async (field: string): Promise<void> => {
      try {
        const validationResult = validatePatientForm(formData);
        setErrors((prev) => ({
          ...prev,
          ...validationResult.errors,
        }));
      } catch (error) {
        console.error('Field validation error:', error);
      }
    },
    [formData],
  );

  // Validate entire form
  const validateForm = useCallback(async (): Promise<boolean> => {
    try {
      const validationResult = validatePatientForm(formData);
      setErrors(validationResult.errors);
      return validationResult.isValid;
    } catch (error) {
      console.error('Form validation error:', error);
      return false;
    }
  }, [formData]);

  // Set field touched state
  const setFieldTouched = useCallback(
    (field: string, isTouched: boolean = true) => {
      setTouched((prev) => ({
        ...prev,
        [field]: isTouched,
      }));

      // Validate on blur if enabled and field is touched
      if (validationMode === 'onBlur' && isTouched) {
        validateField(field);
      }
    },
    [validationMode, validateField],
  );

  // Set field error
  const setFieldError = useCallback((field: string, error: string | null) => {
    setErrors((prev) => {
      if (error === null) {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      }
      return {
        ...prev,
        [field]: error,
      };
    });
  }, []);

  // Clear all errors
  const clearErrors = useCallback(() => {
    setErrors({});
  }, []);

  // Reset form
  const resetForm = useCallback((data?: Partial<PatientFormData>) => {
    const newData = {
      ...DEFAULT_FORM_DATA,
      ...data,
    };
    setFormData(newData);
    setOriginalFormData(newData);
    setErrors({});
    setTouched({});
    setSubmitError(null);
  }, []);

  // Load patient data for editing
  const loadPatient = useCallback(async (uuid: string): Promise<void> => {
    setIsLoading(true);
    try {
      const patient = await RegistrationService.getPatientByUuid(uuid);
      const mappedData = mapOpenMRSToForm(patient);
      setFormData(mappedData);
      setOriginalFormData(mappedData);
      setErrors({});
      setTouched({});
      setSubmitError(null);
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Failed to load patient';
      setSubmitError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Submit form
  const submitForm = useCallback(async (): Promise<OpenMRSPatient | null> => {
    if (!canSubmit) return null;

    setIsSubmitting(true);
    setSubmitError(null);

    try {
      // Validate form before submission
      const isFormValid = await validateForm();
      if (!isFormValid) {
        setSubmitError('Please fix all validation errors before submitting');
        return null;
      }

      let patient: OpenMRSPatient;

      if (mode === 'create') {
        const createRequest: CreatePatientRequest =
          mapFormToCreateRequest(formData);
        patient = await RegistrationService.createPatient(createRequest);
      } else if (mode === 'edit' && patientUuid) {
        const existingPatient =
          await RegistrationService.getPatientByUuid(patientUuid);
        const updateRequest: UpdatePatientRequest = mapFormToUpdateRequest(
          formData,
          existingPatient,
        );
        patient = await RegistrationService.updatePatient(
          patientUuid,
          updateRequest,
        );
      } else {
        throw new Error('Invalid form mode or missing patient UUID');
      }

      // Update original data to reflect successful submission
      setOriginalFormData(formData);

      // Clear draft if enabled
      if (enableDraftSave) {
        localStorage.removeItem(
          `patient-form-draft-${mode}-${patientUuid || 'new'}`,
        );
      }

      return patient;
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Failed to save patient';
      setSubmitError(errorMessage);
      return null;
    } finally {
      setIsSubmitting(false);
    }
  }, [canSubmit, formData, mode, patientUuid, validateForm, enableDraftSave]);

  // Helper functions
  const getFieldError = useCallback(
    (field: string): string | null => {
      return errors[field] || null;
    },
    [errors],
  );

  const isFieldTouched = useCallback(
    (field: string): boolean => {
      return touched[field] || false;
    },
    [touched],
  );

  const isFieldValid = useCallback(
    (field: string): boolean => {
      return !errors[field];
    },
    [errors],
  );

  // Auto-save effect
  useEffect(() => {
    if (!autoSave || !enableDraftSave || !isDirty) return;

    const timer = setTimeout(() => {
      const draftKey = `patient-form-draft-${mode}-${patientUuid || 'new'}`;
      localStorage.setItem(draftKey, JSON.stringify(formData));
    }, autoSaveInterval);

    return () => clearTimeout(timer);
  }, [
    autoSave,
    enableDraftSave,
    isDirty,
    formData,
    mode,
    patientUuid,
    autoSaveInterval,
  ]);

  // Load draft on mount
  useEffect(() => {
    if (!enableDraftSave || mode === 'edit') return;

    const draftKey = `patient-form-draft-${mode}-${patientUuid || 'new'}`;
    const savedDraft = localStorage.getItem(draftKey);

    if (savedDraft) {
      try {
        const draftData = JSON.parse(savedDraft);
        setFormData((prev) => ({ ...prev, ...draftData }));
      } catch (error) {
        console.error('Failed to load form draft:', error);
        localStorage.removeItem(draftKey);
      }
    }
  }, [enableDraftSave, mode, patientUuid]);

  // Load patient data if in edit mode
  useEffect(() => {
    if (mode === 'edit' && patientUuid && !isLoading) {
      loadPatient(patientUuid);
    }
  }, [mode, patientUuid, loadPatient, isLoading]);

  return {
    // State
    formData,
    errors,
    touched,
    isValid,
    isDirty,
    isLoading,
    isSubmitting,
    submitError,
    validationMode,
    completeness,

    // Actions
    updateField,
    updateFields,
    validateField,
    validateForm,
    setFieldTouched,
    setFieldError,
    clearErrors,
    resetForm,
    submitForm,
    loadPatient,
    setValidationMode,

    // Computed values
    canSubmit,
    hasChanges,
    getFieldError,
    isFieldTouched,
    isFieldValid,
  };
};

/**
 * Hook for patient form field management
 * Simplified version for individual field usage
 */
export const usePatientFormField = (
  fieldName: string,
  formHook: UsePatientFormReturn,
) => {
  const value = useMemo(() => {
    if (fieldName.includes('.')) {
      return fieldName
        .split('.')
        .reduce((obj, key) => obj?.[key], formHook.formData as any);
    }
    return formHook.formData[fieldName as keyof PatientFormData];
  }, [fieldName, formHook.formData]);

  const error = useMemo(
    () => formHook.getFieldError(fieldName),
    [fieldName, formHook],
  );
  const touched = useMemo(
    () => formHook.isFieldTouched(fieldName),
    [fieldName, formHook],
  );
  const valid = useMemo(
    () => formHook.isFieldValid(fieldName),
    [fieldName, formHook],
  );

  const setValue = useCallback(
    (newValue: any) => {
      formHook.updateField(fieldName, newValue);
    },
    [fieldName, formHook],
  );

  const setTouched = useCallback(
    (isTouched: boolean = true) => {
      formHook.setFieldTouched(fieldName, isTouched);
    },
    [fieldName, formHook],
  );

  const validate = useCallback(() => {
    return formHook.validateField(fieldName);
  }, [fieldName, formHook]);

  return {
    value,
    error,
    touched,
    valid,
    setValue,
    setTouched,
    validate,
  };
};

export default usePatientForm;
