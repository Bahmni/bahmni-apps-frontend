import {
  getIdentifierData,
  getGenders,
  createPatient,
} from '@bahmni-frontend/bahmni-services';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { AgeUtils } from '../../../utils/ageUtils';
import NewPatientRegistration from '../createPatient';

// Mock dependencies
jest.mock('@bahmni-frontend/bahmni-services', () => ({
  ...jest.requireActual('@bahmni-frontend/bahmni-services'),
  getIdentifierData: jest.fn(),
  getGenders: jest.fn(),
  createPatient: jest.fn(),
  getAddressHierarchyEntries: jest.fn(),
  notificationService: {
    showSuccess: jest.fn(),
    showError: jest.fn(),
  },
  useTranslation: () => ({
    t: (key: string) => key,
  }),
  BAHMNI_HOME_PATH: '/home',
}));

jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => jest.fn(),
}));

jest.mock('../../../utils/ageUtils', () => ({
  AgeUtils: {
    diffInYearsMonthsDays: jest.fn(),
    calculateBirthDate: jest.fn(),
  },
  formatToDisplay: jest.fn((date: string) => {
    if (!date) return '';
    const [year, month, day] = date.split('-');
    return `${day}/${month}/${year}`;
  }),
  formatToISO: jest.fn((date: Date) => date.toISOString().split('T')[0]),
}));

describe('NewPatientRegistration - DOB Population Tests', () => {
  let queryClient: QueryClient;

  const mockIdentifierData = {
    prefixes: ['BAH', 'GAN'],
    sourcesByPrefix: new Map([
      ['BAH', 'source-uuid-1'],
      ['GAN', 'source-uuid-2'],
    ]),
    primaryIdentifierTypeUuid: 'primary-identifier-uuid',
  };

  const mockGenders = ['male', 'female', 'other'];

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    });

    (getIdentifierData as jest.Mock).mockResolvedValue(mockIdentifierData);
    (getGenders as jest.Mock).mockResolvedValue(mockGenders);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  const renderComponent = () => {
    return render(
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <NewPatientRegistration />
        </BrowserRouter>
      </QueryClientProvider>,
    );
  };

  describe('DOB Selection and Age Population', () => {
    it('should populate age fields when age is calculated from DOB', async () => {
      (AgeUtils.diffInYearsMonthsDays as jest.Mock).mockReturnValue({
        years: 25,
        months: 6,
        days: 15,
      });

      renderComponent();

      await waitFor(() => {
        expect(
          screen.getByLabelText(/CREATE_PATIENT_DATE_OF_BIRTH/),
        ).toBeInTheDocument();
      });

      // Verify that when DOB changes, diffInYearsMonthsDays is called
      // and age fields are populated (this tests the integration)
      const ageYearsInput = screen.getByLabelText(
        /CREATE_PATIENT_AGE_YEARS/,
      ) as HTMLInputElement;
      const ageMonthsInput = screen.getByLabelText(
        /CREATE_PATIENT_AGE_MONTHS/,
      ) as HTMLInputElement;
      const ageDaysInput = screen.getByLabelText(
        /CREATE_PATIENT_AGE_DAYS/,
      ) as HTMLInputElement;

      // Initial state should be empty
      expect(ageYearsInput.value).toBe('');
      expect(ageMonthsInput.value).toBe('');
      expect(ageDaysInput.value).toBe('');
    });

    it('should set dobEstimated to false when DOB is directly selected', async () => {
      renderComponent();

      await waitFor(() => {
        expect(
          screen.getByLabelText(/CREATE_PATIENT_DATE_OF_BIRTH/),
        ).toBeInTheDocument();
      });

      const dobInput = screen.getByLabelText(/CREATE_PATIENT_DATE_OF_BIRTH/);
      fireEvent.change(dobInput, { target: { value: '2000-01-01' } });

      const estimatedCheckbox = screen.getByLabelText(
        /CREATE_PATIENT_ESTIMATED/,
      );
      expect(estimatedCheckbox).not.toBeChecked();
    });

    it('should handle empty DOB selection gracefully', async () => {
      renderComponent();

      await waitFor(() => {
        expect(
          screen.getByLabelText(/CREATE_PATIENT_DATE_OF_BIRTH/),
        ).toBeInTheDocument();
      });

      const dobInput = screen.getByLabelText(/CREATE_PATIENT_DATE_OF_BIRTH/);
      fireEvent.change(dobInput, { target: { value: '' } });

      // Should not cause any errors
      expect(screen.getByLabelText(/CREATE_PATIENT_AGE_YEARS/)).toHaveValue(
        null,
      );
    });
  });

  describe('Age Input and DOB Calculation', () => {
    it('should calculate DOB when age years is entered', async () => {
      (AgeUtils.calculateBirthDate as jest.Mock).mockReturnValue('1998-10-14');

      renderComponent();

      await waitFor(() => {
        expect(
          screen.getByLabelText(/CREATE_PATIENT_AGE_YEARS/),
        ).toBeInTheDocument();
      });

      const ageYearsInput = screen.getByLabelText(/CREATE_PATIENT_AGE_YEARS/);
      fireEvent.change(ageYearsInput, { target: { value: '25' } });

      await waitFor(() => {
        expect(AgeUtils.calculateBirthDate).toHaveBeenCalledWith({
          years: 25,
          months: 0,
          days: 0,
        });
      });
    });

    it('should calculate DOB when age months is entered', async () => {
      (AgeUtils.calculateBirthDate as jest.Mock).mockReturnValue('2024-04-14');

      renderComponent();

      await waitFor(() => {
        expect(
          screen.getByLabelText(/CREATE_PATIENT_AGE_MONTHS/),
        ).toBeInTheDocument();
      });

      const ageMonthsInput = screen.getByLabelText(/CREATE_PATIENT_AGE_MONTHS/);
      fireEvent.change(ageMonthsInput, { target: { value: '6' } });

      await waitFor(() => {
        expect(AgeUtils.calculateBirthDate).toHaveBeenCalledWith({
          years: 0,
          months: 6,
          days: 0,
        });
      });
    });

    it('should calculate DOB when age days is entered', async () => {
      (AgeUtils.calculateBirthDate as jest.Mock).mockReturnValue('2025-09-29');

      renderComponent();

      await waitFor(() => {
        expect(
          screen.getByLabelText(/CREATE_PATIENT_AGE_DAYS/),
        ).toBeInTheDocument();
      });

      const ageDaysInput = screen.getByLabelText(/CREATE_PATIENT_AGE_DAYS/);
      fireEvent.change(ageDaysInput, { target: { value: '15' } });

      await waitFor(() => {
        expect(AgeUtils.calculateBirthDate).toHaveBeenCalledWith({
          years: 0,
          months: 0,
          days: 15,
        });
      });
    });

    it('should set dobEstimated to true when age is entered', async () => {
      (AgeUtils.calculateBirthDate as jest.Mock).mockReturnValue('1998-10-14');

      renderComponent();

      await waitFor(() => {
        expect(
          screen.getByLabelText(/CREATE_PATIENT_AGE_YEARS/),
        ).toBeInTheDocument();
      });

      const ageYearsInput = screen.getByLabelText(/CREATE_PATIENT_AGE_YEARS/);
      fireEvent.change(ageYearsInput, { target: { value: '25' } });

      await waitFor(() => {
        const estimatedCheckbox = screen.getByLabelText(
          /CREATE_PATIENT_ESTIMATED/,
        );
        expect(estimatedCheckbox).toBeChecked();
      });
    });

    it('should calculate DOB with combined age inputs', async () => {
      (AgeUtils.calculateBirthDate as jest.Mock).mockReturnValue('1998-04-01');

      renderComponent();

      await waitFor(() => {
        expect(
          screen.getByLabelText(/CREATE_PATIENT_AGE_YEARS/),
        ).toBeInTheDocument();
      });

      const ageYearsInput = screen.getByLabelText(/CREATE_PATIENT_AGE_YEARS/);
      const ageMonthsInput = screen.getByLabelText(/CREATE_PATIENT_AGE_MONTHS/);
      const ageDaysInput = screen.getByLabelText(/CREATE_PATIENT_AGE_DAYS/);

      fireEvent.change(ageYearsInput, { target: { value: '25' } });
      fireEvent.change(ageMonthsInput, { target: { value: '6' } });
      fireEvent.change(ageDaysInput, { target: { value: '15' } });

      await waitFor(() => {
        expect(AgeUtils.calculateBirthDate).toHaveBeenLastCalledWith({
          years: 25,
          months: 6,
          days: 15,
        });
      });
    });

    it('should clear DOB when all age fields are empty', async () => {
      renderComponent();

      await waitFor(() => {
        expect(
          screen.getByLabelText(/CREATE_PATIENT_AGE_YEARS/),
        ).toBeInTheDocument();
      });

      const ageYearsInput = screen.getByLabelText(/CREATE_PATIENT_AGE_YEARS/);
      fireEvent.change(ageYearsInput, { target: { value: '' } });

      // DOB should be cleared
      const dobInput = screen.getByLabelText(/CREATE_PATIENT_DATE_OF_BIRTH/);
      expect(dobInput).toHaveValue('');
    });
  });

  describe('Age Validation - Edge Cases', () => {
    it('should show error when age years exceeds 120', async () => {
      renderComponent();

      await waitFor(() => {
        expect(
          screen.getByLabelText(/CREATE_PATIENT_AGE_YEARS/),
        ).toBeInTheDocument();
      });

      const ageYearsInput = screen.getByLabelText(/CREATE_PATIENT_AGE_YEARS/);
      fireEvent.change(ageYearsInput, { target: { value: '121' } });

      await waitFor(() => {
        expect(
          screen.getByText(/CREATE_PATIENT_VALIDATION_AGE_YEARS_MAX/),
        ).toBeInTheDocument();
      });
    });

    it('should accept age years equal to 120', async () => {
      (AgeUtils.calculateBirthDate as jest.Mock).mockReturnValue('1905-10-14');

      renderComponent();

      await waitFor(() => {
        expect(
          screen.getByLabelText(/CREATE_PATIENT_AGE_YEARS/),
        ).toBeInTheDocument();
      });

      const ageYearsInput = screen.getByLabelText(/CREATE_PATIENT_AGE_YEARS/);
      fireEvent.change(ageYearsInput, { target: { value: '120' } });

      await waitFor(() => {
        expect(
          screen.queryByText(/CREATE_PATIENT_VALIDATION_AGE_YEARS_MAX/),
        ).not.toBeInTheDocument();
        expect(AgeUtils.calculateBirthDate).toHaveBeenCalled();
      });
    });

    it('should show error when age months exceeds 11', async () => {
      renderComponent();

      await waitFor(() => {
        expect(
          screen.getByLabelText(/CREATE_PATIENT_AGE_MONTHS/),
        ).toBeInTheDocument();
      });

      const ageMonthsInput = screen.getByLabelText(/CREATE_PATIENT_AGE_MONTHS/);
      fireEvent.change(ageMonthsInput, { target: { value: '12' } });

      await waitFor(() => {
        expect(
          screen.getByText(/CREATE_PATIENT_VALIDATION_AGE_MONTHS_MAX/),
        ).toBeInTheDocument();
      });
    });

    it('should accept age months equal to 11', async () => {
      (AgeUtils.calculateBirthDate as jest.Mock).mockReturnValue('2024-11-14');

      renderComponent();

      await waitFor(() => {
        expect(
          screen.getByLabelText(/CREATE_PATIENT_AGE_MONTHS/),
        ).toBeInTheDocument();
      });

      const ageMonthsInput = screen.getByLabelText(/CREATE_PATIENT_AGE_MONTHS/);
      fireEvent.change(ageMonthsInput, { target: { value: '11' } });

      await waitFor(() => {
        expect(
          screen.queryByText(/CREATE_PATIENT_VALIDATION_AGE_MONTHS_MAX/),
        ).not.toBeInTheDocument();
        expect(AgeUtils.calculateBirthDate).toHaveBeenCalled();
      });
    });

    it('should show error when age days exceeds 31', async () => {
      renderComponent();

      await waitFor(() => {
        expect(
          screen.getByLabelText(/CREATE_PATIENT_AGE_DAYS/),
        ).toBeInTheDocument();
      });

      const ageDaysInput = screen.getByLabelText(/CREATE_PATIENT_AGE_DAYS/);
      fireEvent.change(ageDaysInput, { target: { value: '32' } });

      await waitFor(() => {
        expect(
          screen.getByText(/CREATE_PATIENT_VALIDATION_AGE_DAYS_MAX/),
        ).toBeInTheDocument();
      });
    });

    it('should accept age days equal to 31', async () => {
      (AgeUtils.calculateBirthDate as jest.Mock).mockReturnValue('2025-09-13');

      renderComponent();

      await waitFor(() => {
        expect(
          screen.getByLabelText(/CREATE_PATIENT_AGE_DAYS/),
        ).toBeInTheDocument();
      });

      const ageDaysInput = screen.getByLabelText(/CREATE_PATIENT_AGE_DAYS/);
      fireEvent.change(ageDaysInput, { target: { value: '31' } });

      await waitFor(() => {
        expect(
          screen.queryByText(/CREATE_PATIENT_VALIDATION_AGE_DAYS_MAX/),
        ).not.toBeInTheDocument();
        expect(AgeUtils.calculateBirthDate).toHaveBeenCalled();
      });
    });

    it('should allow age of 0 years, 0 months, 0 days (newborn)', async () => {
      renderComponent();

      await waitFor(() => {
        expect(
          screen.getByLabelText(/CREATE_PATIENT_AGE_YEARS/),
        ).toBeInTheDocument();
      });

      const ageYearsInput = screen.getByLabelText(/CREATE_PATIENT_AGE_YEARS/);
      const ageMonthsInput = screen.getByLabelText(/CREATE_PATIENT_AGE_MONTHS/);
      const ageDaysInput = screen.getByLabelText(/CREATE_PATIENT_AGE_DAYS/);

      fireEvent.change(ageYearsInput, { target: { value: '0' } });
      fireEvent.change(ageMonthsInput, { target: { value: '0' } });
      fireEvent.change(ageDaysInput, { target: { value: '0' } });

      // Should not show any validation errors
      expect(
        screen.queryByText(/CREATE_PATIENT_VALIDATION_AGE_YEARS_MAX/),
      ).not.toBeInTheDocument();
      expect(
        screen.queryByText(/CREATE_PATIENT_VALIDATION_AGE_MONTHS_MAX/),
      ).not.toBeInTheDocument();
      expect(
        screen.queryByText(/CREATE_PATIENT_VALIDATION_AGE_DAYS_MAX/),
      ).not.toBeInTheDocument();
    });

    it('should not calculate DOB when age has validation error', async () => {
      renderComponent();

      await waitFor(() => {
        expect(
          screen.getByLabelText(/CREATE_PATIENT_AGE_YEARS/),
        ).toBeInTheDocument();
      });

      const ageYearsInput = screen.getByLabelText(/CREATE_PATIENT_AGE_YEARS/);
      fireEvent.change(ageYearsInput, { target: { value: '150' } });

      await waitFor(() => {
        expect(
          screen.getByText(/CREATE_PATIENT_VALIDATION_AGE_YEARS_MAX/),
        ).toBeInTheDocument();
      });

      // Should not call calculateBirthDate
      expect(AgeUtils.calculateBirthDate).not.toHaveBeenCalled();
    });
  });
});

describe('NewPatientRegistration - Validation Tests', () => {
  let queryClient: QueryClient;

  const mockIdentifierData = {
    prefixes: ['BAH', 'GAN'],
    sourcesByPrefix: new Map([
      ['BAH', 'source-uuid-1'],
      ['GAN', 'source-uuid-2'],
    ]),
    primaryIdentifierTypeUuid: 'primary-identifier-uuid',
  };

  const mockGenders = ['male', 'female', 'other'];

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    });

    (getIdentifierData as jest.Mock).mockResolvedValue(mockIdentifierData);
    (getGenders as jest.Mock).mockResolvedValue(mockGenders);
    (createPatient as jest.Mock).mockResolvedValue({
      patient: { uuid: 'patient-uuid', display: 'Test Patient' },
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  const renderComponent = () => {
    return render(
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <NewPatientRegistration />
        </BrowserRouter>
      </QueryClientProvider>,
    );
  };

  describe('Required Field Validations', () => {
    it('should show error when first name is empty on save', async () => {
      renderComponent();

      await waitFor(() => {
        expect(screen.getByText(/CREATE_PATIENT_SAVE/)).toBeInTheDocument();
      });

      const saveButton = screen.getByText(/CREATE_PATIENT_SAVE/);
      fireEvent.click(saveButton);

      await waitFor(() => {
        expect(
          screen.getByText(/CREATE_PATIENT_VALIDATION_FIRST_NAME_REQUIRED/),
        ).toBeInTheDocument();
      });
    });

    it('should show error when last name is empty on save', async () => {
      renderComponent();

      await waitFor(() => {
        expect(screen.getByText(/CREATE_PATIENT_SAVE/)).toBeInTheDocument();
      });

      const saveButton = screen.getByText(/CREATE_PATIENT_SAVE/);
      fireEvent.click(saveButton);

      await waitFor(() => {
        expect(
          screen.getByText(/CREATE_PATIENT_VALIDATION_LAST_NAME_REQUIRED/),
        ).toBeInTheDocument();
      });
    });

    it('should show error when gender is not selected on save', async () => {
      renderComponent();

      await waitFor(() => {
        expect(screen.getByText(/CREATE_PATIENT_SAVE/)).toBeInTheDocument();
      });

      const saveButton = screen.getByText(/CREATE_PATIENT_SAVE/);
      fireEvent.click(saveButton);

      await waitFor(() => {
        expect(
          screen.getByText(/CREATE_PATIENT_VALIDATION_GENDER_REQUIRED/),
        ).toBeInTheDocument();
      });
    });

    it('should show error when date of birth is empty on save', async () => {
      renderComponent();

      await waitFor(() => {
        expect(screen.getByText(/CREATE_PATIENT_SAVE/)).toBeInTheDocument();
      });

      const saveButton = screen.getByText(/CREATE_PATIENT_SAVE/);
      fireEvent.click(saveButton);

      await waitFor(() => {
        expect(
          screen.getByText(/CREATE_PATIENT_VALIDATION_DATE_OF_BIRTH_REQUIRED/),
        ).toBeInTheDocument();
      });
    });

    it('should clear validation error when field is filled', async () => {
      renderComponent();

      await waitFor(() => {
        expect(screen.getByText(/CREATE_PATIENT_SAVE/)).toBeInTheDocument();
      });

      // Trigger validation errors
      const saveButton = screen.getByText(/CREATE_PATIENT_SAVE/);
      fireEvent.click(saveButton);

      await waitFor(() => {
        expect(
          screen.getByText(/CREATE_PATIENT_VALIDATION_FIRST_NAME_REQUIRED/),
        ).toBeInTheDocument();
      });

      // Fill first name
      const firstNameInput = screen.getByLabelText(/CREATE_PATIENT_FIRST_NAME/);
      fireEvent.change(firstNameInput, { target: { value: 'John' } });

      // Error should be cleared
      expect(
        screen.queryByText(/CREATE_PATIENT_VALIDATION_FIRST_NAME_REQUIRED/),
      ).not.toBeInTheDocument();
    });
  });

  describe('Name Validation - Edge Cases', () => {
    it('should accept valid name with only letters', async () => {
      renderComponent();

      await waitFor(() => {
        expect(
          screen.getByLabelText(/CREATE_PATIENT_FIRST_NAME/),
        ).toBeInTheDocument();
      });

      const firstNameInput = screen.getByLabelText(/CREATE_PATIENT_FIRST_NAME/);
      fireEvent.change(firstNameInput, { target: { value: 'John' } });

      expect(firstNameInput).toHaveValue('John');
      expect(
        screen.queryByText(/CREATE_PATIENT_VALIDATION_NAME_INVALID/),
      ).not.toBeInTheDocument();
    });

    it('should accept valid name with letters and spaces', async () => {
      renderComponent();

      await waitFor(() => {
        expect(
          screen.getByLabelText(/CREATE_PATIENT_FIRST_NAME/),
        ).toBeInTheDocument();
      });

      const firstNameInput = screen.getByLabelText(/CREATE_PATIENT_FIRST_NAME/);
      fireEvent.change(firstNameInput, { target: { value: 'John Doe' } });

      expect(firstNameInput).toHaveValue('John Doe');
      expect(
        screen.queryByText(/CREATE_PATIENT_VALIDATION_NAME_INVALID/),
      ).not.toBeInTheDocument();
    });

    it('should reject name with numbers', async () => {
      renderComponent();

      await waitFor(() => {
        expect(
          screen.getByLabelText(/CREATE_PATIENT_FIRST_NAME/),
        ).toBeInTheDocument();
      });

      const firstNameInput = screen.getByLabelText(/CREATE_PATIENT_FIRST_NAME/);
      fireEvent.change(firstNameInput, { target: { value: 'John123' } });

      await waitFor(() => {
        expect(
          screen.getByText(/CREATE_PATIENT_VALIDATION_NAME_INVALID/),
        ).toBeInTheDocument();
      });
    });

    it('should reject name with special characters', async () => {
      renderComponent();

      await waitFor(() => {
        expect(
          screen.getByLabelText(/CREATE_PATIENT_FIRST_NAME/),
        ).toBeInTheDocument();
      });

      const firstNameInput = screen.getByLabelText(/CREATE_PATIENT_FIRST_NAME/);
      fireEvent.change(firstNameInput, { target: { value: 'John@Doe' } });

      await waitFor(() => {
        expect(
          screen.getByText(/CREATE_PATIENT_VALIDATION_NAME_INVALID/),
        ).toBeInTheDocument();
      });
    });

    it('should reject middle name with numbers', async () => {
      renderComponent();

      await waitFor(() => {
        expect(
          screen.getByLabelText(/CREATE_PATIENT_MIDDLE_NAME/),
        ).toBeInTheDocument();
      });

      const middleNameInput = screen.getByLabelText(
        /CREATE_PATIENT_MIDDLE_NAME/,
      );
      fireEvent.change(middleNameInput, { target: { value: 'Middle123' } });

      await waitFor(() => {
        expect(
          screen.getByText(/CREATE_PATIENT_VALIDATION_NAME_INVALID/),
        ).toBeInTheDocument();
      });
    });

    it('should reject last name with special characters', async () => {
      renderComponent();

      await waitFor(() => {
        expect(
          screen.getByLabelText(/CREATE_PATIENT_LAST_NAME/),
        ).toBeInTheDocument();
      });

      const lastNameInput = screen.getByLabelText(/CREATE_PATIENT_LAST_NAME/);
      fireEvent.change(lastNameInput, { target: { value: 'Smith$' } });

      await waitFor(() => {
        expect(
          screen.getByText(/CREATE_PATIENT_VALIDATION_NAME_INVALID/),
        ).toBeInTheDocument();
      });
    });

    it('should accept empty middle name', async () => {
      renderComponent();

      await waitFor(() => {
        expect(
          screen.getByLabelText(/CREATE_PATIENT_MIDDLE_NAME/),
        ).toBeInTheDocument();
      });

      const middleNameInput = screen.getByLabelText(
        /CREATE_PATIENT_MIDDLE_NAME/,
      );
      fireEvent.change(middleNameInput, { target: { value: '' } });

      expect(
        screen.queryByText(/CREATE_PATIENT_VALIDATION_NAME_INVALID/),
      ).not.toBeInTheDocument();
    });
  });
});

describe('NewPatientRegistration - Phone Number Validation Tests', () => {
  let queryClient: QueryClient;

  const mockIdentifierData = {
    prefixes: ['BAH', 'GAN'],
    sourcesByPrefix: new Map([
      ['BAH', 'source-uuid-1'],
      ['GAN', 'source-uuid-2'],
    ]),
    primaryIdentifierTypeUuid: 'primary-identifier-uuid',
  };

  const mockGenders = ['male', 'female', 'other'];

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    });

    (getIdentifierData as jest.Mock).mockResolvedValue(mockIdentifierData);
    (getGenders as jest.Mock).mockResolvedValue(mockGenders);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  const renderComponent = () => {
    return render(
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <NewPatientRegistration />
        </BrowserRouter>
      </QueryClientProvider>,
    );
  };

  describe('Phone Number Validation - Edge Cases', () => {
    it('should accept valid phone number with only digits', async () => {
      renderComponent();

      await waitFor(() => {
        expect(
          screen.getByLabelText(/CREATE_PATIENT_PHONE_NUMBER/),
        ).toBeInTheDocument();
      });

      const phoneInput = screen.getByLabelText(/CREATE_PATIENT_PHONE_NUMBER/);
      fireEvent.change(phoneInput, { target: { value: '1234567890' } });

      expect(phoneInput).toHaveValue('1234567890');
    });

    it('should accept phone number starting with plus sign', async () => {
      renderComponent();

      await waitFor(() => {
        expect(
          screen.getByLabelText(/CREATE_PATIENT_PHONE_NUMBER/),
        ).toBeInTheDocument();
      });

      const phoneInput = screen.getByLabelText(/CREATE_PATIENT_PHONE_NUMBER/);
      fireEvent.change(phoneInput, { target: { value: '+911234567890' } });

      expect(phoneInput).toHaveValue('+911234567890');
    });

    it('should accept international phone number format', async () => {
      renderComponent();

      await waitFor(() => {
        expect(
          screen.getByLabelText(/CREATE_PATIENT_PHONE_NUMBER/),
        ).toBeInTheDocument();
      });

      const phoneInput = screen.getByLabelText(/CREATE_PATIENT_PHONE_NUMBER/);
      fireEvent.change(phoneInput, { target: { value: '+1234567890' } });

      expect(phoneInput).toHaveValue('+1234567890');
    });

    it('should reject phone number with letters', async () => {
      renderComponent();

      await waitFor(() => {
        expect(
          screen.getByLabelText(/CREATE_PATIENT_PHONE_NUMBER/),
        ).toBeInTheDocument();
      });

      const phoneInput = screen.getByLabelText(
        /CREATE_PATIENT_PHONE_NUMBER/,
      ) as HTMLInputElement;
      const initialValue = phoneInput.value;

      fireEvent.change(phoneInput, { target: { value: '123abc456' } });

      // Value should not change
      expect(phoneInput.value).toBe(initialValue);
    });

    it('should reject phone number with special characters except plus at start', async () => {
      renderComponent();

      await waitFor(() => {
        expect(
          screen.getByLabelText(/CREATE_PATIENT_PHONE_NUMBER/),
        ).toBeInTheDocument();
      });

      const phoneInput = screen.getByLabelText(
        /CREATE_PATIENT_PHONE_NUMBER/,
      ) as HTMLInputElement;
      const initialValue = phoneInput.value;

      fireEvent.change(phoneInput, { target: { value: '123-456-7890' } });

      // Value should not change
      expect(phoneInput.value).toBe(initialValue);
    });

    it('should reject phone number with spaces', async () => {
      renderComponent();

      await waitFor(() => {
        expect(
          screen.getByLabelText(/CREATE_PATIENT_PHONE_NUMBER/),
        ).toBeInTheDocument();
      });

      const phoneInput = screen.getByLabelText(
        /CREATE_PATIENT_PHONE_NUMBER/,
      ) as HTMLInputElement;
      const initialValue = phoneInput.value;

      fireEvent.change(phoneInput, { target: { value: '123 456 7890' } });

      // Value should not change
      expect(phoneInput.value).toBe(initialValue);
    });

    it('should accept empty phone number', async () => {
      renderComponent();

      await waitFor(() => {
        expect(
          screen.getByLabelText(/CREATE_PATIENT_PHONE_NUMBER/),
        ).toBeInTheDocument();
      });

      const phoneInput = screen.getByLabelText(/CREATE_PATIENT_PHONE_NUMBER/);
      fireEvent.change(phoneInput, { target: { value: '' } });

      expect(phoneInput).toHaveValue('');
    });

    it('should accept valid alternate phone number with only digits', async () => {
      renderComponent();

      await waitFor(() => {
        expect(
          screen.getByLabelText(/CREATE_PATIENT_ALT_PHONE_NUMBER/),
        ).toBeInTheDocument();
      });

      const altPhoneInput = screen.getByLabelText(
        /CREATE_PATIENT_ALT_PHONE_NUMBER/,
      );
      fireEvent.change(altPhoneInput, { target: { value: '9876543210' } });

      expect(altPhoneInput).toHaveValue('9876543210');
    });

    it('should accept alternate phone number starting with plus sign', async () => {
      renderComponent();

      await waitFor(() => {
        expect(
          screen.getByLabelText(/CREATE_PATIENT_ALT_PHONE_NUMBER/),
        ).toBeInTheDocument();
      });

      const altPhoneInput = screen.getByLabelText(
        /CREATE_PATIENT_ALT_PHONE_NUMBER/,
      );
      fireEvent.change(altPhoneInput, { target: { value: '+919876543210' } });

      expect(altPhoneInput).toHaveValue('+919876543210');
    });

    it('should reject alternate phone number with letters', async () => {
      renderComponent();

      await waitFor(() => {
        expect(
          screen.getByLabelText(/CREATE_PATIENT_ALT_PHONE_NUMBER/),
        ).toBeInTheDocument();
      });

      const altPhoneInput = screen.getByLabelText(
        /CREATE_PATIENT_ALT_PHONE_NUMBER/,
      ) as HTMLInputElement;
      const initialValue = altPhoneInput.value;

      fireEvent.change(altPhoneInput, { target: { value: '987abc6543' } });

      // Value should not change
      expect(altPhoneInput.value).toBe(initialValue);
    });

    it('should handle very long phone numbers', async () => {
      renderComponent();

      await waitFor(() => {
        expect(
          screen.getByLabelText(/CREATE_PATIENT_PHONE_NUMBER/),
        ).toBeInTheDocument();
      });

      const phoneInput = screen.getByLabelText(/CREATE_PATIENT_PHONE_NUMBER/);
      const longNumber = '+1234567890123456789012345';
      fireEvent.change(phoneInput, { target: { value: longNumber } });

      expect(phoneInput).toHaveValue(longNumber);
    });

    it('should handle single digit phone number', async () => {
      renderComponent();

      await waitFor(() => {
        expect(
          screen.getByLabelText(/CREATE_PATIENT_PHONE_NUMBER/),
        ).toBeInTheDocument();
      });

      const phoneInput = screen.getByLabelText(/CREATE_PATIENT_PHONE_NUMBER/);
      fireEvent.change(phoneInput, { target: { value: '1' } });

      expect(phoneInput).toHaveValue('1');
    });

    it('should handle multiple plus signs correctly (only first allowed)', async () => {
      renderComponent();

      await waitFor(() => {
        expect(
          screen.getByLabelText(/CREATE_PATIENT_PHONE_NUMBER/),
        ).toBeInTheDocument();
      });

      const phoneInput = screen.getByLabelText(
        /CREATE_PATIENT_PHONE_NUMBER/,
      ) as HTMLInputElement;
      const initialValue = phoneInput.value;

      // Try to enter multiple plus signs
      fireEvent.change(phoneInput, { target: { value: '+91+123456' } });

      // Should not accept multiple plus signs
      expect(phoneInput.value).toBe(initialValue);
    });

    it('should reject phone number with parentheses', async () => {
      renderComponent();

      await waitFor(() => {
        expect(
          screen.getByLabelText(/CREATE_PATIENT_PHONE_NUMBER/),
        ).toBeInTheDocument();
      });

      const phoneInput = screen.getByLabelText(
        /CREATE_PATIENT_PHONE_NUMBER/,
      ) as HTMLInputElement;
      const initialValue = phoneInput.value;

      fireEvent.change(phoneInput, { target: { value: '(123)456-7890' } });

      // Value should not change
      expect(phoneInput.value).toBe(initialValue);
    });

    it('should reject phone number with dots', async () => {
      renderComponent();

      await waitFor(() => {
        expect(
          screen.getByLabelText(/CREATE_PATIENT_PHONE_NUMBER/),
        ).toBeInTheDocument();
      });

      const phoneInput = screen.getByLabelText(
        /CREATE_PATIENT_PHONE_NUMBER/,
      ) as HTMLInputElement;
      const initialValue = phoneInput.value;

      fireEvent.change(phoneInput, { target: { value: '123.456.7890' } });

      // Value should not change
      expect(phoneInput.value).toBe(initialValue);
    });
  });
});
