import { renderHook, act, waitFor } from '@testing-library/react';
import { usePatientForm, usePatientFormField } from '../usePatientForm';
import { RegistrationService } from '../../services/registration/registrationService';
import { validatePatientForm } from '../../utils/registration/patientValidation';
import {
  mapFormToCreateRequest,
  mapFormToUpdateRequest,
  mapOpenMRSToForm,
} from '../../utils/registration/patientMapper';
import { PatientFormData, OpenMRSPatient } from '../../types/registration';

// Mock the dependencies
jest.mock('../../services/registration/registrationService');
jest.mock('../../utils/registration/patientValidation');
jest.mock('../../utils/registration/patientMapper');

const mockRegistrationService = RegistrationService as jest.Mocked<typeof RegistrationService>;
const mockValidatePatientForm = validatePatientForm as jest.MockedFunction<typeof validatePatientForm>;
const mockMapFormToCreateRequest = mapFormToCreateRequest as jest.MockedFunction<typeof mapFormToCreateRequest>;
const mockMapFormToUpdateRequest = mapFormToUpdateRequest as jest.MockedFunction<typeof mapFormToUpdateRequest>;
const mockMapOpenMRSToForm = mapOpenMRSToForm as jest.MockedFunction<typeof mapOpenMRSToForm>;

const mockPatient: OpenMRSPatient = {
  uuid: 'patient-uuid',
  display: 'John Doe',
  voided: false,
  auditInfo: {
    creator: { uuid: 'creator-uuid', display: 'test-user' },
    dateCreated: '2023-01-01T00:00:00.000Z',
    changedBy: { uuid: 'creator-uuid', display: 'test-user' },
    dateChanged: '2023-01-01T00:00:00.000Z',
  },
  identifiers: [
    {
      uuid: 'id-uuid',
      identifier: 'P001',
      identifierType: {
        uuid: 'type-uuid',
        name: 'Patient ID',
        display: 'Patient ID',
      },
      preferred: true,
      voided: false,
    },
  ],
  person: {
    uuid: 'person-uuid',
    display: 'John Doe',
    gender: 'M',
    age: 30,
    birthdate: '1993-01-01',
    birthdateEstimated: false,
    dead: false,
    voided: false,
    auditInfo: {
      creator: { uuid: 'creator-uuid', display: 'test-user' },
      dateCreated: '2023-01-01T00:00:00.000Z',
      changedBy: { uuid: 'creator-uuid', display: 'test-user' },
      dateChanged: '2023-01-01T00:00:00.000Z',
    },
    names: [
      {
        uuid: 'name-uuid',
        display: 'John Doe',
        givenName: 'John',
        familyName: 'Doe',
        preferred: true,
        voided: false,
      },
    ],
    addresses: [
      {
        uuid: 'address-uuid',
        display: '123 Main St',
        address1: '123 Main St',
        cityVillage: 'City',
        country: 'Country',
        preferred: true,
        voided: false,
      },
    ],
    attributes: [],
  },
};

const mockFormData: PatientFormData = {
  givenName: 'John',
  middleName: '',
  familyName: 'Doe',
  gender: 'M',
  birthdate: '1993-01-01',
  age: 30,
  birthdateEstimated: false,
  identifiers: [
    {
      identifier: 'P001',
      identifierType: 'type-uuid',
      location: '',
      preferred: true,
    },
  ],
  address: {
    address1: '123 Main St',
    address2: '',
    cityVillage: 'City',
    stateProvince: '',
    country: 'Country',
    postalCode: '',
    countyDistrict: '',
    preferred: true,
  },
  attributes: [],
  photo: undefined,
};

describe('usePatientForm', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    // Default mock implementations
    mockValidatePatientForm.mockReturnValue({
      isValid: true,
      errors: {},
      warnings: {},
      missingRequired: [],
      completeness: 100,
    });

    mockMapFormToCreateRequest.mockReturnValue({
      person: {
        names: [{ givenName: 'John', familyName: 'Doe', preferred: true }],
        gender: 'M',
        birthdate: '1993-01-01',
        birthdateEstimated: false,
        addresses: [],
        attributes: [],
      },
      identifiers: [],
    });

    mockMapOpenMRSToForm.mockReturnValue(mockFormData);
  });

  describe('Initial State', () => {
    it('should return initial state correctly', () => {
      const { result } = renderHook(() => usePatientForm());

      expect(result.current.formData.givenName).toBe('');
      expect(result.current.formData.familyName).toBe('');
      expect(result.current.formData.gender).toBe('M');
      expect(result.current.errors).toEqual({});
      expect(result.current.touched).toEqual({});
      expect(result.current.isValid).toBe(true);
      expect(result.current.isDirty).toBe(false);
      expect(result.current.isLoading).toBe(false);
      expect(result.current.isSubmitting).toBe(false);
      expect(result.current.submitError).toBeNull();
      expect(result.current.canSubmit).toBe(false); // Not dirty initially
      expect(result.current.hasChanges).toBe(false);
    });

    it('should initialize with custom initial data', () => {
      const initialData = {
        givenName: 'Jane',
        familyName: 'Smith',
        gender: 'F' as const,
      };

      const { result } = renderHook(() => usePatientForm({ initialData }));

      expect(result.current.formData.givenName).toBe('Jane');
      expect(result.current.formData.familyName).toBe('Smith');
      expect(result.current.formData.gender).toBe('F');
    });
  });

  describe('Field Updates', () => {
    it('should update single field', () => {
      const { result } = renderHook(() => usePatientForm());

      act(() => {
        result.current.updateField('givenName', 'John');
      });

      expect(result.current.formData.givenName).toBe('John');
      expect(result.current.isDirty).toBe(true);
    });

    it('should update nested field', () => {
      const { result } = renderHook(() => usePatientForm());

      act(() => {
        result.current.updateField('address.address1', '123 Main St');
      });

      expect(result.current.formData.address?.address1).toBe('123 Main St');
      expect(result.current.isDirty).toBe(true);
    });

    it('should update multiple fields', () => {
      const { result } = renderHook(() => usePatientForm());

      act(() => {
        result.current.updateFields({
          givenName: 'John',
          familyName: 'Doe',
        });
      });

      expect(result.current.formData.givenName).toBe('John');
      expect(result.current.formData.familyName).toBe('Doe');
      expect(result.current.isDirty).toBe(true);
    });

    it('should clear field error when field is updated', () => {
      const { result } = renderHook(() => usePatientForm());

      // Set an error first
      act(() => {
        result.current.setFieldError('givenName', 'Required field');
      });

      expect(result.current.errors.givenName).toBe('Required field');

      // Update the field
      act(() => {
        result.current.updateField('givenName', 'John');
      });

      expect(result.current.errors.givenName).toBeUndefined();
    });
  });

  describe('Validation', () => {
    it('should validate form and update errors', async () => {
      mockValidatePatientForm.mockReturnValue({
        isValid: false,
        errors: { givenName: 'Required field' },
        warnings: {},
        missingRequired: ['givenName'],
        completeness: 50,
      });

      const { result } = renderHook(() => usePatientForm());

      let isValid: boolean = false;
      await act(async () => {
        isValid = await result.current.validateForm();
      });

      expect(isValid).toBe(false);
      expect(result.current.errors.givenName).toBe('Required field');
      expect(result.current.isValid).toBe(false);
    });

    it('should validate single field', async () => {
      mockValidatePatientForm.mockReturnValue({
        isValid: false,
        errors: { givenName: 'Required field' },
        warnings: {},
        missingRequired: ['givenName'],
        completeness: 50,
      });

      const { result } = renderHook(() => usePatientForm());

      await act(async () => {
        await result.current.validateField('givenName');
      });

      expect(result.current.errors.givenName).toBe('Required field');
    });

    it('should clear all errors', () => {
      const { result } = renderHook(() => usePatientForm());

      // Set some errors first
      act(() => {
        result.current.setFieldError('givenName', 'Error 1');
        result.current.setFieldError('familyName', 'Error 2');
      });

      expect(Object.keys(result.current.errors)).toHaveLength(2);

      // Clear all errors
      act(() => {
        result.current.clearErrors();
      });

      expect(result.current.errors).toEqual({});
    });
  });

  describe('Touched State', () => {
    it('should set field touched state', () => {
      const { result } = renderHook(() => usePatientForm());

      act(() => {
        result.current.setFieldTouched('givenName', true);
      });

      expect(result.current.touched.givenName).toBe(true);
      expect(result.current.isFieldTouched('givenName')).toBe(true);
    });

    it('should validate on blur when validation mode is onBlur', async () => {
      mockValidatePatientForm.mockReturnValue({
        isValid: false,
        errors: { givenName: 'Required field' },
        warnings: {},
        missingRequired: ['givenName'],
        completeness: 50,
      });

      const { result } = renderHook(() =>
        usePatientForm({ validationMode: 'onBlur' })
      );

      await act(async () => {
        result.current.setFieldTouched('givenName', true);
      });

      expect(result.current.errors.givenName).toBe('Required field');
    });
  });

  describe('Form Reset', () => {
    it('should reset form to default state', () => {
      const { result } = renderHook(() => usePatientForm());

      // Make some changes
      act(() => {
        result.current.updateField('givenName', 'John');
        result.current.setFieldError('familyName', 'Some error');
        result.current.setFieldTouched('givenName', true);
      });

      expect(result.current.isDirty).toBe(true);
      expect(result.current.errors.familyName).toBe('Some error');
      expect(result.current.touched.givenName).toBe(true);

      // Reset form
      act(() => {
        result.current.resetForm();
      });

      expect(result.current.formData.givenName).toBe('');
      expect(result.current.errors).toEqual({});
      expect(result.current.touched).toEqual({});
      expect(result.current.isDirty).toBe(false);
    });

    it('should reset form with custom data', () => {
      const { result } = renderHook(() => usePatientForm());

      const resetData = {
        givenName: 'Jane',
        familyName: 'Smith',
      };

      act(() => {
        result.current.resetForm(resetData);
      });

      expect(result.current.formData.givenName).toBe('Jane');
      expect(result.current.formData.familyName).toBe('Smith');
      expect(result.current.isDirty).toBe(false);
    });
  });

  describe('Patient Loading (Edit Mode)', () => {
    it('should load patient data in edit mode', async () => {
      mockRegistrationService.getPatientByUuid.mockResolvedValue(mockPatient);

      const { result } = renderHook(() =>
        usePatientForm({ mode: 'edit', patientUuid: 'patient-uuid' })
      );

      await waitFor(() => {
        expect(mockRegistrationService.getPatientByUuid).toHaveBeenCalledWith('patient-uuid');
        expect(mockMapOpenMRSToForm).toHaveBeenCalledWith(mockPatient);
      });

      expect(result.current.isLoading).toBe(false);
    });

    it('should handle patient loading error', async () => {
      const error = new Error('Failed to load patient');
      mockRegistrationService.getPatientByUuid.mockRejectedValue(error);

      const { result } = renderHook(() =>
        usePatientForm({ mode: 'edit', patientUuid: 'patient-uuid' })
      );

      await waitFor(() => {
        expect(result.current.submitError).toBe('Failed to load patient');
        expect(result.current.isLoading).toBe(false);
      });
    });

    it('should load patient manually', async () => {
      mockRegistrationService.getPatientByUuid.mockResolvedValue(mockPatient);

      const { result } = renderHook(() => usePatientForm());

      await act(async () => {
        await result.current.loadPatient('patient-uuid');
      });

      expect(mockRegistrationService.getPatientByUuid).toHaveBeenCalledWith('patient-uuid');
      expect(mockMapOpenMRSToForm).toHaveBeenCalledWith(mockPatient);
    });
  });

  describe('Form Submission', () => {
    it('should create new patient successfully', async () => {
      mockRegistrationService.createPatient.mockResolvedValue(mockPatient);

      const { result } = renderHook(() => usePatientForm({ mode: 'create' }));

      // Make form dirty and valid
      act(() => {
        result.current.updateField('givenName', 'John');
      });

      let submittedPatient: OpenMRSPatient | null = null;
      await act(async () => {
        submittedPatient = await result.current.submitForm();
      });

      expect(mockMapFormToCreateRequest).toHaveBeenCalledWith(expect.objectContaining({
        givenName: 'John',
      }));
      expect(mockRegistrationService.createPatient).toHaveBeenCalled();
      expect(submittedPatient).toEqual(mockPatient);
      expect(result.current.isSubmitting).toBe(false);
    });

    it('should update existing patient successfully', async () => {
      mockRegistrationService.getPatientByUuid.mockResolvedValue(mockPatient);
      mockRegistrationService.updatePatient.mockResolvedValue(mockPatient);

      const { result } = renderHook(() =>
        usePatientForm({ mode: 'edit', patientUuid: 'patient-uuid' })
      );

      // Wait for patient to load then make changes
      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      act(() => {
        result.current.updateField('givenName', 'Jane');
      });

      let submittedPatient: OpenMRSPatient | null = null;
      await act(async () => {
        submittedPatient = await result.current.submitForm();
      });

      expect(mockRegistrationService.getPatientByUuid).toHaveBeenCalledWith('patient-uuid');
      expect(mockMapFormToUpdateRequest).toHaveBeenCalled();
      expect(mockRegistrationService.updatePatient).toHaveBeenCalledWith('patient-uuid', expect.any(Object));
      expect(submittedPatient).toEqual(mockPatient);
    });

    it('should not submit if form is invalid', async () => {
      mockValidatePatientForm.mockReturnValue({
        isValid: false,
        errors: { givenName: 'Required field' },
        warnings: {},
        missingRequired: ['givenName'],
        completeness: 50,
      });

      const { result } = renderHook(() => usePatientForm({ mode: 'create' }));

      // Make form dirty
      act(() => {
        result.current.updateField('familyName', 'Doe');
      });

      let submittedPatient: OpenMRSPatient | null = null;
      await act(async () => {
        submittedPatient = await result.current.submitForm();
      });

      expect(submittedPatient).toBeNull();
      expect(result.current.submitError).toBe('Please fix all validation errors before submitting');
      expect(mockRegistrationService.createPatient).not.toHaveBeenCalled();
    });

    it('should not submit if form is not dirty', async () => {
      const { result } = renderHook(() => usePatientForm({ mode: 'create' }));

      // Don't make any changes (form is not dirty)
      let submittedPatient: OpenMRSPatient | null = null;
      await act(async () => {
        submittedPatient = await result.current.submitForm();
      });

      expect(submittedPatient).toBeNull();
      expect(mockRegistrationService.createPatient).not.toHaveBeenCalled();
    });

    it('should handle submission error', async () => {
      const error = new Error('Submission failed');
      mockRegistrationService.createPatient.mockRejectedValue(error);

      const { result } = renderHook(() => usePatientForm({ mode: 'create' }));

      // Make form dirty and valid
      act(() => {
        result.current.updateField('givenName', 'John');
      });

      let submittedPatient: OpenMRSPatient | null = null;
      await act(async () => {
        submittedPatient = await result.current.submitForm();
      });

      expect(submittedPatient).toBeNull();
      expect(result.current.submitError).toBe('Submission failed');
      expect(result.current.isSubmitting).toBe(false);
    });
  });

  describe('Completeness Calculation', () => {
    it('should calculate form completeness correctly', () => {
      const { result } = renderHook(() => usePatientForm());

      // Initially should be low completeness
      expect(result.current.completeness.percentage).toBeLessThan(100);

      // Add some required fields
      act(() => {
        result.current.updateFields({
          givenName: 'John',
          familyName: 'Doe',
          gender: 'M',
          birthdate: '1993-01-01',
          identifiers: [{ identifier: 'P001', identifierType: 'type-1', location: '', preferred: true }],
        });
      });

      // Should have higher completeness
      expect(result.current.completeness.percentage).toBeGreaterThan(50);
      expect(result.current.completeness.completedFields).toBeGreaterThan(0);
    });
  });

  describe('Validation Mode', () => {
    it('should validate on change when validation mode is onChange', async () => {
      mockValidatePatientForm.mockReturnValue({
        isValid: false,
        errors: { givenName: 'Required field' },
        warnings: {},
        missingRequired: ['givenName'],
        completeness: 50,
      });

      const { result } = renderHook(() =>
        usePatientForm({ validationMode: 'onChange' })
      );

      await act(async () => {
        result.current.updateField('givenName', '');
      });

      expect(result.current.errors.givenName).toBe('Required field');
    });

    it('should change validation mode', () => {
      const { result } = renderHook(() => usePatientForm());

      expect(result.current.validationMode).toBe('onBlur');

      act(() => {
        result.current.setValidationMode('onChange');
      });

      expect(result.current.validationMode).toBe('onChange');
    });
  });

  describe('Helper Functions', () => {
    it('should get field error correctly', () => {
      const { result } = renderHook(() => usePatientForm());

      act(() => {
        result.current.setFieldError('givenName', 'Test error');
      });

      expect(result.current.getFieldError('givenName')).toBe('Test error');
      expect(result.current.getFieldError('familyName')).toBeNull();
    });

    it('should check field validity correctly', () => {
      const { result } = renderHook(() => usePatientForm());

      expect(result.current.isFieldValid('givenName')).toBe(true);

      act(() => {
        result.current.setFieldError('givenName', 'Test error');
      });

      expect(result.current.isFieldValid('givenName')).toBe(false);
    });
  });
});

describe('usePatientFormField', () => {
  it('should provide field-specific interface', () => {
    const mockFormHook = {
      formData: { givenName: 'John' },
      getFieldError: jest.fn().mockReturnValue(null),
      isFieldTouched: jest.fn().mockReturnValue(false),
      isFieldValid: jest.fn().mockReturnValue(true),
      updateField: jest.fn(),
      setFieldTouched: jest.fn(),
      validateField: jest.fn(),
    } as any;

    const { result } = renderHook(() =>
      usePatientFormField('givenName', mockFormHook)
    );

    expect(result.current.value).toBe('John');
    expect(result.current.error).toBeNull();
    expect(result.current.touched).toBe(false);
    expect(result.current.valid).toBe(true);

    // Test setValue
    act(() => {
      result.current.setValue('Jane');
    });

    expect(mockFormHook.updateField).toHaveBeenCalledWith('givenName', 'Jane');

    // Test setTouched
    act(() => {
      result.current.setTouched(true);
    });

    expect(mockFormHook.setFieldTouched).toHaveBeenCalledWith('givenName', true);

    // Test validate
    act(() => {
      result.current.validate();
    });

    expect(mockFormHook.validateField).toHaveBeenCalledWith('givenName');
  });

  it('should handle nested field paths', () => {
    const mockFormHook = {
      formData: {
        address: {
          address1: '123 Main St'
        }
      },
      getFieldError: jest.fn().mockReturnValue(null),
      isFieldTouched: jest.fn().mockReturnValue(false),
      isFieldValid: jest.fn().mockReturnValue(true),
      updateField: jest.fn(),
      setFieldTouched: jest.fn(),
      validateField: jest.fn(),
    } as any;

    const { result } = renderHook(() =>
      usePatientFormField('address.address1', mockFormHook)
    );

    expect(result.current.value).toBe('123 Main St');
  });
});
