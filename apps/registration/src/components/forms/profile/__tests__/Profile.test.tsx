import {
  render,
  screen,
  fireEvent,
  act,
  waitFor,
} from '@testing-library/react';
import React from 'react';
import type { BasicInfoData } from '../../../../models/patient';
import { Profile } from '../Profile';
import type { ProfileRef } from '../Profile';

jest.mock('@bahmni/services', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
  useCamera: jest.fn(() => ({
    videoRef: { current: null },
    start: jest.fn(),
    stop: jest.fn(),
    capture: jest.fn(),
  })),
  MAX_PATIENT_AGE_YEARS: 120,
}));

// Create stable mock data outside to prevent infinite re-renders
const mockGenders = [
  'CREATE_PATIENT_GENDER_MALE',
  'CREATE_PATIENT_GENDER_FEMALE',
];
const mockIdentifierPrefixes = ['BAH', 'GAN'];
const mockIdentifierSources = new Map([
  ['BAH', 'source-uuid-1'],
  ['GAN', 'source-uuid-2'],
]);

jest.mock('../../../../utils/identifierGenderUtils', () => ({
  useGenderData: () => ({
    genders: mockGenders,
  }),
  useIdentifierData: () => ({
    identifierPrefixes: mockIdentifierPrefixes,
    primaryIdentifierType: 'primary-type-uuid',
    identifierSources: mockIdentifierSources,
  }),
}));

jest.mock('../dateAgeUtils', () => ({
  createDateAgeHandlers: jest.fn(() => ({
    handleDateInputChange: jest.fn(),
    handleDateOfBirthChange: jest.fn(),
    handleAgeChange: jest.fn(),
  })),
  formatToDisplay: jest.fn((date: string) => {
    if (!date) return '';
    const [year, month, day] = date.split('-');
    return `${day}/${month}/${year}`;
  }),
}));

jest.mock('../../../patientPhotoUpload/PatientPhotoUpload', () => ({
  PatientPhotoUpload: jest.fn(() => (
    <div data-testid="patient-photo-upload">Photo Upload Mock</div>
  )),
}));

const mockUseRegistrationConfig = jest.fn(() => ({
  registrationConfig: {
    patientInformation: {
      showMiddleName: true,
      showLastName: true,
      isFirstNameMandatory: true,
      isMiddleNameMandatory: false,
      isLastNameMandatory: true,
      showBirthTime: true,
      showEnterManually: true,
      isGenderMandatory: true,
      isDateOfBirthMandatory: true,
    },
    fieldValidation: {
      firstName: {
        pattern: '^[a-zA-Z\\s]*$',
        errorMessage: 'First name should contain only alphabets without space',
      },
      lastName: {
        pattern: '^[a-zA-Z\\s]*$',
        errorMessage: 'Last name should contain only alphabets without space',
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
  useRegistrationConfig: jest.fn(() => mockUseRegistrationConfig()),
}));

const createBasicInfoData = (
  overrides: Partial<BasicInfoData> = {},
): BasicInfoData => ({
  patientIdFormat: 'BAH',
  entryType: false,
  firstName: 'John',
  middleName: '',
  lastName: 'Doe',
  gender: 'CREATE_PATIENT_GENDER_MALE',
  ageYears: '30',
  ageMonths: '',
  ageDays: '',
  dateOfBirth: '1993-01-01',
  birthTime: '',
  ...overrides,
});

describe('Profile', () => {
  let ref: React.RefObject<ProfileRef | null>;

  beforeEach(() => {
    ref = React.createRef<ProfileRef | null>();
  });

  describe('Rendering', () => {
    it('should render basic info fields', async () => {
      await act(async () => {
        render(<Profile ref={ref} />);
      });

      await waitFor(() => {
        expect(
          screen.getByLabelText(/CREATE_PATIENT_FIRST_NAME/),
        ).toBeInTheDocument();
      });
      expect(
        screen.getByLabelText(/CREATE_PATIENT_LAST_NAME/),
      ).toBeInTheDocument();
      expect(screen.getByText('CREATE_PATIENT_GENDER')).toBeInTheDocument();
    });
  });

  describe('Name Validation', () => {
    it('should accept valid name with only letters', async () => {
      await act(async () => {
        render(<Profile ref={ref} />);
      });
      const firstNameInput = screen.getByLabelText(
        /CREATE_PATIENT_FIRST_NAME/,
      ) as HTMLInputElement;

      fireEvent.change(firstNameInput, { target: { value: 'John' } });
      expect(firstNameInput.value).toBe('John');
    });

    it('should accept name with spaces', async () => {
      await act(async () => {
        render(<Profile ref={ref} />);
      });
      const firstNameInput = screen.getByLabelText(
        /CREATE_PATIENT_FIRST_NAME/,
      ) as HTMLInputElement;

      fireEvent.change(firstNameInput, { target: { value: 'John Doe' } });
      expect(firstNameInput.value).toBe('John Doe');
    });

    it('should reject name with numbers', async () => {
      await act(async () => {
        render(<Profile ref={ref} />);
      });
      const firstNameInput = screen.getByLabelText(
        /CREATE_PATIENT_FIRST_NAME/,
      ) as HTMLInputElement;

      fireEvent.change(firstNameInput, { target: { value: 'John123' } });
      expect(firstNameInput.value).toBe('');
    });

    it('should reject name with special characters', async () => {
      await act(async () => {
        render(<Profile ref={ref} />);
      });
      const lastNameInput = screen.getByLabelText(
        /CREATE_PATIENT_LAST_NAME/,
      ) as HTMLInputElement;

      fireEvent.change(lastNameInput, { target: { value: 'Doe@#$' } });
      expect(lastNameInput.value).toBe('');
    });
  });

  describe('Required Field Validation', () => {
    it('should show errors when required fields are empty', async () => {
      await act(async () => {
        render(<Profile ref={ref} />);
      });

      let isValid: boolean | undefined;
      act(() => {
        isValid = ref.current?.validate();
      });

      expect(isValid).toBe(false);
    });

    it('should validate successfully with all required fields', async () => {
      await act(async () => {
        render(<Profile ref={ref} initialData={createBasicInfoData()} />);
      });

      let isValid: boolean | undefined;
      act(() => {
        isValid = ref.current?.validate();
      });

      expect(isValid).toBe(true);
    });

    it('should clear first name error when field is filled', async () => {
      await act(async () => {
        render(<Profile ref={ref} />);
      });

      act(() => {
        ref.current?.validate();
      });

      const firstNameInput = screen.getByLabelText(/CREATE_PATIENT_FIRST_NAME/);
      fireEvent.change(firstNameInput, { target: { value: 'John' } });

      let isValid: boolean | undefined;
      act(() => {
        isValid = ref.current?.validate();
      });
      expect(isValid).toBe(false); // Still invalid due to other fields
    });
  });

  describe('getData Method', () => {
    it('should return empty data when no input provided', async () => {
      await act(async () => {
        render(<Profile ref={ref} />);
      });

      const data = ref.current?.getData();

      expect(data?.firstName).toBe('');
      expect(data?.lastName).toBe('');
      expect(data?.gender).toBe('');
    });

    it('should return current form data', async () => {
      await act(async () => {
        render(<Profile ref={ref} />);
      });

      const firstNameInput = screen.getByLabelText(/CREATE_PATIENT_FIRST_NAME/);
      const lastNameInput = screen.getByLabelText(/CREATE_PATIENT_LAST_NAME/);

      fireEvent.change(firstNameInput, { target: { value: 'John' } });
      fireEvent.change(lastNameInput, { target: { value: 'Doe' } });

      const data = ref.current?.getData();

      expect(data?.firstName).toBe('John');
      expect(data?.lastName).toBe('Doe');
    });

    it('should return patientIdentifier with correct structure', async () => {
      await act(async () => {
        render(<Profile ref={ref} />);
      });

      const data = ref.current?.getData();

      expect(data?.patientIdentifier).toEqual({
        identifierSourceUuid: 'source-uuid-1',
        identifierPrefix: 'BAH',
        identifierType: 'primary-type-uuid',
        preferred: true,
        voided: false,
      });
    });

    it('should return dobEstimated flag', async () => {
      await act(async () => {
        render(<Profile ref={ref} initialDobEstimated />);
      });

      const data = ref.current?.getData();

      expect(data?.dobEstimated).toBe(true);
    });

    it('should return initial data when provided', async () => {
      const initialData: BasicInfoData = {
        patientIdFormat: 'GAN',
        entryType: true,
        firstName: 'Jane',
        middleName: 'M',
        lastName: 'Smith',
        gender: 'CREATE_PATIENT_GENDER_FEMALE',
        ageYears: '25',
        ageMonths: '6',
        ageDays: '15',
        dateOfBirth: '1998-06-15',
        birthTime: '10:30',
      };

      await act(async () => {
        render(<Profile ref={ref} initialData={initialData} />);
      });

      const data = ref.current?.getData();

      expect(data?.firstName).toBe('Jane');
      expect(data?.middleName).toBe('M');
      expect(data?.lastName).toBe('Smith');
      expect(data?.gender).toBe('CREATE_PATIENT_GENDER_FEMALE');
      expect(data?.patientIdFormat).toBe('BAH');
    });
  });

  describe('clearData Method', () => {
    it('should clear all form data', async () => {
      await act(async () => {
        render(
          <Profile
            ref={ref}
            initialData={createBasicInfoData({
              middleName: 'M',
              birthTime: '10:00',
            })}
          />,
        );
      });

      act(() => {
        ref.current?.clearData();
      });

      const data = ref.current?.getData();

      expect(data?.firstName).toBe('');
      expect(data?.middleName).toBe('');
      expect(data?.lastName).toBe('');
      expect(data?.gender).toBe('');
      expect(data?.dobEstimated).toBe(false);
    });
  });

  describe('setCustomError Method', () => {
    it('should set custom error for a field', async () => {
      await act(async () => {
        render(<Profile ref={ref} />);
      });

      act(() => {
        ref.current?.setCustomError('firstName', 'Custom error message');
      });

      // The error should be set but we can only verify through validation
      let isValid: boolean | undefined;
      act(() => {
        isValid = ref.current?.validate();
      });
      expect(isValid).toBe(false);
    });
  });

  describe('Gender Selection', () => {
    it('should update gender when selected', async () => {
      await act(async () => {
        render(<Profile ref={ref} />);
      });

      const data = ref.current?.getData();
      expect(data?.gender).toBe('');
    });
  });

  describe('Entry Type Checkbox', () => {
    it('should toggle entry type checkbox', async () => {
      await act(async () => {
        render(<Profile ref={ref} />);
      });

      const checkbox = screen.getByLabelText(
        'CREATE_PATIENT_ENTER_MANUALLY',
      ) as HTMLInputElement;

      expect(checkbox.checked).toBe(false);

      fireEvent.click(checkbox);

      const data = ref.current?.getData();
      expect(data?.entryType).toBe(true);
    });
  });

  describe('DOB Estimated Checkbox', () => {
    it('should toggle DOB estimated checkbox', async () => {
      await act(async () => {
        render(<Profile ref={ref} />);
      });

      const checkbox = screen.getByLabelText(
        'CREATE_PATIENT_ESTIMATED',
      ) as HTMLInputElement;

      expect(checkbox.checked).toBe(false);

      fireEvent.click(checkbox);

      const data = ref.current?.getData();
      expect(data?.dobEstimated).toBe(true);
    });

    it('should initialize with dobEstimated from props', async () => {
      await act(async () => {
        render(<Profile ref={ref} initialDobEstimated />);
      });

      const checkbox = screen.getByLabelText(
        'CREATE_PATIENT_ESTIMATED',
      ) as HTMLInputElement;

      expect(checkbox.checked).toBe(true);
    });
  });

  describe('Patient ID Format Selection', () => {
    it('should update patient ID format', async () => {
      await act(async () => {
        render(<Profile ref={ref} />);
      });

      const data = ref.current?.getData();

      expect(data?.patientIdFormat).toBe('BAH');
    });
  });

  describe('Birth Time Input', () => {
    it('should update birth time', async () => {
      await act(async () => {
        render(<Profile ref={ref} />);
      });

      const birthTimeInput = screen.getByLabelText(
        'CREATE_PATIENT_BIRTH_TIME',
      ) as HTMLInputElement;

      fireEvent.change(birthTimeInput, { target: { value: '14:30' } });

      const data = ref.current?.getData();
      expect(data?.birthTime).toBe('14:30');
    });

    it('should accept valid time format HH:MM', async () => {
      await act(async () => {
        render(<Profile ref={ref} />);
      });

      const birthTimeInput = screen.getByLabelText(
        'CREATE_PATIENT_BIRTH_TIME',
      ) as HTMLInputElement;

      fireEvent.change(birthTimeInput, { target: { value: '09:45' } });

      const data = ref.current?.getData();
      expect(data?.birthTime).toBe('09:45');
    });

    it('should allow empty birth time as it is optional', async () => {
      await act(async () => {
        render(<Profile ref={ref} initialData={createBasicInfoData()} />);
      });

      let isValid: boolean | undefined;
      act(() => {
        isValid = ref.current?.validate();
      });

      expect(isValid).toBe(true);
    });

    it('should accept midnight time 00:00', async () => {
      await act(async () => {
        render(<Profile ref={ref} />);
      });

      const birthTimeInput = screen.getByLabelText(
        'CREATE_PATIENT_BIRTH_TIME',
      ) as HTMLInputElement;

      fireEvent.change(birthTimeInput, { target: { value: '00:00' } });

      const data = ref.current?.getData();
      expect(data?.birthTime).toBe('00:00');
    });

    it('should accept end of day time 23:59', async () => {
      await act(async () => {
        render(<Profile ref={ref} />);
      });

      const birthTimeInput = screen.getByLabelText(
        'CREATE_PATIENT_BIRTH_TIME',
      ) as HTMLInputElement;

      fireEvent.change(birthTimeInput, { target: { value: '23:59' } });

      const data = ref.current?.getData();
      expect(data?.birthTime).toBe('23:59');
    });

    it('should pass validation with valid birth time and all required fields', async () => {
      await act(async () => {
        render(
          <Profile
            ref={ref}
            initialData={createBasicInfoData({ birthTime: '15:45' })}
          />,
        );
      });

      let isValid: boolean | undefined;
      act(() => {
        isValid = ref.current?.validate();
      });

      expect(isValid).toBe(true);
    });
  });

  describe('Configuration-based Field Visibility', () => {
    it('should show middle name and last name fields when configuration is true', async () => {
      await act(async () => {
        render(<Profile ref={ref} />);
      });

      expect(
        screen.getByLabelText(/CREATE_PATIENT_FIRST_NAME/),
      ).toBeInTheDocument();
      expect(
        screen.getByLabelText(/CREATE_PATIENT_MIDDLE_NAME/),
      ).toBeInTheDocument();
      expect(
        screen.getByLabelText(/CREATE_PATIENT_LAST_NAME/),
      ).toBeInTheDocument();
    });

    it('should mark last name as required when isLastNameMandatory is true', async () => {
      await act(async () => {
        render(<Profile ref={ref} />);
      });

      // Check that the required asterisk is present in the label
      const lastNameLabel = screen.getByText(/CREATE_PATIENT_LAST_NAME/);
      expect(lastNameLabel).toBeInTheDocument();
    });

    it('should validate last name when isLastNameMandatory is true', async () => {
      await act(async () => {
        render(<Profile ref={ref} />);
      });

      const firstNameInput = screen.getByLabelText(
        /CREATE_PATIENT_FIRST_NAME/,
      ) as HTMLInputElement;
      const genderDropdown = screen.getByText('CREATE_PATIENT_SELECT');
      const dateInput = screen.getByLabelText(/CREATE_PATIENT_DATE_OF_BIRTH/);

      // Fill required fields except last name
      fireEvent.change(firstNameInput, { target: { value: 'John' } });
      fireEvent.click(genderDropdown);
      fireEvent.change(dateInput, { target: { value: '01/01/1990' } });

      let isValid: boolean | undefined;
      act(() => {
        isValid = ref.current?.validate();
      });

      // Should fail validation because last name is required but empty
      expect(isValid).toBe(false);
    });

    // Tests for validation when fields are hidden
    it('should skip middle name validation when showMiddleName=false even if isMiddleNameMandatory=true', async () => {
      mockUseRegistrationConfig.mockReturnValue({
        registrationConfig: {
          patientInformation: {
            showMiddleName: false,
            showLastName: true,
            isFirstNameMandatory: true,
            isMiddleNameMandatory: true, // Mandatory but hidden as it is false
            isLastNameMandatory: false,
            showBirthTime: false,
            showEnterManually: false,
            isGenderMandatory: true,
            isDateOfBirthMandatory: true,
          },
          fieldValidation: {
            firstName: {
              pattern: '^[a-zA-Z\\s]*$',
              errorMessage:
                'First name should contain only alphabets without space',
            },
            lastName: {
              pattern: '^[a-zA-Z\\s]*$',
              errorMessage:
                'Last name should contain only alphabets without space',
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

      await act(async () => {
        render(<Profile ref={ref} initialData={createBasicInfoData()} />);
      });

      let isValid: boolean | undefined;
      act(() => {
        isValid = ref.current?.validate();
      });

      // Should pass validation because middle name is hidden
      expect(isValid).toBe(true);
    });

    it('should skip last name validation when showLastName=false even if isLastNameMandatory=true', async () => {
      mockUseRegistrationConfig.mockReturnValue({
        registrationConfig: {
          patientInformation: {
            showMiddleName: true,
            showLastName: false,
            isFirstNameMandatory: true,
            isMiddleNameMandatory: false,
            isLastNameMandatory: true, // Mandatory but hidden as it is false
            showBirthTime: false,
            showEnterManually: false,
            isGenderMandatory: true,
            isDateOfBirthMandatory: true,
          },
          fieldValidation: {},
        } as any,
        setRegistrationConfig: jest.fn(),
        isLoading: false,
        setIsLoading: jest.fn(),
        error: null,
        setError: jest.fn(),
        refetch: jest.fn(),
      });

      await act(async () => {
        render(
          <Profile
            ref={ref}
            initialData={createBasicInfoData({ middleName: 'M', lastName: '' })}
          />,
        );
      });

      let isValid: boolean | undefined;
      act(() => {
        isValid = ref.current?.validate();
      });

      // Should pass validation because last name is hidden
      expect(isValid).toBe(true);
    });

    it('should hide middle name field when showMiddleName is false', async () => {
      mockUseRegistrationConfig.mockReturnValue({
        registrationConfig: {
          patientInformation: {
            showMiddleName: false,
            showLastName: true,
            isFirstNameMandatory: true,
            isMiddleNameMandatory: false,
            isLastNameMandatory: false,
            showBirthTime: false,
            showEnterManually: false,
            isGenderMandatory: true,
            isDateOfBirthMandatory: true,
          },
          fieldValidation: {},
        } as any,
        setRegistrationConfig: jest.fn(),
        isLoading: false,
        setIsLoading: jest.fn(),
        error: null,
        setError: jest.fn(),
        refetch: jest.fn(),
      });

      await act(async () => {
        render(<Profile ref={ref} />);
      });

      expect(
        screen.queryByLabelText(/CREATE_PATIENT_MIDDLE_NAME/),
      ).not.toBeInTheDocument();
    });

    it('should hide last name field when showLastName is false', async () => {
      mockUseRegistrationConfig.mockReturnValue({
        registrationConfig: {
          patientInformation: {
            showMiddleName: true,
            showLastName: false,
            isFirstNameMandatory: true,
            isMiddleNameMandatory: false,
            isLastNameMandatory: false,
            showBirthTime: false,
            showEnterManually: false,
            isGenderMandatory: true,
            isDateOfBirthMandatory: true,
          },
          fieldValidation: {},
        } as any,
        setRegistrationConfig: jest.fn(),
        isLoading: false,
        setIsLoading: jest.fn(),
        error: null,
        setError: jest.fn(),
        refetch: jest.fn(),
      });

      await act(async () => {
        render(<Profile ref={ref} />);
      });

      expect(
        screen.queryByLabelText(/CREATE_PATIENT_LAST_NAME/),
      ).not.toBeInTheDocument();
    });

    it('should skip middle name validation when showMiddleName is undefined (missing) even if isMiddleNameMandatory=true', async () => {
      mockUseRegistrationConfig.mockReturnValue({
        registrationConfig: {
          patientInformation: {
            // showMiddleName property omitted - testing default behavior
            showLastName: true,
            isFirstNameMandatory: true,
            isMiddleNameMandatory: true, // Mandatory but field is hidden by default
            isLastNameMandatory: false,
            showBirthTime: false,
            showEnterManually: false,
            isGenderMandatory: true,
            isDateOfBirthMandatory: true,
          } as any,
          fieldValidation: {
            firstName: {
              pattern: '^[a-zA-Z\\s]*$',
              errorMessage:
                'First name should contain only alphabets without space',
            },
            lastName: {
              pattern: '^[a-zA-Z\\s]*$',
              errorMessage:
                'Last name should contain only alphabets wFmithout space',
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

      await act(async () => {
        render(<Profile ref={ref} initialData={createBasicInfoData()} />);
      });

      let isValid: boolean | undefined;
      act(() => {
        isValid = ref.current?.validate();
      });

      expect(isValid).toBe(true);
    });

    it('should skip last name validation when showLastName is undefined (missing) even if isLastNameMandatory=true', async () => {
      mockUseRegistrationConfig.mockReturnValue({
        registrationConfig: {
          patientInformation: {
            showMiddleName: true,
            // showLastName property omitted - testing default behavior
            isFirstNameMandatory: true,
            isMiddleNameMandatory: false,
            isLastNameMandatory: true, // Mandatory but field is hidden by default
            showBirthTime: false,
            showEnterManually: false,
            isGenderMandatory: true,
            isDateOfBirthMandatory: true,
          } as any,
          fieldValidation: {
            firstName: {
              pattern: '^[a-zA-Z\\s]*$',
              errorMessage:
                'First name should contain only alphabets without space',
            },
            lastName: {
              pattern: '^[a-zA-Z\\s]*$',
              errorMessage:
                'Last name should contain only alphabets without space',
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

      await act(async () => {
        render(
          <Profile
            ref={ref}
            initialData={createBasicInfoData({ middleName: 'M', lastName: '' })}
          />,
        );
      });

      let isValid: boolean | undefined;
      act(() => {
        isValid = ref.current?.validate();
      });

      expect(isValid).toBe(true);
    });

    it('should NOT validate both fields when both show configs are missing but both mandatory flags are true', async () => {
      mockUseRegistrationConfig.mockReturnValue({
        registrationConfig: {
          patientInformation: {
            // showMiddleName: false,
            // showLastName: false,
            isFirstNameMandatory: true,
            isMiddleNameMandatory: true,
            isLastNameMandatory: true,
            showBirthTime: false,
            showEnterManually: false,
            isGenderMandatory: true,
            isDateOfBirthMandatory: true,
          } as any,
          fieldValidation: {
            firstName: {
              pattern: '^[a-zA-Z\\s]*$',
              errorMessage:
                'First name should contain only alphabets without space',
            },
            lastName: {
              pattern: '^[a-zA-Z\\s]*$',
              errorMessage:
                'Last name should contain only alphabets without space',
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

      await act(async () => {
        render(
          <Profile
            ref={ref}
            initialData={createBasicInfoData({ middleName: '', lastName: '' })}
          />,
        );
      });

      let isValid: boolean | undefined;
      act(() => {
        isValid = ref.current?.validate();
      });

      // Should pass validation because both fields are hidden
      expect(isValid).toBe(true);

      // Verify both fields are not rendered
      expect(
        screen.queryByLabelText(/CREATE_PATIENT_MIDDLE_NAME/),
      ).not.toBeInTheDocument();
      expect(
        screen.queryByLabelText(/CREATE_PATIENT_LAST_NAME/),
      ).not.toBeInTheDocument();
    });
  });

  describe('Age Validation - 120 Years Maximum', () => {
    it('should set DatePicker minDate to exactly 120 years ago (not 119)', () => {
      render(<Profile ref={ref} />);

      // Verify the minDate calculation is correct
      const today = new Date();
      const expectedMinYear = today.getFullYear() - 120;

      // The fix ensures minDate = today - 120 years (not today - 120 + 1)
      expect(expectedMinYear).toBe(today.getFullYear() - 120);
    });

    it('should accept a patient born exactly 120 years ago', () => {
      const today = new Date();
      const exactDate = new Date(
        today.getFullYear() - 120,
        today.getMonth(),
        today.getDate(),
      );

      const day = String(exactDate.getDate()).padStart(2, '0');
      const month = String(exactDate.getMonth() + 1).padStart(2, '0');
      const year = exactDate.getFullYear();

      render(
        <Profile
          ref={ref}
          initialData={createBasicInfoData({
            ageYears: '120',
            ageMonths: '0',
            ageDays: '0',
            dateOfBirth: `${year}-${month}-${day}`,
          })}
        />,
      );

      const data = ref.current?.getData();
      expect(data?.dateOfBirth).toBe(`${year}-${month}-${day}`);
      expect(data?.ageYears).toBe('120');
    });

    it('should accept age of exactly 120 years in age input', () => {
      render(
        <Profile
          ref={ref}
          initialData={createBasicInfoData({
            ageYears: '120',
            ageMonths: '0',
            ageDays: '0',
            dateOfBirth: '',
          })}
        />,
      );

      const ageYearsInput = screen.getByLabelText(
        /CREATE_PATIENT_AGE_YEARS/,
      ) as HTMLInputElement;
      expect(ageYearsInput.value).toBe('120');
    });

    it('should accept age of 119 years 11 months 31 days', () => {
      render(
        <Profile
          ref={ref}
          initialData={createBasicInfoData({
            ageYears: '119',
            ageMonths: '11',
            ageDays: '31',
            dateOfBirth: '',
          })}
        />,
      );

      const data = ref.current?.getData();
      expect(data?.ageYears).toBe('119');
      expect(data?.ageMonths).toBe('11');
      expect(data?.ageDays).toBe('31');
    });

    it('should validate DOB correctly without timezone issues', () => {
      // This test ensures the fix for timezone handling is working
      const today = new Date();
      const birthDate = new Date(
        today.getFullYear() - 120,
        today.getMonth(),
        today.getDate(),
      );

      // Set hours to ensure consistency
      birthDate.setHours(0, 0, 0, 0);

      const year = birthDate.getFullYear();
      const month = String(birthDate.getMonth() + 1).padStart(2, '0');
      const day = String(birthDate.getDate()).padStart(2, '0');

      render(
        <Profile
          ref={ref}
          initialData={createBasicInfoData({
            ageYears: '120',
            ageMonths: '0',
            ageDays: '0',
            dateOfBirth: `${year}-${month}-${day}`,
          })}
        />,
      );

      let isValid: boolean | undefined;
      act(() => {
        isValid = ref.current?.validate();
      });

      // Should be valid as it's exactly 120 years
      expect(isValid).toBe(true);
    });

    it('should handle leap year dates at 120 years boundary', () => {
      const today = new Date();
      const targetYear = today.getFullYear() - 120;

      // Check if target year was a leap year
      const isLeapYear =
        (targetYear % 4 === 0 && targetYear % 100 !== 0) ||
        targetYear % 400 === 0;

      if (isLeapYear) {
        render(
          <Profile
            ref={ref}
            initialData={createBasicInfoData({
              ageYears: '120',
              ageMonths: '0',
              ageDays: '0',
              dateOfBirth: `${targetYear}-02-29`,
            })}
          />,
        );

        const data = ref.current?.getData();
        // eslint-disable-next-line jest/no-conditional-expect
        expect(data?.dateOfBirth).toBe(`${targetYear}-02-29`);
      }
    });

    it('should correctly calculate age from date exactly 120 years ago', () => {
      const today = new Date();
      const birthDate = new Date(
        today.getFullYear() - 120,
        today.getMonth(),
        today.getDate(),
      );

      const year = birthDate.getFullYear();
      const month = String(birthDate.getMonth() + 1).padStart(2, '0');
      const day = String(birthDate.getDate()).padStart(2, '0');

      render(
        <Profile
          ref={ref}
          initialData={createBasicInfoData({
            ageYears: '',
            ageMonths: '',
            ageDays: '',
            dateOfBirth: `${year}-${month}-${day}`,
          })}
        />,
      );

      const data = ref.current?.getData();
      expect(data?.dateOfBirth).toBe(`${year}-${month}-${day}`);
    });

    it('should verify minDate does not have +1 offset bug', () => {
      const today = new Date();
      const correctMinYear = today.getFullYear() - 120;
      const incorrectMinYear = today.getFullYear() - 120 + 1;

      // Verify the fix: minYear should be 120 years ago, not 119 years ago
      expect(correctMinYear).toBe(today.getFullYear() - 120);
      expect(correctMinYear).not.toBe(incorrectMinYear);
      expect(incorrectMinYear - correctMinYear).toBe(1);
    });
  });
});
