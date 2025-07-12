import React from 'react';
import { render, screen } from '@testing-library/react';
import { FormSummary } from '../FormSummary';
import { PatientFormData } from '../../../../types/registration';
import { WizardContextValue } from '../PatientFormWizardContext';

// Mock the i18n hook
jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, options?: any) => {
      // Mock translation function
      const translations: Record<string, string> = {
        'registration.patient.summary.title': 'Review Patient Information',
        'registration.patient.summary.description': 'Please review the patient information below before submitting.',
        'registration.patient.demographics.personalInfo': 'Personal Information',
        'registration.patient.demographics.givenName': 'Given Name',
        'registration.patient.demographics.middleName': 'Middle Name',
        'registration.patient.demographics.familyName': 'Family Name',
        'registration.patient.demographics.gender': 'Gender',
        'registration.patient.demographics.birthdate': 'Birth Date',
        'registration.patient.demographics.age': 'Age',
        'registration.patient.demographics.years': 'years',
        'registration.patient.demographics.estimated': 'estimated',
        'registration.patient.demographics.genderMale': 'Male',
        'registration.patient.demographics.genderFemale': 'Female',
        'registration.patient.demographics.genderOther': 'Other',
        'registration.patient.identifiers.title': 'Patient Identifiers',
        'registration.patient.identifiers.preferred': 'Preferred',
        'registration.patient.address.title': 'Address',
        'registration.patient.address.address1': 'Address Line 1',
        'registration.patient.address.city': 'City',
        'registration.patient.address.state': 'State',
        'registration.patient.address.country': 'Country',
        'registration.patient.address.postalCode': 'Postal Code',
        'registration.patient.summary.validationErrors': 'Validation Errors',
        'registration.patient.summary.readyToSubmit': 'Ready to submit patient information',
        'registration.patient.summary.validation.stepIncomplete': 'Step {{step}} is incomplete',
        'registration.patient.form.steps.demographics': 'Demographics',
        'registration.patient.form.steps.identifiers': 'Identifiers',
        'common.notProvided': 'Not provided',
      };

      if (options && typeof options === 'object') {
        let result = translations[key] || key;
        Object.keys(options).forEach(optionKey => {
          result = result.replace(`{{${optionKey}}}`, options[optionKey]);
        });
        return result;
      }

      return translations[key] || key;
    },
  }),
}));

describe('FormSummary', () => {
  const mockWizard: WizardContextValue = {
    state: {
      currentStep: 'summary' as const,
      completedSteps: new Set(['demographics', 'identifiers'] as const),
      stepValidations: {
        demographics: { isValid: true, errors: [], isComplete: true },
        identifiers: { isValid: true, errors: [], isComplete: true },
        address: { isValid: true, errors: [], isComplete: true },
        attributes: { isValid: true, errors: [], isComplete: true },
        photo: { isValid: true, errors: [], isComplete: true },
        summary: { isValid: true, errors: [], isComplete: true },
      },
      isSubmitting: false,
      hasUnsavedChanges: false,
    },
    actions: {
      goToStep: jest.fn(),
      goToNextStep: jest.fn(),
      goToPreviousStep: jest.fn(),
      markStepCompleted: jest.fn(),
      setStepValidation: jest.fn(),
      setSubmitting: jest.fn(),
      setUnsavedChanges: jest.fn(),
      resetWizard: jest.fn(),
    },
    canGoToStep: jest.fn(),
    canGoNext: jest.fn(),
    canGoPrevious: jest.fn(),
    getCurrentStepIndex: jest.fn(),
    getTotalSteps: jest.fn(),
    getProgressPercentage: jest.fn(),
    getStepInfo: jest.fn(),
  };

  const mockFormData: PatientFormData = {
    givenName: 'John',
    middleName: 'Michael',
    familyName: 'Doe',
    gender: 'M',
    birthdate: '1990-01-15',
    age: 33,
    birthdateEstimated: false,
    identifiers: [
      {
        identifier: 'ID123456',
        identifierType: 'Patient ID',
        preferred: true,
        location: 'location-uuid',
      },
    ],
    address: {
      address1: '123 Main St',
      cityVillage: 'Anytown',
      stateProvince: 'State',
      country: 'Country',
      postalCode: '12345',
      preferred: true,
    },
    attributes: [],
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders form summary with patient data', () => {
    render(
      <FormSummary
        formData={mockFormData}
        errors={{}}
        updateField={jest.fn()}
        wizard={mockWizard}
      />
    );

    expect(screen.getByText('Review Patient Information')).toBeInTheDocument();
    expect(screen.getByText('Please review the patient information below before submitting.')).toBeInTheDocument();
    expect(screen.getByText('Personal Information')).toBeInTheDocument();
    expect(screen.getByText('John')).toBeInTheDocument();
    expect(screen.getByText('Michael')).toBeInTheDocument();
    expect(screen.getByText('Doe')).toBeInTheDocument();
    expect(screen.getByText('Male')).toBeInTheDocument();
  });

  it('renders identifiers section when identifiers exist', () => {
    render(
      <FormSummary
        formData={mockFormData}
        errors={{}}
        updateField={jest.fn()}
        wizard={mockWizard}
      />
    );

    expect(screen.getByText('Patient Identifiers')).toBeInTheDocument();
    expect(screen.getByText('ID123456')).toBeInTheDocument();
    expect(screen.getByText('Patient ID (Preferred):')).toBeInTheDocument();
  });

  it('renders address section when address exists', () => {
    render(
      <FormSummary
        formData={mockFormData}
        errors={{}}
        updateField={jest.fn()}
        wizard={mockWizard}
      />
    );

    expect(screen.getByText('Address')).toBeInTheDocument();
    expect(screen.getByText('123 Main St')).toBeInTheDocument();
    expect(screen.getByText('Anytown')).toBeInTheDocument();
    expect(screen.getByText('State')).toBeInTheDocument();
    expect(screen.getByText('Country')).toBeInTheDocument();
    expect(screen.getByText('12345')).toBeInTheDocument();
  });

  it('does not render middle name when not provided', () => {
    const formDataWithoutMiddleName = {
      ...mockFormData,
      middleName: '',
    };

    render(
      <FormSummary
        formData={formDataWithoutMiddleName}
        errors={{}}
        updateField={jest.fn()}
        wizard={mockWizard}
      />
    );

    expect(screen.queryByText('Middle Name:')).not.toBeInTheDocument();
  });

  it('does not render identifiers section when no identifiers exist', () => {
    const formDataWithoutIdentifiers = {
      ...mockFormData,
      identifiers: [],
    };

    render(
      <FormSummary
        formData={formDataWithoutIdentifiers}
        errors={{}}
        updateField={jest.fn()}
        wizard={mockWizard}
      />
    );

    expect(screen.queryByText('Patient Identifiers')).not.toBeInTheDocument();
  });

  it('does not render address section when no address exists', () => {
    const formDataWithoutAddress = {
      ...mockFormData,
      address: undefined,
    };

    render(
      <FormSummary
        formData={formDataWithoutAddress}
        errors={{}}
        updateField={jest.fn()}
        wizard={mockWizard}
      />
    );

    expect(screen.queryByText('Address')).not.toBeInTheDocument();
  });

  it('renders validation errors when steps are invalid', () => {
    const invalidWizard = {
      ...mockWizard,
      state: {
        ...mockWizard.state,
        stepValidations: {
          demographics: { isValid: false, errors: [], isComplete: false },
          identifiers: { isValid: true, errors: [], isComplete: true },
          address: { isValid: true, errors: [], isComplete: true },
          attributes: { isValid: true, errors: [], isComplete: true },
          photo: { isValid: true, errors: [], isComplete: true },
          summary: { isValid: false, errors: [], isComplete: false },
        },
      },
    };

    render(
      <FormSummary
        formData={mockFormData}
        errors={{}}
        updateField={jest.fn()}
        wizard={invalidWizard}
      />
    );

    expect(screen.getByText('Validation Errors')).toBeInTheDocument();
    expect(screen.getByText('Step Demographics is incomplete')).toBeInTheDocument();
  });

  it('renders success message when all steps are valid', () => {
    render(
      <FormSummary
        formData={mockFormData}
        errors={{}}
        updateField={jest.fn()}
        wizard={mockWizard}
      />
    );

    expect(screen.getByText('Ready to submit patient information')).toBeInTheDocument();
  });

  it('displays estimated birthdate indicator', () => {
    const formDataWithEstimatedBirthdate = {
      ...mockFormData,
      birthdateEstimated: true,
    };

    render(
      <FormSummary
        formData={formDataWithEstimatedBirthdate}
        errors={{}}
        updateField={jest.fn()}
        wizard={mockWizard}
      />
    );

    expect(screen.getByText('(estimated)')).toBeInTheDocument();
  });

  it('formats different gender values correctly', () => {
    const genderTests = [
      { gender: 'F' as const, expected: 'Female' },
      { gender: 'O' as const, expected: 'Other' },
    ];

    genderTests.forEach(({ gender, expected }) => {
      const formDataWithGender = {
        ...mockFormData,
        gender,
      };

      const { unmount } = render(
        <FormSummary
          formData={formDataWithGender}
          errors={{}}
          updateField={jest.fn()}
          wizard={mockWizard}
        />
      );

      expect(screen.getByText(expected)).toBeInTheDocument();
      unmount();
    });
  });

  it('calls setStepValidation with correct parameters', () => {
    const mockSetStepValidation = jest.fn();
    const wizardWithMockAction = {
      ...mockWizard,
      actions: {
        ...mockWizard.actions,
        setStepValidation: mockSetStepValidation,
      },
    };

    render(
      <FormSummary
        formData={mockFormData}
        errors={{}}
        updateField={jest.fn()}
        wizard={wizardWithMockAction}
      />
    );

    expect(mockSetStepValidation).toHaveBeenCalledWith('summary', {
      isValid: true,
      errors: [],
      isComplete: true,
    });
  });

  it('displays "Not provided" for missing required fields', () => {
    const formDataWithMissingFields = {
      ...mockFormData,
      givenName: '',
      familyName: '',
    };

    render(
      <FormSummary
        formData={formDataWithMissingFields}
        errors={{}}
        updateField={jest.fn()}
        wizard={mockWizard}
      />
    );

    expect(screen.getAllByText('Not provided')).toHaveLength(2);
  });
});
