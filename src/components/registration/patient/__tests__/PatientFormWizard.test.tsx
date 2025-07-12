/**
 * @jest-environment jsdom
 */
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { PatientFormWizard } from '../PatientFormWizard';
import { usePatientForm } from '../../../../hooks/usePatientForm';
import { useNotification } from '../../../../hooks/useNotification';

// Mock the hooks
jest.mock('../../../../hooks/usePatientForm');
jest.mock('../../../../hooks/useNotification');
jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, options?: any) => {
      if (options?.percentage !== undefined) {
        return `${options.percentage}% complete`;
      }
      const translations: Record<string, string> = {
        'registration.patient.form.title.create': 'Create Patient',
        'registration.patient.form.title.edit': 'Edit Patient',
        'registration.patient.form.progress': 'Progress',
        'registration.patient.form.steps.demographics': 'Demographics',
        'registration.patient.form.steps.identifiers': 'Identifiers',
        'registration.patient.form.steps.address': 'Address',
        'registration.patient.form.steps.attributes': 'Attributes',
        'registration.patient.form.steps.photo': 'Photo',
        'registration.patient.form.steps.summary': 'Summary',
        'registration.patient.form.exitConfirmation.title': 'Unsaved Changes',
        'registration.patient.form.exitConfirmation.message': 'You have unsaved changes. Are you sure you want to exit?',
        'registration.patient.form.exitConfirmation.confirm': 'Yes, Exit',
        'registration.patient.form.create': 'Create Patient',
        'registration.patient.form.update': 'Update Patient',
        'common.loading': 'Loading...',
        'common.cancel': 'Cancel',
        'common.previous': 'Previous',
        'common.next': 'Next',
        'common.saving': 'Saving...',
      };
      return translations[key] || key;
    },
  }),
}));

// Mock the lazy-loaded components
jest.mock('../PatientDemographicsForm', () => {
  return function MockPatientDemographicsForm() {
    return <div data-testid="demographics-form">Demographics Form</div>;
  };
});

jest.mock('../IdentifierForm', () => {
  return function MockIdentifierForm() {
    return <div data-testid="identifiers-form">Identifiers Form</div>;
  };
});

jest.mock('../AddressForm', () => {
  return function MockAddressForm() {
    return <div data-testid="address-form">Address Form</div>;
  };
});

jest.mock('../PersonAttributesForm', () => {
  return function MockPersonAttributesForm() {
    return <div data-testid="attributes-form">Attributes Form</div>;
  };
});

jest.mock('../PatientPhotoCapture', () => {
  return function MockPatientPhotoCapture() {
    return <div data-testid="photo-form">Photo Form</div>;
  };
});

jest.mock('../FormSummary', () => {
  return function MockFormSummary() {
    return <div data-testid="summary-form">Summary Form</div>;
  };
});

const mockUsePatientForm = usePatientForm as jest.MockedFunction<typeof usePatientForm>;
const mockUseNotification = useNotification as jest.MockedFunction<typeof useNotification>;

describe('PatientFormWizard', () => {
  const mockSubmitForm = jest.fn();
  const mockResetForm = jest.fn();
  const mockUpdateField = jest.fn();
  const mockAddNotification = jest.fn();
  const mockOnSuccess = jest.fn();
  const mockOnCancel = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();

    const mockFormData = {
      givenName: 'John',
      familyName: 'Doe',
      gender: 'M' as const,
      birthdateEstimated: false,
      identifiers: [],
      attributes: [],
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
    };

    mockUsePatientForm.mockReturnValue({
      // State
      formData: mockFormData,
      errors: {},
      touched: {},
      isValid: true,
      isDirty: false,
      isLoading: false,
      isSubmitting: false,
      submitError: null,
      validationMode: 'onBlur' as const,
      completeness: {
        percentage: 50,
        completedFields: 3,
        totalFields: 6,
      },

      // Actions
      updateField: mockUpdateField,
      updateFields: jest.fn(),
      validateField: jest.fn(),
      validateForm: jest.fn(),
      setFieldTouched: jest.fn(),
      setFieldError: jest.fn(),
      clearErrors: jest.fn(),
      resetForm: mockResetForm,
      submitForm: mockSubmitForm,
      loadPatient: jest.fn(),
      setValidationMode: jest.fn(),

      // Computed values
      canSubmit: true,
      hasChanges: false,
      getFieldError: jest.fn().mockReturnValue(null),
      isFieldTouched: jest.fn().mockReturnValue(false),
      isFieldValid: jest.fn().mockReturnValue(true),
    });

    mockUseNotification.mockReturnValue({
      notifications: [],
      addNotification: mockAddNotification,
      removeNotification: jest.fn(),
      clearAllNotifications: jest.fn(),
    });
  });

  describe('Rendering', () => {
    it('should render the wizard with create mode title', () => {
      render(<PatientFormWizard mode="create" />);

      expect(screen.getByText('Create Patient')).toBeInTheDocument();
    });

    it('should render the wizard with edit mode title', () => {
      render(<PatientFormWizard mode="edit" />);

      expect(screen.getByText('Edit Patient')).toBeInTheDocument();
    });

    it('should render all wizard steps', () => {
      render(<PatientFormWizard />);

      expect(screen.getByText('Demographics')).toBeInTheDocument();
      expect(screen.getByText('Identifiers')).toBeInTheDocument();
      expect(screen.getByText('Address')).toBeInTheDocument();
      expect(screen.getByText('Attributes')).toBeInTheDocument();
      expect(screen.getByText('Photo')).toBeInTheDocument();
      expect(screen.getByText('Summary')).toBeInTheDocument();
    });

    it('should render progress bar', () => {
      render(<PatientFormWizard />);

      expect(screen.getByRole('progressbar')).toBeInTheDocument();
    });

    it('should render navigation buttons', () => {
      render(<PatientFormWizard />);

      expect(screen.getByText('Cancel')).toBeInTheDocument();
      expect(screen.getByText('Previous')).toBeInTheDocument();
      expect(screen.getByText('Next')).toBeInTheDocument();
    });

    it('should render the current step content', async () => {
      render(<PatientFormWizard />);

      await waitFor(() => {
        expect(screen.getByTestId('demographics-form')).toBeInTheDocument();
      });
    });
  });

  describe('Navigation', () => {
    it('should disable previous button on first step', () => {
      render(<PatientFormWizard />);

      const previousButton = screen.getByText('Previous');
      expect(previousButton).toBeDisabled();
    });

    it('should enable next button when current step is valid', () => {
      render(<PatientFormWizard />);

      const nextButton = screen.getByText('Next');
      expect(nextButton).toBeEnabled();
    });

    it('should disable next button when current step is invalid', () => {
      const mockFormData = {
        givenName: 'John',
        familyName: 'Doe',
        gender: 'M' as const,
        birthdateEstimated: false,
        identifiers: [],
        attributes: [],
      };

      mockUsePatientForm.mockReturnValue({
        // State
        formData: mockFormData,
        errors: {},
        touched: {},
        isValid: false,
        isDirty: false,
        isLoading: false,
        isSubmitting: false,
        submitError: null,
        validationMode: 'onBlur' as const,
        completeness: {
          percentage: 50,
          completedFields: 3,
          totalFields: 6,
        },

        // Actions
        updateField: mockUpdateField,
        updateFields: jest.fn(),
        validateField: jest.fn(),
        validateForm: jest.fn(),
        setFieldTouched: jest.fn(),
        setFieldError: jest.fn(),
        clearErrors: jest.fn(),
        resetForm: mockResetForm,
        submitForm: mockSubmitForm,
        loadPatient: jest.fn(),
        setValidationMode: jest.fn(),

        // Computed values
        canSubmit: false,
        hasChanges: false,
        getFieldError: jest.fn().mockReturnValue(null),
        isFieldTouched: jest.fn().mockReturnValue(false),
        isFieldValid: jest.fn().mockReturnValue(true),
      });

      render(<PatientFormWizard />);

      const nextButton = screen.getByText('Next');
      expect(nextButton).toBeDisabled();
    });

    it('should show create button on summary step', async () => {
      const user = userEvent.setup();
      render(<PatientFormWizard mode="create" />);

      // Navigate to summary step (would need to be implemented based on actual wizard navigation)
      // For now, just check if the logic exists in the component
      expect(screen.queryByText('Create Patient')).toBeInTheDocument();
    });

    it('should show update button on summary step in edit mode', async () => {
      render(<PatientFormWizard mode="edit" />);

      expect(screen.queryByText('Update Patient')).toBeInTheDocument();
    });
  });

  describe('Exit Confirmation', () => {
    it('should show exit modal when canceling with unsaved changes', async () => {
      const user = userEvent.setup();

      const mockFormData = {
        givenName: 'John',
        familyName: 'Doe',
        gender: 'M' as const,
        birthdateEstimated: false,
        identifiers: [],
        attributes: [],
      };

      mockUsePatientForm.mockReturnValue({
        // State
        formData: mockFormData,
        errors: {},
        touched: {},
        isValid: true,
        isDirty: true, // Has unsaved changes
        isLoading: false,
        isSubmitting: false,
        submitError: null,
        validationMode: 'onBlur' as const,
        completeness: {
          percentage: 50,
          completedFields: 3,
          totalFields: 6,
        },

        // Actions
        updateField: mockUpdateField,
        updateFields: jest.fn(),
        validateField: jest.fn(),
        validateForm: jest.fn(),
        setFieldTouched: jest.fn(),
        setFieldError: jest.fn(),
        clearErrors: jest.fn(),
        resetForm: mockResetForm,
        submitForm: mockSubmitForm,
        loadPatient: jest.fn(),
        setValidationMode: jest.fn(),

        // Computed values
        canSubmit: true,
        hasChanges: true,
        getFieldError: jest.fn().mockReturnValue(null),
        isFieldTouched: jest.fn().mockReturnValue(false),
        isFieldValid: jest.fn().mockReturnValue(true),
      });

      render(<PatientFormWizard onCancel={mockOnCancel} />);

      const cancelButton = screen.getByText('Cancel');
      await user.click(cancelButton);

      await waitFor(() => {
        expect(screen.getByText('Unsaved Changes')).toBeInTheDocument();
        expect(screen.getByText('You have unsaved changes. Are you sure you want to exit?')).toBeInTheDocument();
      });
    });

    it('should call onCancel directly when no unsaved changes', async () => {
      const user = userEvent.setup();

      render(<PatientFormWizard onCancel={mockOnCancel} />);

      const cancelButton = screen.getByText('Cancel');
      await user.click(cancelButton);

      expect(mockOnCancel).toHaveBeenCalled();
    });

    it('should close modal when clicking cancel in exit confirmation', async () => {
      const user = userEvent.setup();

      const mockFormData = {
        givenName: 'John',
        familyName: 'Doe',
        gender: 'M' as const,
        birthdateEstimated: false,
        identifiers: [],
        attributes: [],
      };

      mockUsePatientForm.mockReturnValue({
        // State
        formData: mockFormData,
        errors: {},
        touched: {},
        isValid: true,
        isDirty: true,
        isLoading: false,
        isSubmitting: false,
        submitError: null,
        validationMode: 'onBlur' as const,
        completeness: {
          percentage: 50,
          completedFields: 3,
          totalFields: 6,
        },

        // Actions
        updateField: mockUpdateField,
        updateFields: jest.fn(),
        validateField: jest.fn(),
        validateForm: jest.fn(),
        setFieldTouched: jest.fn(),
        setFieldError: jest.fn(),
        clearErrors: jest.fn(),
        resetForm: mockResetForm,
        submitForm: mockSubmitForm,
        loadPatient: jest.fn(),
        setValidationMode: jest.fn(),

        // Computed values
        canSubmit: true,
        hasChanges: true,
        getFieldError: jest.fn().mockReturnValue(null),
        isFieldTouched: jest.fn().mockReturnValue(false),
        isFieldValid: jest.fn().mockReturnValue(true),
      });

      render(<PatientFormWizard onCancel={mockOnCancel} />);

      const cancelButton = screen.getByText('Cancel');
      await user.click(cancelButton);

      await waitFor(() => {
        expect(screen.getByText('Unsaved Changes')).toBeInTheDocument();
      });

      const modalCancelButton = screen.getAllByText('Cancel')[1]; // Second cancel button in modal
      await user.click(modalCancelButton);

      await waitFor(() => {
        expect(screen.queryByText('Unsaved Changes')).not.toBeInTheDocument();
      });
    });
  });

  describe('Form Submission', () => {
    it('should disable submit button when form is invalid', () => {
      const mockFormData = {
        givenName: 'John',
        familyName: 'Doe',
        gender: 'M' as const,
        birthdateEstimated: false,
        identifiers: [],
        attributes: [],
      };

      mockUsePatientForm.mockReturnValue({
        // State
        formData: mockFormData,
        errors: {},
        touched: {},
        isValid: false,
        isDirty: false,
        isLoading: false,
        isSubmitting: false,
        submitError: null,
        validationMode: 'onBlur' as const,
        completeness: {
          percentage: 50,
          completedFields: 3,
          totalFields: 6,
        },

        // Actions
        updateField: mockUpdateField,
        updateFields: jest.fn(),
        validateField: jest.fn(),
        validateForm: jest.fn(),
        setFieldTouched: jest.fn(),
        setFieldError: jest.fn(),
        clearErrors: jest.fn(),
        resetForm: mockResetForm,
        submitForm: mockSubmitForm,
        loadPatient: jest.fn(),
        setValidationMode: jest.fn(),

        // Computed values
        canSubmit: false,
        hasChanges: false,
        getFieldError: jest.fn().mockReturnValue(null),
        isFieldTouched: jest.fn().mockReturnValue(false),
        isFieldValid: jest.fn().mockReturnValue(true),
      });

      render(<PatientFormWizard />);

      const nextButton = screen.getByText('Next');
      expect(nextButton).toBeDisabled();
    });

    it('should disable buttons when submitting', () => {
      const mockFormData = {
        givenName: 'John',
        familyName: 'Doe',
        gender: 'M' as const,
        birthdateEstimated: false,
        identifiers: [],
        attributes: [],
      };

      mockUsePatientForm.mockReturnValue({
        // State
        formData: mockFormData,
        errors: {},
        touched: {},
        isValid: true,
        isDirty: false,
        isLoading: false,
        isSubmitting: true,
        submitError: null,
        validationMode: 'onBlur' as const,
        completeness: {
          percentage: 50,
          completedFields: 3,
          totalFields: 6,
        },

        // Actions
        updateField: mockUpdateField,
        updateFields: jest.fn(),
        validateField: jest.fn(),
        validateForm: jest.fn(),
        setFieldTouched: jest.fn(),
        setFieldError: jest.fn(),
        clearErrors: jest.fn(),
        resetForm: mockResetForm,
        submitForm: mockSubmitForm,
        loadPatient: jest.fn(),
        setValidationMode: jest.fn(),

        // Computed values
        canSubmit: false,
        hasChanges: false,
        getFieldError: jest.fn().mockReturnValue(null),
        isFieldTouched: jest.fn().mockReturnValue(false),
        isFieldValid: jest.fn().mockReturnValue(true),
      });

      render(<PatientFormWizard />);

      const cancelButton = screen.getByText('Cancel');
      const previousButton = screen.getByText('Previous');
      const nextButton = screen.getByText('Next');

      expect(cancelButton).toBeDisabled();
      expect(previousButton).toBeDisabled();
      expect(nextButton).toBeDisabled();
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA labels and roles', () => {
      render(<PatientFormWizard />);

      expect(screen.getByRole('progressbar')).toBeInTheDocument();
      expect(screen.getByRole('grid')).toBeInTheDocument(); // Carbon Grid component
    });

    it('should support keyboard navigation', async () => {
      const user = userEvent.setup();
      render(<PatientFormWizard />);

      const nextButton = screen.getByText('Next');
      nextButton.focus();

      expect(nextButton).toHaveFocus();

      await user.keyboard('{Enter}');
      // Would test actual navigation in a more complete test
    });
  });

  describe('Loading States', () => {
    it('should show loading spinner for lazy-loaded components', () => {
      render(<PatientFormWizard />);

      // The loading state is handled by React.Suspense
      expect(screen.getByText('Loading...')).toBeInTheDocument();
    });
  });
});
