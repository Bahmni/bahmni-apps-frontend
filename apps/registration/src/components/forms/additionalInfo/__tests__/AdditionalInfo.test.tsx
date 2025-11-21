import { useTranslation } from '@bahmni/services';
import { render, fireEvent, screen, act } from '@testing-library/react';
import { createRef } from 'react';
import '@testing-library/jest-dom';
import { AdditionalData } from '../../../../models/patient';
import { AdditionalInfo, AdditionalInfoRef } from '../AdditionalInfo';

// Mock the translation hook
jest.mock('@bahmni/services', () => ({
  useTranslation: jest.fn(),
}));

// Mock registration config hook - with overridable return value
const mockUseRegistrationConfig = jest.fn(() => ({
  registrationConfig: {
    patientInformation: {
      additionalPatientInformation: {
        translationKey: 'CREATE_PATIENT_SECTION_ADDITIONAL_INFO',
        expectedFields: [
          {
            field: 'email',
            translationKey: 'CREATE_PATIENT_EMAIL',
          },
        ],
      },
    },
    fieldValidation: {
      email: {
        pattern: '^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$',
        errorMessage: 'Should be a valid email address',
      },
    },
  },
  setRegistrationConfig: jest.fn(),
  isLoading: false,
  setIsLoading: jest.fn(),
  error: null,
  setError: jest.fn(),
  refetch: jest.fn(),
}));

jest.mock('../../../../hooks/useRegistrationConfig', () => ({
  useRegistrationConfig: () => mockUseRegistrationConfig(),
}));

const mockUseTranslation = useTranslation as jest.MockedFunction<
  typeof useTranslation
>;

describe('AdditionalInfo', () => {
  const mockT = jest.fn((key: string) => key);

  beforeEach(() => {
    mockUseTranslation.mockReturnValue({ t: mockT } as any);

    // Reset to default config
    mockUseRegistrationConfig.mockReturnValue({
      registrationConfig: {
        patientInformation: {
          additionalPatientInformation: {
            translationKey: 'CREATE_PATIENT_SECTION_ADDITIONAL_INFO',
            expectedFields: [
              {
                field: 'email',
                translationKey: 'CREATE_PATIENT_EMAIL',
              },
            ],
          },
        },
        fieldValidation: {
          email: {
            pattern: '^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$',
            errorMessage: 'CREATE_PATIENT_VALIDATION_EMAIL_INVALID',
          },
        },
      },
      setRegistrationConfig: jest.fn(),
      isLoading: false,
      setIsLoading: jest.fn(),
      error: null,
      setError: jest.fn(),
      refetch: jest.fn(),
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Rendering', () => {
    it('renders correctly with initial data', () => {
      const initialData: AdditionalData = { email: 'test@example.com' };
      render(<AdditionalInfo initialData={initialData} />);

      const emailInput = screen.getByLabelText(
        'CREATE_PATIENT_EMAIL',
      ) as HTMLInputElement;
      expect(emailInput).toBeInTheDocument();
      expect(emailInput.value).toBe(initialData.email);
    });

    it('renders section title from translation', () => {
      render(<AdditionalInfo />);

      expect(mockT).toHaveBeenCalledWith(
        'CREATE_PATIENT_SECTION_ADDITIONAL_INFO',
      );
    });

    it('renders multiple fields when configured', () => {
      mockUseRegistrationConfig.mockReturnValue({
        registrationConfig: {
          patientInformation: {
            additionalPatientInformation: {
              translationKey: 'CREATE_PATIENT_SECTION_ADDITIONAL_INFO',
              expectedFields: [
                { field: 'email', translationKey: 'CREATE_PATIENT_EMAIL' },
                {
                  field: 'phoneNumber',
                  translationKey: 'CREATE_PATIENT_PHONE',
                },
                {
                  field: 'occupation',
                  translationKey: 'CREATE_PATIENT_OCCUPATION',
                },
              ],
            },
          },
          fieldValidation: {
            email: {
              pattern: '^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$',
              errorMessage: 'CREATE_PATIENT_VALIDATION_EMAIL_INVALID',
            },
          },
        },
        setRegistrationConfig: jest.fn(),
        isLoading: false,
        setIsLoading: jest.fn(),
        error: null,
        setError: jest.fn(),
        refetch: jest.fn(),
      });

      render(<AdditionalInfo />);

      expect(screen.getByLabelText('CREATE_PATIENT_EMAIL')).toBeInTheDocument();
      expect(screen.getByLabelText('CREATE_PATIENT_PHONE')).toBeInTheDocument();
      expect(
        screen.getByLabelText('CREATE_PATIENT_OCCUPATION'),
      ).toBeInTheDocument();
    });

    it('returns null when no expected fields are configured', () => {
      mockUseRegistrationConfig.mockReturnValue({
        registrationConfig: {
          patientInformation: {
            additionalPatientInformation: {
              translationKey: 'CREATE_PATIENT_SECTION_ADDITIONAL_INFO',
              expectedFields: [],
            },
          },
          fieldValidation: {
            email: {
              pattern: '',
              errorMessage: 'Should be a valid email address',
            },
          },
        },
        setRegistrationConfig: jest.fn(),
        isLoading: false,
        setIsLoading: jest.fn(),
        error: null,
        setError: jest.fn(),
        refetch: jest.fn(),
      });

      const { container } = render(<AdditionalInfo />);
      expect(container.firstChild).toBeNull();
    });

    it('returns null when additionalPatientInformation is not configured', () => {
      mockUseRegistrationConfig.mockReturnValue({
        registrationConfig: {
          patientInformation: {
            additionalPatientInformation: {
              translationKey: 'CREATE_PATIENT_SECTION_ADDITIONAL_INFO',
              expectedFields: [],
            },
          },
          fieldValidation: {
            email: {
              pattern: '',
              errorMessage: 'Should be a valid email address',
            },
          },
        },
        setRegistrationConfig: jest.fn(),
        isLoading: false,
        setIsLoading: jest.fn(),
        error: null,
        setError: jest.fn(),
        refetch: jest.fn(),
      });

      const { container } = render(<AdditionalInfo />);
      expect(container.firstChild).toBeNull();
    });
  });

  describe('Input Handling', () => {
    it('updates email field on change and clears error', () => {
      render(<AdditionalInfo />);
      const emailInput = screen.getByLabelText(
        'CREATE_PATIENT_EMAIL',
      ) as HTMLInputElement;

      fireEvent.change(emailInput, { target: { value: 'new@example.com' } });
      expect(emailInput.value).toBe('new@example.com');
    });

    it('updates multiple fields independently', () => {
      mockUseRegistrationConfig.mockReturnValue({
        registrationConfig: {
          patientInformation: {
            additionalPatientInformation: {
              translationKey: 'CREATE_PATIENT_SECTION_ADDITIONAL_INFO',
              expectedFields: [
                { field: 'email', translationKey: 'CREATE_PATIENT_EMAIL' },
                {
                  field: 'phoneNumber',
                  translationKey: 'CREATE_PATIENT_PHONE',
                },
              ],
            },
          },
          fieldValidation: {
            email: {
              pattern: '^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$',
              errorMessage: 'CREATE_PATIENT_VALIDATION_EMAIL_INVALID',
            },
          },
        },
        setRegistrationConfig: jest.fn(),
        isLoading: false,
        setIsLoading: jest.fn(),
        error: null,
        setError: jest.fn(),
        refetch: jest.fn(),
      });

      render(<AdditionalInfo />);

      const emailInput = screen.getByLabelText(
        'CREATE_PATIENT_EMAIL',
      ) as HTMLInputElement;
      const phoneInput = screen.getByLabelText(
        'CREATE_PATIENT_PHONE',
      ) as HTMLInputElement;

      fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
      fireEvent.change(phoneInput, { target: { value: '1234567890' } });

      expect(emailInput.value).toBe('test@example.com');
      expect(phoneInput.value).toBe('1234567890');
    });

    it('clears field values', () => {
      render(<AdditionalInfo />);

      const emailInput = screen.getByLabelText(
        'CREATE_PATIENT_EMAIL',
      ) as HTMLInputElement;
      fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
      expect(emailInput.value).toBe('test@example.com');

      fireEvent.change(emailInput, { target: { value: '' } });
      expect(emailInput.value).toBe('');
    });
  });

  describe('Validation', () => {
    it('returns true for valid email', () => {
      const ref = createRef<AdditionalInfoRef>();
      render(<AdditionalInfo ref={ref} />);

      const emailInput = screen.getByLabelText(
        'CREATE_PATIENT_EMAIL',
      ) as HTMLInputElement;
      fireEvent.change(emailInput, { target: { value: 'valid@example.com' } });

      const isValid = ref.current?.validate();
      expect(isValid).toBe(true);
      expect(
        screen.queryByText('CREATE_PATIENT_VALIDATION_EMAIL_INVALID'),
      ).not.toBeInTheDocument();
    });

    it('returns true for empty email', () => {
      const ref = createRef<AdditionalInfoRef>();
      render(<AdditionalInfo ref={ref} />);

      const isValid = ref.current?.validate();
      expect(isValid).toBe(true);
    });

    it('returns false and shows error for invalid email', () => {
      const ref = createRef<AdditionalInfoRef>();
      render(<AdditionalInfo ref={ref} />);

      const emailInput = screen.getByLabelText(
        'CREATE_PATIENT_EMAIL',
      ) as HTMLInputElement;
      fireEvent.change(emailInput, { target: { value: 'invalid-email' } });

      let isValid: boolean | undefined;
      act(() => {
        isValid = ref.current?.validate();
      });
      expect(isValid).toBe(false);
      expect(
        screen.getByText('CREATE_PATIENT_VALIDATION_EMAIL_INVALID'),
      ).toBeInTheDocument();
    });

    it('uses custom email pattern from config', () => {
      mockUseRegistrationConfig.mockReturnValue({
        registrationConfig: {
          patientInformation: {
            additionalPatientInformation: {
              translationKey: 'CREATE_PATIENT_SECTION_ADDITIONAL_INFO',
              expectedFields: [
                { field: 'email', translationKey: 'CREATE_PATIENT_EMAIL' },
              ],
            },
          },
          fieldValidation: {
            email: {
              pattern: '^[a-zA-Z\\s]*$', // Only letters and spaces
              errorMessage: 'CUSTOM_ERROR_MESSAGE',
            },
          },
        },
        setRegistrationConfig: jest.fn(),
        isLoading: false,
        setIsLoading: jest.fn(),
        error: null,
        setError: jest.fn(),
        refetch: jest.fn(),
      });

      const ref = createRef<AdditionalInfoRef>();
      render(<AdditionalInfo ref={ref} />);

      const emailInput = screen.getByLabelText(
        'CREATE_PATIENT_EMAIL',
      ) as HTMLInputElement;
      fireEvent.change(emailInput, { target: { value: 'test@example.com' } });

      let isValid: boolean | undefined;
      act(() => {
        isValid = ref.current?.validate();
      });
      expect(isValid).toBe(false);
      expect(screen.getByText('CUSTOM_ERROR_MESSAGE')).toBeInTheDocument();
    });

    it('uses default pattern when fieldValidation is not configured', () => {
      mockUseRegistrationConfig.mockReturnValue({
        registrationConfig: {
          patientInformation: {
            additionalPatientInformation: {
              translationKey: 'CREATE_PATIENT_SECTION_ADDITIONAL_INFO',
              expectedFields: [
                { field: 'email', translationKey: 'CREATE_PATIENT_EMAIL' },
              ],
            },
          },
          fieldValidation: {
            email: {
              pattern: '^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$',
              errorMessage: 'CREATE_PATIENT_VALIDATION_EMAIL_INVALID',
            },
          },
        },
        setRegistrationConfig: jest.fn(),
        isLoading: false,
        setIsLoading: jest.fn(),
        error: null,
        setError: jest.fn(),
        refetch: jest.fn(),
      });

      const ref = createRef<AdditionalInfoRef>();
      render(<AdditionalInfo ref={ref} />);

      const emailInput = screen.getByLabelText(
        'CREATE_PATIENT_EMAIL',
      ) as HTMLInputElement;
      // Use letters only to test that valid email pattern works
      fireEvent.change(emailInput, { target: { value: 'invalidemailformat' } });

      let isValid: boolean | undefined;
      act(() => {
        isValid = ref.current?.validate();
      });
      expect(isValid).toBe(false);
      expect(
        screen.getByText('CREATE_PATIENT_VALIDATION_EMAIL_INVALID'),
      ).toBeInTheDocument();
    });

    it('clears error when user types after validation failure', () => {
      const ref = createRef<AdditionalInfoRef>();
      render(<AdditionalInfo ref={ref} />);

      const emailInput = screen.getByLabelText(
        'CREATE_PATIENT_EMAIL',
      ) as HTMLInputElement;
      fireEvent.change(emailInput, { target: { value: 'invalid' } });

      act(() => {
        ref.current?.validate();
      });
      expect(
        screen.getByText('CREATE_PATIENT_VALIDATION_EMAIL_INVALID'),
      ).toBeInTheDocument();

      fireEvent.change(emailInput, { target: { value: 'valid@example.com' } });
      expect(
        screen.queryByText('CREATE_PATIENT_VALIDATION_EMAIL_INVALID'),
      ).not.toBeInTheDocument();
    });

    it('only validates email field, not other fields', () => {
      mockUseRegistrationConfig.mockReturnValue({
        registrationConfig: {
          patientInformation: {
            additionalPatientInformation: {
              translationKey: 'CREATE_PATIENT_SECTION_ADDITIONAL_INFO',
              expectedFields: [
                { field: 'email', translationKey: 'CREATE_PATIENT_EMAIL' },
                {
                  field: 'phoneNumber',
                  translationKey: 'CREATE_PATIENT_PHONE',
                },
              ],
            },
          },
          fieldValidation: {
            email: {
              pattern: '^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$',
              errorMessage: 'CREATE_PATIENT_VALIDATION_EMAIL_INVALID',
            },
          },
        },
        setRegistrationConfig: jest.fn(),
        isLoading: false,
        setIsLoading: jest.fn(),
        error: null,
        setError: jest.fn(),
        refetch: jest.fn(),
      });

      const ref = createRef<AdditionalInfoRef>();
      render(<AdditionalInfo ref={ref} />);

      const emailInput = screen.getByLabelText(
        'CREATE_PATIENT_EMAIL',
      ) as HTMLInputElement;
      const phoneInput = screen.getByLabelText(
        'CREATE_PATIENT_PHONE',
      ) as HTMLInputElement;

      fireEvent.change(emailInput, { target: { value: 'valid@example.com' } });
      fireEvent.change(phoneInput, { target: { value: 'any value' } });

      const isValid = ref.current?.validate();
      expect(isValid).toBe(true); // Phone number doesn't have validation
    });
  });

  describe('getData Method', () => {
    it('exposes getData ref method to return current form data', () => {
      const ref = createRef<AdditionalInfoRef>();
      render(<AdditionalInfo ref={ref} />);

      const emailInput = screen.getByLabelText(
        'CREATE_PATIENT_EMAIL',
      ) as HTMLInputElement;
      fireEvent.change(emailInput, { target: { value: 'data@example.com' } });

      const data = ref.current?.getData();
      expect(data).toEqual({ email: 'data@example.com' });
    });

    it('returns empty strings for unfilled fields', () => {
      const ref = createRef<AdditionalInfoRef>();
      render(<AdditionalInfo ref={ref} />);

      const data = ref.current?.getData();
      expect(data).toEqual({ email: '' });
    });

    it('returns all field values for multiple fields', () => {
      mockUseRegistrationConfig.mockReturnValue({
        registrationConfig: {
          patientInformation: {
            additionalPatientInformation: {
              translationKey: 'CREATE_PATIENT_SECTION_ADDITIONAL_INFO',
              expectedFields: [
                { field: 'email', translationKey: 'CREATE_PATIENT_EMAIL' },
                {
                  field: 'phoneNumber',
                  translationKey: 'CREATE_PATIENT_PHONE',
                },
                {
                  field: 'occupation',
                  translationKey: 'CREATE_PATIENT_OCCUPATION',
                },
              ],
            },
          },
          fieldValidation: {
            email: {
              pattern: '^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$',
              errorMessage: 'Should be a valid email address',
            },
          },
        },
        setRegistrationConfig: jest.fn(),
        isLoading: false,
        setIsLoading: jest.fn(),
        error: null,
        setError: jest.fn(),
        refetch: jest.fn(),
      });

      const ref = createRef<AdditionalInfoRef>();
      render(<AdditionalInfo ref={ref} />);

      fireEvent.change(screen.getByLabelText('CREATE_PATIENT_EMAIL'), {
        target: { value: 'test@example.com' },
      });
      fireEvent.change(screen.getByLabelText('CREATE_PATIENT_PHONE'), {
        target: { value: '1234567890' },
      });
      fireEvent.change(screen.getByLabelText('CREATE_PATIENT_OCCUPATION'), {
        target: { value: 'Engineer' },
      });

      const data = ref.current?.getData();
      expect(data).toEqual({
        email: 'test@example.com',
        phoneNumber: '1234567890',
        occupation: 'Engineer',
      });
    });

    it('preserves initial data and merges with changes', () => {
      const initialData: AdditionalData = {
        email: 'initial@example.com',
      };

      const ref = createRef<AdditionalInfoRef>();
      render(<AdditionalInfo initialData={initialData} ref={ref} />);

      const emailInput = screen.getByLabelText(
        'CREATE_PATIENT_EMAIL',
      ) as HTMLInputElement;
      expect(emailInput.value).toBe('initial@example.com');

      fireEvent.change(emailInput, {
        target: { value: 'updated@example.com' },
      });

      const data = ref.current?.getData();
      expect(data).toEqual({ email: 'updated@example.com' });
    });
  });
});
