import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';
import { ContactInfo } from '../ContactInfo';
import type { ContactInfoRef } from '../ContactInfo';

// Mock PersonAttributeInput component
jest.mock('../../../common/PersonAttributeInput', () => ({
  PersonAttributeInput: ({
    uuid,
    name,
    label,
    value,
    onChange,
    error,
  }: {
    uuid: string;
    name: string;
    label: string;
    value: string | number | boolean;
    onChange: (value: string | number | boolean) => void;
    error: string;
  }) => (
    <div data-testid={`person-attribute-input-${name}`}>
      <label htmlFor={uuid}>{label}</label>
      <input
        id={uuid}
        value={value as string}
        onChange={(e) => onChange(e.target.value)}
        aria-invalid={!!error}
        aria-describedby={error ? `${uuid}-error` : undefined}
      />
      {error && <span id={`${uuid}-error`}>{error}</span>}
    </div>
  ),
}));

// Mock the services
jest.mock('@bahmni/services', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}));

// Mock usePersonAttributeFields hook
const mockUsePersonAttributeFields = jest.fn(() => ({
  attributeFields: [
    {
      uuid: 'phone-uuid',
      name: 'phoneNumber',
      format: 'java.lang.String',
      sortWeight: 1,
    },
    {
      uuid: 'alt-phone-uuid',
      name: 'alternatePhoneNumber',
      format: 'java.lang.String',
      sortWeight: 2,
    },
  ],
  isLoading: false,
  error: null,
}));

jest.mock('../../../../hooks/usePersonAttributeFields', () => ({
  usePersonAttributeFields: () => mockUsePersonAttributeFields(),
}));

// Mock useRegistrationConfig hook
const mockUseRegistrationConfig = jest.fn(() => ({
  registrationConfig: {
    patientInformation: {
      contactInformation: {
        translationKey: 'CREATE_PATIENT_SECTION_CONTACT_INFO',
        attributes: [
          {
            field: 'phoneNumber',
            translationKey: 'CREATE_PATIENT_PHONE_NUMBER',
          },
          {
            field: 'alternatePhoneNumber',
            translationKey: 'CREATE_PATIENT_ALT_PHONE_NUMBER',
          },
        ],
      },
    },
    fieldValidation: {
      phoneNumber: {
        pattern: '^\\+?[0-9]{6,15}$',
        errorMessage: 'Phone number should be 6 to 15 digits',
      },
      alternatePhoneNumber: {
        pattern: '^\\+?[0-9]{6,15}$',
        errorMessage: 'Alternate phone number should be 6 to 15 digits',
      },
    },
  },
}));

jest.mock('../../../../hooks/useRegistrationConfig', () => ({
  useRegistrationConfig: () => mockUseRegistrationConfig(),
}));

describe('ContactInfo', () => {
  let ref: React.RefObject<ContactInfoRef | null>;

  beforeEach(() => {
    ref = React.createRef<ContactInfoRef | null>();
    jest.clearAllMocks();
  });

  describe('Rendering', () => {
    it('should render contact information fields based on config', () => {
      render(<ContactInfo ref={ref} />);

      expect(
        screen.getByLabelText('CREATE_PATIENT_PHONE_NUMBER'),
      ).toBeInTheDocument();
      expect(
        screen.getByLabelText('CREATE_PATIENT_ALT_PHONE_NUMBER'),
      ).toBeInTheDocument();
    });

    it('should not render when no config attributes', () => {
      mockUseRegistrationConfig.mockReturnValue({
        registrationConfig: {
          patientInformation: {
            contactInformation: {
              translationKey: 'CREATE_PATIENT_SECTION_CONTACT_INFO',
              attributes: [],
            },
          },
        },
      } as any);

      const { container } = render(<ContactInfo ref={ref} />);
      expect(container.firstChild).toBeNull();
    });

    it('should only render fields that exist in both API and config', () => {
      mockUseRegistrationConfig.mockReturnValue({
        registrationConfig: {
          patientInformation: {
            contactInformation: {
              translationKey: 'CREATE_PATIENT_SECTION_CONTACT_INFO',
              attributes: [
                {
                  field: 'phoneNumber',
                  translationKey: 'CREATE_PATIENT_PHONE_NUMBER',
                },
                {
                  field: 'nonExistentField', // This doesn't exist in API
                  translationKey: 'SOME_FIELD',
                },
              ],
            },
          },
        },
      } as any);

      render(<ContactInfo ref={ref} />);

      // Should render phoneNumber (exists in API)
      expect(
        screen.getByLabelText('CREATE_PATIENT_PHONE_NUMBER'),
      ).toBeInTheDocument();

      // Should NOT render nonExistentField (doesn't exist in API)
      expect(screen.queryByLabelText('SOME_FIELD')).not.toBeInTheDocument();
    });
  });

  describe('Input Handling', () => {
    it('should handle input changes', () => {
      render(<ContactInfo ref={ref} />);
      const phoneInput = screen.getByLabelText(
        'CREATE_PATIENT_PHONE_NUMBER',
      ) as HTMLInputElement;

      fireEvent.change(phoneInput, { target: { value: '1234567890' } });
      expect(phoneInput.value).toBe('1234567890');
    });

    it('should update value when input changes', () => {
      render(<ContactInfo ref={ref} />);
      const phoneInput = screen.getByLabelText(
        'CREATE_PATIENT_PHONE_NUMBER',
      ) as HTMLInputElement;

      fireEvent.change(phoneInput, { target: { value: '+911234567890' } });
      expect(phoneInput.value).toBe('+911234567890');
    });

    it('should clear error when valid input is provided', () => {
      render(<ContactInfo ref={ref} />);
      const phoneInput = screen.getByLabelText(
        'CREATE_PATIENT_PHONE_NUMBER',
      ) as HTMLInputElement;

      // First trigger validation to show error
      ref.current?.validate();

      // Then provide valid input
      fireEvent.change(phoneInput, { target: { value: '1234567890' } });

      // Error should be cleared
      const errorElement = screen.queryByText(
        'Phone number should be 6 to 15 digits',
      );
      expect(errorElement).not.toBeInTheDocument();
    });
  });

  describe('Field Validation', () => {
    it('should pass validation for empty optional fields', () => {
      render(<ContactInfo ref={ref} />);

      const isValid = ref.current?.validate();
      expect(isValid).toBe(true);
    });
  });

  describe('getData Method', () => {
    it('should return only displayed fields when no input provided', () => {
      render(<ContactInfo ref={ref} />);

      const data = ref.current?.getData();

      expect(data).toEqual({});
    });

    it('should return current phone number', () => {
      render(<ContactInfo ref={ref} />);

      const phoneInput = screen.getByLabelText('CREATE_PATIENT_PHONE_NUMBER');
      fireEvent.change(phoneInput, { target: { value: '1234567890' } });

      const data = ref.current?.getData();

      expect(data?.phoneNumber).toBe('1234567890');
    });

    it('should return updated data after changes', () => {
      render(<ContactInfo ref={ref} />);

      const phoneInput = screen.getByLabelText('CREATE_PATIENT_PHONE_NUMBER');

      fireEvent.change(phoneInput, { target: { value: '1111111111' } });
      let data = ref.current?.getData();
      expect(data?.phoneNumber).toBe('1111111111');

      fireEvent.change(phoneInput, { target: { value: '2222222222' } });
      data = ref.current?.getData();
      expect(data?.phoneNumber).toBe('2222222222');
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
          },
        ],
        isLoading: false,
        error: null,
      });

      mockUseRegistrationConfig.mockReturnValue({
        registrationConfig: {
          patientInformation: {
            contactInformation: {
              translationKey: 'CREATE_PATIENT_SECTION_CONTACT_INFO',
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

      render(<ContactInfo ref={ref} />);

      expect(screen.getByLabelText('CUSTOM_FIELD_LABEL')).toBeInTheDocument();
    });
  });
});
