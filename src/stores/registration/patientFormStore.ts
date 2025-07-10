/**
 * Patient Form Store
 * Form-specific state management for patient creation/editing
 */

import { create } from 'zustand';
import {
  PatientFormData,
  FormValidationState,
} from '../../types/registration';
import {
  REGISTRATION_VALIDATION_MESSAGES,
  REGISTRATION_CONFIG,
} from '../../constants/registration';

export interface PatientFormState extends FormValidationState {
  // Form Data
  formData: PatientFormData;
  originalData: PatientFormData | null;

  // Wizard State
  currentStep: number;
  completedSteps: number[];
  canProceedToStep: (step: number) => boolean;

  // Form State
  isSubmitting: boolean;
  hasUnsavedChanges: boolean;
  autoSaveEnabled: boolean;
  lastAutoSave: Date | null;

  // Validation State
  fieldErrors: Record<string, string>;
  globalErrors: string[];
  warnings: string[];

  // Actions - Form Data
  updateFormData: (updates: Partial<PatientFormData>) => void;
  setFormData: (data: PatientFormData) => void;
  resetForm: () => void;
  setOriginalData: (data: PatientFormData) => void;

  // Actions - Wizard Navigation
  setCurrentStep: (step: number) => void;
  nextStep: () => void;
  previousStep: () => void;
  markStepCompleted: (step: number) => void;
  resetWizard: () => void;

  // Actions - Form State
  setSubmitting: (submitting: boolean) => void;
  setAutoSaveEnabled: (enabled: boolean) => void;
  markAutoSaved: () => void;

  // Actions - Validation
  validateField: (fieldName: string, value: any) => string | null;
  validateStep: (step: number) => boolean;
  validateForm: () => boolean;
  setFieldError: (field: string, error: string | null) => void;
  clearFieldError: (field: string) => void;
  addGlobalError: (error: string) => void;
  clearGlobalErrors: () => void;
  addWarning: (warning: string) => void;
  clearWarnings: () => void;
  clearAllErrors: () => void;

  // Actions - Identifiers
  addIdentifier: () => void;
  removeIdentifier: (index: number) => void;
  updateIdentifier: (index: number, updates: Partial<PatientFormData['identifiers'][0]>) => void;

  // Actions - Attributes
  addAttribute: () => void;
  removeAttribute: (index: number) => void;
  updateAttribute: (index: number, updates: Partial<PatientFormData['attributes'][0]>) => void;

  // Getters
  getState: () => PatientFormState;
  getFormCompleteness: () => number;
  getRequiredFields: () => string[];
  getMissingRequiredFields: () => string[];
  hasValidationErrors: () => boolean;
  canSubmitForm: () => boolean;
}

// Initial form data structure
const createInitialFormData = (): PatientFormData => ({
  // Personal Information
  givenName: '',
  middleName: '',
  familyName: '',
  gender: 'M',
  birthdate: '',
  age: 0,
  birthdateEstimated: false,

  // Identifiers (start with one empty identifier)
  identifiers: [{
    identifier: '',
    identifierType: '',
    location: '',
    preferred: true,
  }],

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

  // Person Attributes (empty initially)
  attributes: [],

  // Photo
  photo: undefined,
});

const initialState = {
  // Form Data
  formData: createInitialFormData(),
  originalData: null,

  // Wizard State
  currentStep: 1,
  completedSteps: [],

  // Form State
  isSubmitting: false,
  hasUnsavedChanges: false,
  autoSaveEnabled: true,
  lastAutoSave: null,

  // Validation State
  errors: {},
  touched: {},
  isValid: false,
  isDirty: false,
  fieldErrors: {},
  globalErrors: [],
  warnings: [],
};

export const usePatientFormStore = create<PatientFormState>((set, get) => ({
  ...initialState,

  // Form Data Actions
  updateFormData: (updates: Partial<PatientFormData>) => {
    set((state) => {
      const newFormData = { ...state.formData, ...updates };
      const hasChanges = JSON.stringify(newFormData) !== JSON.stringify(state.originalData);

      return {
        formData: newFormData,
        hasUnsavedChanges: hasChanges,
        isDirty: true,
      };
    });
  },

  setFormData: (data: PatientFormData) => {
    set({
      formData: data,
      hasUnsavedChanges: false,
      isDirty: false,
    });
  },

  resetForm: () => {
    set({
      formData: createInitialFormData(),
      originalData: null,
      hasUnsavedChanges: false,
      isDirty: false,
      currentStep: 1,
      completedSteps: [],
      fieldErrors: {},
      globalErrors: [],
      warnings: [],
      errors: {},
      touched: {},
      isValid: false,
    });
  },

  setOriginalData: (data: PatientFormData) => {
    set({ originalData: data });
  },

  // Wizard Navigation Actions
  setCurrentStep: (step: number) => {
    set({ currentStep: step });
  },

  nextStep: () => {
    set((state) => {
      const nextStep = Math.min(state.currentStep + 1, REGISTRATION_CONFIG.FORM_WIZARD_STEPS);
      return { currentStep: nextStep };
    });
  },

  previousStep: () => {
    set((state) => ({
      currentStep: Math.max(state.currentStep - 1, 1),
    }));
  },

  markStepCompleted: (step: number) => {
    set((state) => ({
      completedSteps: Array.from(new Set([...state.completedSteps, step])),
    }));
  },

  resetWizard: () => {
    set({
      currentStep: 1,
      completedSteps: [],
    });
  },

  canProceedToStep: (step: number) => {
    const state = get();
    // Can always go to current or previous steps
    if (step <= state.currentStep) return true;
    // Can only proceed if current step is valid
    return state.validateStep(state.currentStep);
  },

  // Form State Actions
  setSubmitting: (submitting: boolean) => {
    set({ isSubmitting: submitting });
  },

  setAutoSaveEnabled: (enabled: boolean) => {
    set({ autoSaveEnabled: enabled });
  },

  markAutoSaved: () => {
    set({ lastAutoSave: new Date() });
  },

  // Validation Actions
  validateField: (fieldName: string, value: any): string | null => {
    const state = get();

    // Required field validation
    const requiredFields = state.getRequiredFields();
    if (requiredFields.includes(fieldName) && (!value || value.toString().trim() === '')) {
      return REGISTRATION_VALIDATION_MESSAGES.REQUIRED_FIELD;
    }

    // Field-specific validation
    switch (fieldName) {
      case 'givenName':
      case 'familyName':
        if (value && (value.length < REGISTRATION_CONFIG.MIN_NAME_LENGTH ||
                     value.length > REGISTRATION_CONFIG.MAX_NAME_LENGTH)) {
          return REGISTRATION_VALIDATION_MESSAGES.INVALID_NAME;
        }
        if (value && !/^[a-zA-Z\s\-']+$/.test(value)) {
          return REGISTRATION_VALIDATION_MESSAGES.INVALID_NAME;
        }
        break;

      case 'age':
        const ageNum = parseInt(value);
        if (value && (isNaN(ageNum) || ageNum < REGISTRATION_CONFIG.MIN_AGE ||
                     ageNum > REGISTRATION_CONFIG.MAX_AGE)) {
          return REGISTRATION_VALIDATION_MESSAGES.INVALID_AGE;
        }
        break;

      case 'birthdate':
        if (value) {
          const birthDate = new Date(value);
          const now = new Date();
          if (birthDate > now) {
            return REGISTRATION_VALIDATION_MESSAGES.INVALID_BIRTHDATE;
          }
          if (birthDate.getFullYear() < REGISTRATION_CONFIG.MIN_BIRTH_YEAR) {
            return REGISTRATION_VALIDATION_MESSAGES.INVALID_BIRTHDATE;
          }
        }
        break;

      case 'identifiers':
        if (Array.isArray(value) && value.length < REGISTRATION_CONFIG.REQUIRED_IDENTIFIERS_MIN) {
          return REGISTRATION_VALIDATION_MESSAGES.MISSING_REQUIRED_IDENTIFIER;
        }
        break;
    }

    return null;
  },

  validateStep: (step: number): boolean => {
    const state = get();
    const { formData } = state;
    let isValid = true;
    const errors: Record<string, string> = {};

    switch (step) {
      case 1: // Demographics
        const givenNameError = state.validateField('givenName', formData.givenName);
        if (givenNameError) {
          errors.givenName = givenNameError;
          isValid = false;
        }

        const familyNameError = state.validateField('familyName', formData.familyName);
        if (familyNameError) {
          errors.familyName = familyNameError;
          isValid = false;
        }

        // Either birthdate or age is required
        if (!formData.birthdate && !formData.age) {
          errors.birthdate = REGISTRATION_VALIDATION_MESSAGES.REQUIRED_FIELD;
          isValid = false;
        }
        break;

      case 2: // Identifiers
        if (formData.identifiers.length < REGISTRATION_CONFIG.REQUIRED_IDENTIFIERS_MIN) {
          errors.identifiers = REGISTRATION_VALIDATION_MESSAGES.MISSING_REQUIRED_IDENTIFIER;
          isValid = false;
        }

        formData.identifiers.forEach((identifier, index) => {
          if (!identifier.identifier.trim()) {
            errors[`identifier_${index}`] = REGISTRATION_VALIDATION_MESSAGES.REQUIRED_FIELD;
            isValid = false;
          }
          if (!identifier.identifierType) {
            errors[`identifierType_${index}`] = REGISTRATION_VALIDATION_MESSAGES.REQUIRED_FIELD;
            isValid = false;
          }
        });
        break;

      case 3: // Address - optional but validate if provided
        // Address validation is optional
        break;

      case 4: // Attributes - validate required attributes
        // Will be implemented when attribute types are loaded
        break;

      case 5: // Photo - optional
        // Photo validation is optional
        break;

      case 6: // Summary - final validation
        return state.validateForm();
    }

    // Update field errors
    set((currentState) => ({
      fieldErrors: { ...currentState.fieldErrors, ...errors },
    }));

    return isValid;
  },

  validateForm: (): boolean => {
    const state = get();
    let isValid = true;

    // Validate all steps
    for (let step = 1; step <= REGISTRATION_CONFIG.FORM_WIZARD_STEPS - 1; step++) {
      if (!state.validateStep(step)) {
        isValid = false;
      }
    }

    set({ isValid });
    return isValid;
  },

  setFieldError: (field: string, error: string | null) => {
    set((state) => {
      const newErrors = { ...state.fieldErrors };
      if (error) {
        newErrors[field] = error;
      } else {
        delete newErrors[field];
      }
      return { fieldErrors: newErrors };
    });
  },

  clearFieldError: (field: string) => {
    set((state) => {
      const newErrors = { ...state.fieldErrors };
      delete newErrors[field];
      return { fieldErrors: newErrors };
    });
  },

  addGlobalError: (error: string) => {
    set((state) => ({
      globalErrors: [...state.globalErrors, error],
    }));
  },

  clearGlobalErrors: () => {
    set({ globalErrors: [] });
  },

  addWarning: (warning: string) => {
    set((state) => ({
      warnings: [...state.warnings, warning],
    }));
  },

  clearWarnings: () => {
    set({ warnings: [] });
  },

  clearAllErrors: () => {
    set({
      fieldErrors: {},
      globalErrors: [],
      warnings: [],
      errors: {},
    });
  },

  // Identifier Actions
  addIdentifier: () => {
    set((state) => ({
      formData: {
        ...state.formData,
        identifiers: [
          ...state.formData.identifiers,
          {
            identifier: '',
            identifierType: '',
            location: '',
            preferred: false,
          },
        ],
      },
      hasUnsavedChanges: true,
      isDirty: true,
    }));
  },

  removeIdentifier: (index: number) => {
    set((state) => ({
      formData: {
        ...state.formData,
        identifiers: state.formData.identifiers.filter((_, i) => i !== index),
      },
      hasUnsavedChanges: true,
      isDirty: true,
    }));
  },

  updateIdentifier: (index: number, updates: Partial<PatientFormData['identifiers'][0]>) => {
    set((state) => ({
      formData: {
        ...state.formData,
        identifiers: state.formData.identifiers.map((identifier, i) =>
          i === index ? { ...identifier, ...updates } : identifier
        ),
      },
      hasUnsavedChanges: true,
      isDirty: true,
    }));
  },

  // Attribute Actions
  addAttribute: () => {
    set((state) => ({
      formData: {
        ...state.formData,
        attributes: [
          ...state.formData.attributes,
          {
            attributeType: '',
            value: '',
          },
        ],
      },
      hasUnsavedChanges: true,
      isDirty: true,
    }));
  },

  removeAttribute: (index: number) => {
    set((state) => ({
      formData: {
        ...state.formData,
        attributes: state.formData.attributes.filter((_, i) => i !== index),
      },
      hasUnsavedChanges: true,
      isDirty: true,
    }));
  },

  updateAttribute: (index: number, updates: Partial<PatientFormData['attributes'][0]>) => {
    set((state) => ({
      formData: {
        ...state.formData,
        attributes: state.formData.attributes.map((attribute, i) =>
          i === index ? { ...attribute, ...updates } : attribute
        ),
      },
      hasUnsavedChanges: true,
      isDirty: true,
    }));
  },

  // Getters
  getState: () => get(),

  getFormCompleteness: (): number => {
    const state = get();
    const { formData } = state;
    const requiredFields = state.getRequiredFields();

    let filledFields = 0;
    requiredFields.forEach(field => {
      if (field === 'identifiers') {
        if (formData.identifiers.length > 0 && formData.identifiers[0].identifier.trim()) {
          filledFields++;
        }
      } else if (field.includes('.')) {
        // Handle nested fields like 'address.cityVillage'
        const [parent, child] = field.split('.');
        const parentValue = (formData as any)[parent];
        if (parentValue && parentValue[child] && parentValue[child].toString().trim()) {
          filledFields++;
        }
      } else {
        const value = (formData as any)[field];
        if (value && value.toString().trim()) {
          filledFields++;
        }
      }
    });

    return Math.round((filledFields / requiredFields.length) * 100);
  },

  getRequiredFields: (): string[] => {
    return [
      'givenName',
      'familyName',
      'gender',
      'identifiers',
    ];
  },

  getMissingRequiredFields: (): string[] => {
    const state = get();
    const requiredFields = state.getRequiredFields();
    const { formData } = state;

    return requiredFields.filter(field => {
      if (field === 'identifiers') {
        return formData.identifiers.length === 0 || !formData.identifiers[0].identifier.trim();
      }
      const value = (formData as any)[field];
      return !value || value.toString().trim() === '';
    });
  },

  hasValidationErrors: (): boolean => {
    const state = get();
    return Object.keys(state.fieldErrors).length > 0 || state.globalErrors.length > 0;
  },

  canSubmitForm: (): boolean => {
    const state = get();
    return state.isValid &&
           !state.hasValidationErrors() &&
           !state.isSubmitting &&
           state.getMissingRequiredFields().length === 0;
  },
}));

export default usePatientFormStore;
