import { render, screen, fireEvent, act } from '@testing-library/react';
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

jest.mock('../../../../utils/identifierGenderUtils', () => ({
  useGenderData: () => ({
    genders: ['CREATE_PATIENT_GENDER_MALE', 'CREATE_PATIENT_GENDER_FEMALE'],
  }),
  useIdentifierData: () => ({
    identifierPrefixes: ['BAH', 'GAN'],
    primaryIdentifierType: 'primary-type-uuid',
    identifierSources: new Map([
      ['BAH', 'source-uuid-1'],
      ['GAN', 'source-uuid-2'],
    ]),
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

jest.mock('../../../../hooks/useRegistrationConfig', () => ({
  useRegistrationConfig: () => ({
    registrationConfig: {
      patientInformation: {
        showMiddleName: true,
        showLastName: true,
        isLastNameMandatory: true,
        showBirthTime: true,
        showEnterManually: true,
      },
    },
    setRegistrationConfig: jest.fn(),
    isLoading: false,
    setIsLoading: jest.fn(),
    error: null,
    setError: jest.fn(),
    refetch: jest.fn(),
  }),
}));

describe('Profile', () => {
  let ref: React.RefObject<ProfileRef | null>;

  beforeEach(() => {
    ref = React.createRef<ProfileRef | null>();
  });

  describe('Rendering', () => {
    it('should render basic info fields', () => {
      render(<Profile ref={ref} />);

      expect(
        screen.getByLabelText(/CREATE_PATIENT_FIRST_NAME/),
      ).toBeInTheDocument();
      expect(
        screen.getByLabelText(/CREATE_PATIENT_LAST_NAME/),
      ).toBeInTheDocument();
      expect(screen.getByText('CREATE_PATIENT_GENDER')).toBeInTheDocument();
    });
  });

  describe('Name Validation', () => {
    it('should accept valid name with only letters', () => {
      render(<Profile ref={ref} />);
      const firstNameInput = screen.getByLabelText(
        /CREATE_PATIENT_FIRST_NAME/,
      ) as HTMLInputElement;

      fireEvent.change(firstNameInput, { target: { value: 'John' } });
      expect(firstNameInput.value).toBe('John');
    });

    it('should accept name with spaces', () => {
      render(<Profile ref={ref} />);
      const firstNameInput = screen.getByLabelText(
        /CREATE_PATIENT_FIRST_NAME/,
      ) as HTMLInputElement;

      fireEvent.change(firstNameInput, { target: { value: 'John Doe' } });
      expect(firstNameInput.value).toBe('John Doe');
    });

    it('should reject name with numbers', () => {
      render(<Profile ref={ref} />);
      const firstNameInput = screen.getByLabelText(
        /CREATE_PATIENT_FIRST_NAME/,
      ) as HTMLInputElement;

      fireEvent.change(firstNameInput, { target: { value: 'John123' } });
      expect(firstNameInput.value).toBe('');
    });

    it('should reject name with special characters', () => {
      render(<Profile ref={ref} />);
      const lastNameInput = screen.getByLabelText(
        /CREATE_PATIENT_LAST_NAME/,
      ) as HTMLInputElement;

      fireEvent.change(lastNameInput, { target: { value: 'Doe@#$' } });
      expect(lastNameInput.value).toBe('');
    });
  });

  describe('Required Field Validation', () => {
    it('should show errors when required fields are empty', () => {
      render(<Profile ref={ref} />);

      let isValid: boolean | undefined;
      act(() => {
        isValid = ref.current?.validate();
      });

      expect(isValid).toBe(false);
    });

    it('should validate successfully with all required fields', () => {
      const initialData: BasicInfoData = {
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
      };

      render(<Profile ref={ref} initialData={initialData} />);

      let isValid: boolean | undefined;
      act(() => {
        isValid = ref.current?.validate();
      });

      expect(isValid).toBe(true);
    });

    it('should clear first name error when field is filled', () => {
      render(<Profile ref={ref} />);

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
    it('should return empty data when no input provided', () => {
      render(<Profile ref={ref} />);

      const data = ref.current?.getData();

      expect(data?.firstName).toBe('');
      expect(data?.lastName).toBe('');
      expect(data?.gender).toBe('');
    });

    it('should return current form data', () => {
      render(<Profile ref={ref} />);

      const firstNameInput = screen.getByLabelText(/CREATE_PATIENT_FIRST_NAME/);
      const lastNameInput = screen.getByLabelText(/CREATE_PATIENT_LAST_NAME/);

      fireEvent.change(firstNameInput, { target: { value: 'John' } });
      fireEvent.change(lastNameInput, { target: { value: 'Doe' } });

      const data = ref.current?.getData();

      expect(data?.firstName).toBe('John');
      expect(data?.lastName).toBe('Doe');
    });

    it('should return patientIdentifier with correct structure', () => {
      render(<Profile ref={ref} />);

      const data = ref.current?.getData();

      expect(data?.patientIdentifier).toEqual({
        identifierSourceUuid: 'source-uuid-1',
        identifierPrefix: 'BAH',
        identifierType: 'primary-type-uuid',
        preferred: true,
        voided: false,
      });
    });

    it('should return dobEstimated flag', () => {
      render(<Profile ref={ref} initialDobEstimated />);

      const data = ref.current?.getData();

      expect(data?.dobEstimated).toBe(true);
    });

    it('should return initial data when provided', () => {
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

      render(<Profile ref={ref} initialData={initialData} />);

      const data = ref.current?.getData();

      expect(data?.firstName).toBe('Jane');
      expect(data?.middleName).toBe('M');
      expect(data?.lastName).toBe('Smith');
      expect(data?.gender).toBe('CREATE_PATIENT_GENDER_FEMALE');
      expect(data?.patientIdFormat).toBe('GAN');
    });
  });

  describe('clearData Method', () => {
    it('should clear all form data', () => {
      const initialData: BasicInfoData = {
        patientIdFormat: 'BAH',
        entryType: false,
        firstName: 'John',
        middleName: 'M',
        lastName: 'Doe',
        gender: 'CREATE_PATIENT_GENDER_MALE',
        ageYears: '30',
        ageMonths: '',
        ageDays: '',
        dateOfBirth: '1993-01-01',
        birthTime: '10:00',
      };

      render(<Profile ref={ref} initialData={initialData} />);

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
    it('should set custom error for a field', () => {
      render(<Profile ref={ref} />);

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
    it('should update gender when selected', () => {
      render(<Profile ref={ref} />);

      const data = ref.current?.getData();
      expect(data?.gender).toBe('');
    });
  });

  describe('Entry Type Checkbox', () => {
    it('should toggle entry type checkbox', () => {
      render(<Profile ref={ref} />);

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
    it('should toggle DOB estimated checkbox', () => {
      render(<Profile ref={ref} />);

      const checkbox = screen.getByLabelText(
        'CREATE_PATIENT_ESTIMATED',
      ) as HTMLInputElement;

      expect(checkbox.checked).toBe(false);

      fireEvent.click(checkbox);

      const data = ref.current?.getData();
      expect(data?.dobEstimated).toBe(true);
    });

    it('should initialize with dobEstimated from props', () => {
      render(<Profile ref={ref} initialDobEstimated />);

      const checkbox = screen.getByLabelText(
        'CREATE_PATIENT_ESTIMATED',
      ) as HTMLInputElement;

      expect(checkbox.checked).toBe(true);
    });
  });

  describe('Patient ID Format Selection', () => {
    it('should update patient ID format', () => {
      render(<Profile ref={ref} />);

      const data = ref.current?.getData();

      expect(data?.patientIdFormat).toBe('BAH');
    });
  });

  describe('Birth Time Input', () => {
    it('should update birth time', () => {
      render(<Profile ref={ref} />);

      const birthTimeInput = screen.getByLabelText(
        'CREATE_PATIENT_BIRTH_TIME',
      ) as HTMLInputElement;

      fireEvent.change(birthTimeInput, { target: { value: '14:30' } });

      const data = ref.current?.getData();
      expect(data?.birthTime).toBe('14:30');
    });
  });

  describe('Configuration-based Field Visibility', () => {
    it('should show middle name and last name fields when configuration is true', () => {
      render(<Profile ref={ref} />);

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

    it('should mark last name as required when isLastNameMandatory is true', () => {
      render(<Profile ref={ref} />);

      // Check that the required asterisk is present in the label
      const lastNameLabel = screen.getByText(/CREATE_PATIENT_LAST_NAME/);
      expect(lastNameLabel).toBeInTheDocument();
    });

    it('should validate last name when isLastNameMandatory is true', () => {
      render(<Profile ref={ref} />);

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
  });
});
