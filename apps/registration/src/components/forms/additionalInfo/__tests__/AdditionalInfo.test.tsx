import { useTranslation } from '@bahmni/services';
import { render, fireEvent, screen, act } from '@testing-library/react';
import { createRef } from 'react';
import '@testing-library/jest-dom';
import { PersonAttributesData } from '../../../../models/patient';
import { AdditionalInfo, AdditionalInfoRef } from '../AdditionalInfo';

// Mock the translation hook
jest.mock('@bahmni/services', () => ({
  useTranslation: jest.fn(),
}));

// Mock PersonAttributeInput component
jest.mock('../../../common/PersonAttributeInput', () => ({
  PersonAttributeInput: ({ name, label, value, onChange, error }: any) => (
    <div data-testid={`person-attribute-input-${name}`}>
      <label htmlFor={label}>{label}</label>
      <input
        id={label}
        aria-label={label}
        value={value ?? ''}
        onChange={(e) => onChange(e.target.value)}
      />
      {error && <span>{error}</span>}
    </div>
  ),
}));

// Mock usePersonAttributeFields hook
const mockUsePersonAttributeFields = jest.fn(() => ({
  attributeFields: [
    {
      uuid: 'email-uuid',
      name: 'email',
      format: 'java.lang.String',
      sortWeight: 1,
      description: null,
    },
    {
      uuid: 'cluster-uuid',
      name: 'cluster',
      format: 'java.lang.String',
      sortWeight: 2,
      description: null,
    },
  ],
  isLoading: false,
  error: null,
}));

jest.mock('../../../../hooks/usePersonAttributeFields', () => ({
  usePersonAttributeFields: () => mockUsePersonAttributeFields(),
}));

// Mock registration config hook
const mockUseRegistrationConfig = jest.fn(() => ({
  registrationConfig: {
    patientInformation: {
      additionalPatientInformation: {
        translationKey: 'CREATE_PATIENT_SECTION_ADDITIONAL_INFO',
        attributes: [
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
    jest.clearAllMocks();

    // Reset to default config
    mockUseRegistrationConfig.mockReturnValue({
      registrationConfig: {
        patientInformation: {
          additionalPatientInformation: {
            translationKey: 'CREATE_PATIENT_SECTION_ADDITIONAL_INFO',
            attributes: [
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
    });

    // Reset to default person attributes
    mockUsePersonAttributeFields.mockReturnValue({
      attributeFields: [
        {
          uuid: 'email-uuid',
          name: 'email',
          format: 'java.lang.String',
          sortWeight: 1,
          description: null,
        },
        {
          uuid: 'cluster-uuid',
          name: 'cluster',
          format: 'java.lang.String',
          sortWeight: 2,
          description: null,
        },
      ],
      isLoading: false,
      error: null,
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Rendering', () => {
    it('renders correctly with initial data', () => {
      const initialData: PersonAttributesData = { email: 'test@example.com' };
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
              attributes: [
                { field: 'email', translationKey: 'CREATE_PATIENT_EMAIL' },
                { field: 'cluster', translationKey: 'CREATE_PATIENT_CLUSTER' },
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
      });

      render(<AdditionalInfo />);

      expect(screen.getByLabelText('CREATE_PATIENT_EMAIL')).toBeInTheDocument();
      expect(
        screen.getByLabelText('CREATE_PATIENT_CLUSTER'),
      ).toBeInTheDocument();
    });

    it('returns null when no attributes are configured', () => {
      mockUseRegistrationConfig.mockReturnValue({
        registrationConfig: {
          patientInformation: {
            additionalPatientInformation: {
              translationKey: 'CREATE_PATIENT_SECTION_ADDITIONAL_INFO',
              attributes: [],
            },
          },
        },
      } as any);

      const { container } = render(<AdditionalInfo />);
      expect(container.firstChild).toBeNull();
    });

    it('returns null when additionalPatientInformation is not configured', () => {
      mockUseRegistrationConfig.mockReturnValue({
        registrationConfig: {
          patientInformation: {},
        },
      } as any);

      const { container } = render(<AdditionalInfo />);
      expect(container.firstChild).toBeNull();
    });

    it('only renders fields that exist in both API and config', () => {
      mockUseRegistrationConfig.mockReturnValue({
        registrationConfig: {
          patientInformation: {
            additionalPatientInformation: {
              translationKey: 'CREATE_PATIENT_SECTION_ADDITIONAL_INFO',
              attributes: [
                { field: 'email', translationKey: 'CREATE_PATIENT_EMAIL' },
                { field: 'nonExistentField', translationKey: 'SOME_FIELD' },
              ],
            },
          },
        },
      } as any);

      render(<AdditionalInfo />);

      // Should render email (exists in API)
      expect(screen.getByLabelText('CREATE_PATIENT_EMAIL')).toBeInTheDocument();

      // Should NOT render nonExistentField (doesn't exist in API)
      expect(screen.queryByLabelText('SOME_FIELD')).not.toBeInTheDocument();
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
              attributes: [
                { field: 'email', translationKey: 'CREATE_PATIENT_EMAIL' },
                { field: 'cluster', translationKey: 'CREATE_PATIENT_CLUSTER' },
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
      });

      render(<AdditionalInfo />);

      const emailInput = screen.getByLabelText(
        'CREATE_PATIENT_EMAIL',
      ) as HTMLInputElement;
      const clusterInput = screen.getByLabelText(
        'CREATE_PATIENT_CLUSTER',
      ) as HTMLInputElement;

      fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
      fireEvent.change(clusterInput, { target: { value: 'North' } });

      expect(emailInput.value).toBe('test@example.com');
      expect(clusterInput.value).toBe('North');
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

    it('uses custom pattern from config', () => {
      mockUseRegistrationConfig.mockReturnValue({
        registrationConfig: {
          patientInformation: {
            additionalPatientInformation: {
              translationKey: 'CREATE_PATIENT_SECTION_ADDITIONAL_INFO',
              attributes: [
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

    it('returns only displayed fields when unfilled', () => {
      const ref = createRef<AdditionalInfoRef>();
      render(<AdditionalInfo ref={ref} />);

      const data = ref.current?.getData();
      expect(data).toEqual({ email: undefined });
    });

    it('returns all field values for multiple fields', () => {
      mockUseRegistrationConfig.mockReturnValue({
        registrationConfig: {
          patientInformation: {
            additionalPatientInformation: {
              translationKey: 'CREATE_PATIENT_SECTION_ADDITIONAL_INFO',
              attributes: [
                { field: 'email', translationKey: 'CREATE_PATIENT_EMAIL' },
                { field: 'cluster', translationKey: 'CREATE_PATIENT_CLUSTER' },
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
      });

      const ref = createRef<AdditionalInfoRef>();
      render(<AdditionalInfo ref={ref} />);

      fireEvent.change(screen.getByLabelText('CREATE_PATIENT_EMAIL'), {
        target: { value: 'test@example.com' },
      });
      fireEvent.change(screen.getByLabelText('CREATE_PATIENT_CLUSTER'), {
        target: { value: 'North' },
      });

      const data = ref.current?.getData();
      expect(data).toEqual({
        email: 'test@example.com',
        cluster: 'North',
      });
    });

    it('preserves initial data and merges with changes', () => {
      const initialData: PersonAttributesData = {
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

    it('should only return fields that are displayed by this component', () => {
      const initialData: PersonAttributesData = {
        email: 'test@example.com',
        phoneNumber: '1234567890',
      };

      const ref = createRef<AdditionalInfoRef>();
      render(<AdditionalInfo initialData={initialData} ref={ref} />);

      const data = ref.current?.getData();

      expect(data).toHaveProperty('email', 'test@example.com');
      expect(data).not.toHaveProperty('phoneNumber');
    });
  });

  describe('Dynamic Fields', () => {
    it('should render custom person attributes when configured', () => {
      mockUsePersonAttributeFields.mockReturnValue({
        attributeFields: [
          {
            uuid: 'custom-uuid',
            name: 'customField',
            format: 'java.lang.String',
            sortWeight: 1,
            description: null,
          },
        ],
        isLoading: false,
        error: null,
      });

      mockUseRegistrationConfig.mockReturnValue({
        registrationConfig: {
          patientInformation: {
            additionalPatientInformation: {
              translationKey: 'CREATE_PATIENT_SECTION_ADDITIONAL_INFO',
              attributes: [
                {
                  field: 'customField',
                  translationKey: 'CUSTOM_FIELD_LABEL',
                },
              ],
            },
          },
        },
      } as any);

      render(<AdditionalInfo />);

      expect(screen.getByLabelText('CUSTOM_FIELD_LABEL')).toBeInTheDocument();
    });

    it('should support boolean type fields', () => {
      mockUsePersonAttributeFields.mockReturnValue({
        attributeFields: [
          {
            uuid: 'boolean-uuid',
            name: 'isActive',
            format: 'java.lang.Boolean',
            sortWeight: 1,
            description: null,
          },
        ],
        isLoading: false,
        error: null,
      });

      mockUseRegistrationConfig.mockReturnValue({
        registrationConfig: {
          patientInformation: {
            additionalPatientInformation: {
              translationKey: 'CREATE_PATIENT_SECTION_ADDITIONAL_INFO',
              attributes: [
                {
                  field: 'isActive',
                  translationKey: 'IS_ACTIVE',
                },
              ],
            },
          },
        },
      } as any);

      render(<AdditionalInfo />);

      expect(screen.getByLabelText('IS_ACTIVE')).toBeInTheDocument();
    });

    it('should support concept type fields with answers', () => {
      mockUsePersonAttributeFields.mockReturnValue({
        attributeFields: [
          {
            uuid: 'concept-uuid',
            name: 'bloodGroup',
            format: 'org.openmrs.Concept',
            sortWeight: 1,
            description: null,
            answers: [
              { uuid: 'a-uuid', display: 'A+' },
              { uuid: 'b-uuid', display: 'B+' },
            ],
          } as any,
        ],
        isLoading: false,
        error: null,
      });

      mockUseRegistrationConfig.mockReturnValue({
        registrationConfig: {
          patientInformation: {
            additionalPatientInformation: {
              translationKey: 'CREATE_PATIENT_SECTION_ADDITIONAL_INFO',
              attributes: [
                {
                  field: 'bloodGroup',
                  translationKey: 'BLOOD_GROUP',
                },
              ],
            },
          },
        },
      } as any);

      render(<AdditionalInfo />);

      expect(screen.getByLabelText('BLOOD_GROUP')).toBeInTheDocument();
    });
  });
});
