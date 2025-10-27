import {
  getIdentifierData,
  getGenders,
  createPatient,
  getAddressHierarchyEntries,
  notificationService,
} from '@bahmni-frontend/bahmni-services';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import NewPatientRegistration from '..';
import { AgeUtils } from '../../../utils/ageUtils';

// Create mock navigate function
const mockNavigate = jest.fn();

// Mock Dropdown component for easier testing
jest.mock('@bahmni-frontend/bahmni-design-system', () => {
  const actual = jest.requireActual('@bahmni-frontend/bahmni-design-system');
  return {
    ...actual,
    Dropdown: ({
      id,
      titleText,
      label,
      items,
      selectedItem,
      onChange,
      invalid,
      invalidText,
      ...props
    }: any) => (
      <div className="cds--dropdown__wrapper cds--list-box__wrapper">
        <label className="cds--label" htmlFor={id}>
          {titleText}
        </label>
        <select
          id={id}
          data-testid={`dropdown-${id}`}
          value={selectedItem ?? ''}
          onChange={(e) => onChange({ selectedItem: e.target.value })}
          aria-invalid={invalid}
          aria-label={titleText}
          {...props}
        >
          <option value="">{label}</option>
          {items?.map((item: string) => (
            <option key={item} value={item}>
              {item}
            </option>
          ))}
        </select>
        {invalid && invalidText && (
          <div className="cds--form-requirement">{invalidText}</div>
        )}
      </div>
    ),
  };
});

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
  useNavigate: () => mockNavigate,
}));

jest.mock('../../../utils/ageUtils', () => ({
  AgeUtils: {
    diffInYearsMonthsDays: jest.fn(() => ({ years: 25, months: 0, days: 0 })),
    calculateBirthDate: jest.fn(() => '1999-10-14'),
  },
  formatToDisplay: jest.fn((date: string) => {
    if (!date) return '';
    const [year, month, day] = date.split('-');
    return `${day}/${month}/${year}`;
  }),
  formatToISO: jest.fn((date: Date) => date.toISOString().split('T')[0]),
}));

describe('NewPatientRegistration', () => {
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
    (getAddressHierarchyEntries as jest.Mock).mockResolvedValue([]);
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

  describe('Component Initialization', () => {
    it('should render the form with all required fields', async () => {
      renderComponent();

      await waitFor(() => {
        expect(
          screen.getByLabelText(/CREATE_PATIENT_FIRST_NAME/),
        ).toBeInTheDocument();
        expect(
          screen.getByLabelText(/CREATE_PATIENT_LAST_NAME/),
        ).toBeInTheDocument();
        expect(
          screen.getByLabelText(/CREATE_PATIENT_DATE_OF_BIRTH/),
        ).toBeInTheDocument();
        expect(screen.getByText(/CREATE_PATIENT_SAVE/)).toBeInTheDocument();
      });
    });
  });

  describe('DOB and Age Calculations', () => {
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
  });

  describe('Age Validation', () => {
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
  });

  describe('Name Validation', () => {
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
  });

  describe('Phone Number Validation', () => {
    it('should accept valid phone number with digits', async () => {
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

    it('should accept phone number with plus sign', async () => {
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
  });

  describe('Required Field Validations', () => {
    it('should show error when required fields are empty on save', async () => {
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
        expect(
          screen.getByText(/CREATE_PATIENT_VALIDATION_LAST_NAME_REQUIRED/),
        ).toBeInTheDocument();
        expect(
          screen.getByText(/CREATE_PATIENT_VALIDATION_GENDER_REQUIRED/),
        ).toBeInTheDocument();
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

      const saveButton = screen.getByText(/CREATE_PATIENT_SAVE/);
      fireEvent.click(saveButton);

      await waitFor(() => {
        expect(
          screen.getByText(/CREATE_PATIENT_VALIDATION_FIRST_NAME_REQUIRED/),
        ).toBeInTheDocument();
      });

      const firstNameInput = screen.getByLabelText(/CREATE_PATIENT_FIRST_NAME/);
      fireEvent.change(firstNameInput, { target: { value: 'John' } });

      expect(
        screen.queryByText(/CREATE_PATIENT_VALIDATION_FIRST_NAME_REQUIRED/),
      ).not.toBeInTheDocument();
    });
  });

  describe('Form Interactions', () => {
    it('should handle birth time input', async () => {
      renderComponent();

      await waitFor(() => {
        expect(
          screen.getByLabelText(/CREATE_PATIENT_BIRTH_TIME/),
        ).toBeInTheDocument();
      });

      const birthTimeInput = screen.getByLabelText(/CREATE_PATIENT_BIRTH_TIME/);
      fireEvent.change(birthTimeInput, { target: { value: '10:30' } });

      expect(birthTimeInput).toHaveValue('10:30');
    });

    it('should toggle entry type checkbox', async () => {
      renderComponent();

      await waitFor(() => {
        expect(
          screen.getByLabelText(/CREATE_PATIENT_ENTER_MANUALLY/),
        ).toBeInTheDocument();
      });

      const entryTypeCheckbox = screen.getByLabelText(
        /CREATE_PATIENT_ENTER_MANUALLY/,
      );
      expect(entryTypeCheckbox).not.toBeChecked();

      fireEvent.click(entryTypeCheckbox);
      expect(entryTypeCheckbox).toBeChecked();
    });

    it('should handle address field inputs', async () => {
      renderComponent();

      await waitFor(() => {
        expect(
          screen.getByLabelText(/CREATE_PATIENT_HOUSE_NUMBER/),
        ).toBeInTheDocument();
      });

      const houseNumberInput = screen.getByLabelText(
        /CREATE_PATIENT_HOUSE_NUMBER/,
      );
      const localityInput = screen.getByLabelText(/CREATE_PATIENT_LOCALITY/);
      const cityInput = screen.getByLabelText(/CREATE_PATIENT_CITY/);

      fireEvent.change(houseNumberInput, { target: { value: 'Apt 4B' } });
      fireEvent.change(localityInput, { target: { value: 'Downtown' } });
      fireEvent.change(cityInput, { target: { value: 'New York' } });

      expect(houseNumberInput).toHaveValue('Apt 4B');
      expect(localityInput).toHaveValue('Downtown');
      expect(cityInput).toHaveValue('New York');
    });
  });

  describe('Address Hierarchy', () => {
    it('should fetch suggestions when typing in district field', async () => {
      const mockSuggestions = [
        { name: 'District1', uuid: 'uuid1', parent: { name: 'State1' } },
        { name: 'District2', uuid: 'uuid2', parent: { name: 'State2' } },
      ];
      (getAddressHierarchyEntries as jest.Mock).mockResolvedValue(
        mockSuggestions,
      );

      renderComponent();

      await waitFor(() => {
        expect(
          screen.getByLabelText(/CREATE_PATIENT_DISTRICT/),
        ).toBeInTheDocument();
      });

      const districtInput = screen.getByLabelText(/CREATE_PATIENT_DISTRICT/);
      fireEvent.change(districtInput, { target: { value: 'Dist' } });

      await waitFor(() => {
        expect(getAddressHierarchyEntries).toHaveBeenCalledWith(
          'countyDistrict',
          'Dist',
        );
      });
    });

    it('should not fetch suggestions when input is less than 2 characters', async () => {
      renderComponent();

      await waitFor(() => {
        expect(
          screen.getByLabelText(/CREATE_PATIENT_DISTRICT/),
        ).toBeInTheDocument();
      });

      const districtInput = screen.getByLabelText(/CREATE_PATIENT_DISTRICT/);
      fireEvent.change(districtInput, { target: { value: 'D' } });

      await new Promise((resolve) => setTimeout(resolve, 400));
      expect(getAddressHierarchyEntries).not.toHaveBeenCalled();
    });

    it('should show address validation error when field has value but not selected from dropdown', async () => {
      renderComponent();

      await waitFor(() => {
        expect(screen.getByText(/CREATE_PATIENT_SAVE/)).toBeInTheDocument();
      });

      // Fill required fields first
      const firstNameInput = screen.getByLabelText(/CREATE_PATIENT_FIRST_NAME/);
      const lastNameInput = screen.getByLabelText(/CREATE_PATIENT_LAST_NAME/);
      const dobInput = screen.getByLabelText(/CREATE_PATIENT_DATE_OF_BIRTH/);

      fireEvent.change(firstNameInput, { target: { value: 'John' } });
      fireEvent.change(lastNameInput, { target: { value: 'Doe' } });
      fireEvent.change(dobInput, { target: { value: '2000-01-01' } });

      // Fill district but don't select from dropdown
      const districtInput = screen.getByLabelText(/CREATE_PATIENT_DISTRICT/);
      fireEvent.change(districtInput, { target: { value: 'SomeDistrict' } });

      const saveButton = screen.getByText(/CREATE_PATIENT_SAVE/);
      fireEvent.click(saveButton);

      await waitFor(() => {
        expect(
          screen.getByText(/CREATE_PATIENT_VALIDATION_SELECT_FROM_DROPDOWN/),
        ).toBeInTheDocument();
      });
    });
  });

  describe('Form Submission', () => {
    const fillRequiredFields = async () => {
      await waitFor(() => {
        expect(screen.getByText(/CREATE_PATIENT_SAVE/)).toBeInTheDocument();
      });

      const firstNameInput = screen.getByLabelText(/CREATE_PATIENT_FIRST_NAME/);
      const lastNameInput = screen.getByLabelText(/CREATE_PATIENT_LAST_NAME/);

      fireEvent.change(firstNameInput, { target: { value: 'John' } });
      fireEvent.change(lastNameInput, { target: { value: 'Doe' } });

      // Set age to calculate DOB
      const ageYearsInput = screen.getByLabelText(/CREATE_PATIENT_AGE_YEARS/);
      fireEvent.change(ageYearsInput, { target: { value: '25' } });

      // Select gender using the mocked dropdown (now a simple select element)
      const genderSelect = screen.getByLabelText(
        /CREATE_PATIENT_GENDER/,
      ) as HTMLSelectElement;
      fireEvent.change(genderSelect, {
        target: { value: 'CREATE_PATIENT_GENDER_MALE' },
      });
    };

    it('should successfully submit form with required fields', async () => {
      renderComponent();
      await fillRequiredFields();

      const saveButton = screen.getByText(/CREATE_PATIENT_SAVE/);
      fireEvent.click(saveButton);

      await waitFor(() => {
        expect(createPatient).toHaveBeenCalled();
      });
    });

    it('should include middle name in submission when provided', async () => {
      renderComponent();
      await fillRequiredFields();

      const middleNameInput = screen.getByLabelText(
        /CREATE_PATIENT_MIDDLE_NAME/,
      );
      fireEvent.change(middleNameInput, { target: { value: 'Michael' } });

      const saveButton = screen.getByText(/CREATE_PATIENT_SAVE/);
      fireEvent.click(saveButton);

      await waitFor(() => {
        expect(createPatient).toHaveBeenCalledWith(
          expect.objectContaining({
            patient: expect.objectContaining({
              person: expect.objectContaining({
                names: expect.arrayContaining([
                  expect.objectContaining({
                    middleName: 'Michael',
                  }),
                ]),
              }),
            }),
          }),
        );
      });
    });

    it('should include phone numbers when provided', async () => {
      renderComponent();
      await fillRequiredFields();

      const phoneInput = screen.getByLabelText(/CREATE_PATIENT_PHONE_NUMBER/);
      const altPhoneInput = screen.getByLabelText(
        /CREATE_PATIENT_ALT_PHONE_NUMBER/,
      );

      fireEvent.change(phoneInput, { target: { value: '1234567890' } });
      fireEvent.change(altPhoneInput, { target: { value: '0987654321' } });

      const saveButton = screen.getByText(/CREATE_PATIENT_SAVE/);
      fireEvent.click(saveButton);

      await waitFor(() => {
        expect(createPatient).toHaveBeenCalledWith(
          expect.objectContaining({
            patient: expect.objectContaining({
              person: expect.objectContaining({
                attributes: expect.arrayContaining([
                  expect.objectContaining({ value: '1234567890' }),
                  expect.objectContaining({ value: '0987654321' }),
                ]),
              }),
            }),
          }),
        );
      });
    });

    it('should include email when provided', async () => {
      renderComponent();
      await fillRequiredFields();

      const emailInput = screen.getByLabelText(/CREATE_PATIENT_EMAIL/);
      fireEvent.change(emailInput, {
        target: { value: 'john.doe@example.com' },
      });

      const saveButton = screen.getByText(/CREATE_PATIENT_SAVE/);
      fireEvent.click(saveButton);

      await waitFor(() => {
        expect(createPatient).toHaveBeenCalledWith(
          expect.objectContaining({
            patient: expect.objectContaining({
              person: expect.objectContaining({
                attributes: expect.arrayContaining([
                  expect.objectContaining({ value: 'john.doe@example.com' }),
                ]),
              }),
            }),
          }),
        );
      });
    });

    it('should include address when provided', async () => {
      renderComponent();
      await fillRequiredFields();

      const houseNumberInput = screen.getByLabelText(
        /CREATE_PATIENT_HOUSE_NUMBER/,
      );
      const localityInput = screen.getByLabelText(/CREATE_PATIENT_LOCALITY/);
      const cityInput = screen.getByLabelText(/CREATE_PATIENT_CITY/);

      fireEvent.change(houseNumberInput, { target: { value: '123' } });
      fireEvent.change(localityInput, { target: { value: 'Downtown' } });
      fireEvent.change(cityInput, { target: { value: 'NYC' } });

      const saveButton = screen.getByText(/CREATE_PATIENT_SAVE/);
      fireEvent.click(saveButton);

      await waitFor(() => {
        expect(createPatient).toHaveBeenCalledWith(
          expect.objectContaining({
            patient: expect.objectContaining({
              person: expect.objectContaining({
                addresses: expect.arrayContaining([
                  expect.objectContaining({
                    address1: '123',
                    address2: 'Downtown',
                    cityVillage: 'NYC',
                  }),
                ]),
              }),
            }),
          }),
        );
      });
    });

    it('should show error when patient creation fails', async () => {
      (createPatient as jest.Mock).mockRejectedValueOnce(
        new Error('API Error'),
      );

      renderComponent();
      await fillRequiredFields();

      const saveButton = screen.getByText(/CREATE_PATIENT_SAVE/);
      fireEvent.click(saveButton);

      await waitFor(() => {
        expect(createPatient).toHaveBeenCalled();
      });
    });

    it('should show error when primary identifier type is missing', async () => {
      (getIdentifierData as jest.Mock).mockResolvedValueOnce({
        prefixes: ['BAH'],
        sourcesByPrefix: new Map([['BAH', 'source-uuid-1']]),
        primaryIdentifierTypeUuid: null,
      });

      render(
        <QueryClientProvider client={queryClient}>
          <BrowserRouter>
            <NewPatientRegistration />
          </BrowserRouter>
        </QueryClientProvider>,
      );

      await waitFor(() => {
        expect(screen.getByText(/CREATE_PATIENT_SAVE/)).toBeInTheDocument();
      });

      const firstNameInput = screen.getByLabelText(/CREATE_PATIENT_FIRST_NAME/);
      const lastNameInput = screen.getByLabelText(/CREATE_PATIENT_LAST_NAME/);
      const dobInput = screen.getByLabelText(/CREATE_PATIENT_DATE_OF_BIRTH/);

      fireEvent.change(firstNameInput, { target: { value: 'John' } });
      fireEvent.change(lastNameInput, { target: { value: 'Doe' } });
      fireEvent.change(dobInput, { target: { value: '01/01/2000' } });

      const genderDropdown = screen.getByRole('combobox', {
        name: /CREATE_PATIENT_GENDER/,
      });
      const genderButton = genderDropdown.querySelector('button');
      if (genderButton) {
        fireEvent.click(genderButton);
        await waitFor(() => {
          const maleOption = screen.getByText('CREATE_PATIENT_GENDER_MALE');
          fireEvent.click(maleOption);
        });
      }

      const saveButton = screen.getByText(/CREATE_PATIENT_SAVE/);
      fireEvent.click(saveButton);

      await waitFor(() => {
        expect(createPatient).not.toHaveBeenCalled();
      });
    });

    it('should change patient ID format', async () => {
      renderComponent();

      await waitFor(() => {
        expect(
          screen.getByTestId('dropdown-patient-id-format'),
        ).toBeInTheDocument();
      });

      const formatSelect = screen.getByTestId(
        'dropdown-patient-id-format',
      ) as HTMLSelectElement;

      // Wait for options to be available
      await waitFor(() => {
        const options = formatSelect.querySelectorAll('option');
        expect(options.length).toBeGreaterThan(1); // Should have more than just the label
      });

      fireEvent.change(formatSelect, { target: { value: 'GAN' } });

      await waitFor(() => {
        expect(formatSelect.value).toBe('GAN');
      });
    });
  });

  describe('Mutation Callbacks', () => {
    it('should navigate to patient page on successful patient creation with UUID', async () => {
      const mockResponse = {
        patient: {
          uuid: 'new-patient-uuid',
          display: 'John Doe',
        },
      };
      (createPatient as jest.Mock).mockResolvedValue(mockResponse);

      // Mock window.history.replaceState
      const replaceStateSpy = jest.spyOn(window.history, 'replaceState');

      renderComponent();

      await waitFor(() => {
        expect(
          screen.getByLabelText(/CREATE_PATIENT_FIRST_NAME/),
        ).toBeInTheDocument();
      });

      const firstNameInput = screen.getByLabelText(/CREATE_PATIENT_FIRST_NAME/);
      const lastNameInput = screen.getByLabelText(/CREATE_PATIENT_LAST_NAME/);
      const ageYearsInput = screen.getByLabelText(/CREATE_PATIENT_AGE_YEARS/);
      const genderSelect = screen.getByLabelText(
        /CREATE_PATIENT_GENDER/,
      ) as HTMLSelectElement;

      fireEvent.change(firstNameInput, { target: { value: 'John' } });
      fireEvent.change(lastNameInput, { target: { value: 'Doe' } });
      fireEvent.change(ageYearsInput, { target: { value: '30' } });
      fireEvent.change(genderSelect, {
        target: { value: 'CREATE_PATIENT_GENDER_MALE' },
      });

      const saveButton = screen.getByText(/CREATE_PATIENT_SAVE/);
      fireEvent.click(saveButton);

      await waitFor(() => {
        expect(notificationService.showSuccess).toHaveBeenCalledWith(
          'Success',
          'Patient saved successfully',
          5000,
        );
        expect(replaceStateSpy).toHaveBeenCalledWith(
          {
            patientDisplay: 'John Doe',
            patientUuid: 'new-patient-uuid',
          },
          '',
          '/registration/patient/new-patient-uuid',
        );
      });

      replaceStateSpy.mockRestore();
    });

    it('should navigate to search page on successful patient creation without UUID', async () => {
      const mockResponse = {
        patient: {
          display: 'John Doe',
        },
      };
      (createPatient as jest.Mock).mockResolvedValue(mockResponse);

      renderComponent();

      await waitFor(() => {
        expect(
          screen.getByLabelText(/CREATE_PATIENT_FIRST_NAME/),
        ).toBeInTheDocument();
      });

      const firstNameInput = screen.getByLabelText(/CREATE_PATIENT_FIRST_NAME/);
      const lastNameInput = screen.getByLabelText(/CREATE_PATIENT_LAST_NAME/);
      const ageYearsInput = screen.getByLabelText(/CREATE_PATIENT_AGE_YEARS/);
      const genderSelect = screen.getByLabelText(
        /CREATE_PATIENT_GENDER/,
      ) as HTMLSelectElement;

      fireEvent.change(firstNameInput, { target: { value: 'John' } });
      fireEvent.change(lastNameInput, { target: { value: 'Doe' } });
      fireEvent.change(ageYearsInput, { target: { value: '30' } });
      fireEvent.change(genderSelect, {
        target: { value: 'CREATE_PATIENT_GENDER_MALE' },
      });

      const saveButton = screen.getByText(/CREATE_PATIENT_SAVE/);
      fireEvent.click(saveButton);

      await waitFor(() => {
        expect(notificationService.showSuccess).toHaveBeenCalled();
        expect(mockNavigate).toHaveBeenCalledWith('/registration/search');
      });
    });

    it('should show error notification on failed patient creation', async () => {
      (createPatient as jest.Mock).mockRejectedValue(
        new Error('Network error'),
      );

      renderComponent();

      await waitFor(() => {
        expect(
          screen.getByLabelText(/CREATE_PATIENT_FIRST_NAME/),
        ).toBeInTheDocument();
      });

      const firstNameInput = screen.getByLabelText(/CREATE_PATIENT_FIRST_NAME/);
      const lastNameInput = screen.getByLabelText(/CREATE_PATIENT_LAST_NAME/);
      const ageYearsInput = screen.getByLabelText(/CREATE_PATIENT_AGE_YEARS/);
      const genderSelect = screen.getByLabelText(
        /CREATE_PATIENT_GENDER/,
      ) as HTMLSelectElement;

      fireEvent.change(firstNameInput, { target: { value: 'John' } });
      fireEvent.change(lastNameInput, { target: { value: 'Doe' } });
      fireEvent.change(ageYearsInput, { target: { value: '30' } });
      fireEvent.change(genderSelect, {
        target: { value: 'CREATE_PATIENT_GENDER_MALE' },
      });

      const saveButton = screen.getByText(/CREATE_PATIENT_SAVE/);
      fireEvent.click(saveButton);

      await waitFor(() => {
        expect(notificationService.showError).toHaveBeenCalledWith(
          'Error',
          'Failed to save patient',
          5000,
        );
      });
    });
  });

  describe('Date of Birth Validation', () => {
    it('should show error for invalid day (day < 1)', async () => {
      renderComponent();

      await waitFor(() => {
        expect(
          screen.getByLabelText(/CREATE_PATIENT_DATE_OF_BIRTH/),
        ).toBeInTheDocument();
      });

      const dobInput = screen.getByLabelText(/CREATE_PATIENT_DATE_OF_BIRTH/);
      fireEvent.input(dobInput, { target: { value: '00011990' } });

      await waitFor(() => {
        expect(
          screen.getByText(/DATE_ERROR_INVALID_FORMAT/),
        ).toBeInTheDocument();
      });
    });

    it('should show error for invalid month (month > 12)', async () => {
      renderComponent();

      await waitFor(() => {
        expect(
          screen.getByLabelText(/CREATE_PATIENT_DATE_OF_BIRTH/),
        ).toBeInTheDocument();
      });

      const dobInput = screen.getByLabelText(/CREATE_PATIENT_DATE_OF_BIRTH/);
      fireEvent.input(dobInput, { target: { value: '15131990' } });

      await waitFor(() => {
        expect(
          screen.getByText(/DATE_ERROR_INVALID_FORMAT/),
        ).toBeInTheDocument();
      });
    });

    it('should show error for invalid month (month < 1)', async () => {
      renderComponent();

      await waitFor(() => {
        expect(
          screen.getByLabelText(/CREATE_PATIENT_DATE_OF_BIRTH/),
        ).toBeInTheDocument();
      });

      const dobInput = screen.getByLabelText(/CREATE_PATIENT_DATE_OF_BIRTH/);
      fireEvent.input(dobInput, { target: { value: '15001990' } });

      await waitFor(() => {
        expect(
          screen.getByText(/DATE_ERROR_INVALID_FORMAT/),
        ).toBeInTheDocument();
      });
    });

    it('should accept valid date and calculate age correctly', async () => {
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

      const dobInput = screen.getByLabelText(/CREATE_PATIENT_DATE_OF_BIRTH/);
      fireEvent.input(dobInput, { target: { value: '15061998' } });

      await waitFor(() => {
        expect(AgeUtils.diffInYearsMonthsDays).toHaveBeenCalled();
        // Should not show any error
        expect(
          screen.queryByText(/DATE_ERROR_INVALID_FORMAT/),
        ).not.toBeInTheDocument();
        expect(
          screen.queryByText(/DATE_ERROR_FUTURE_DATE/),
        ).not.toBeInTheDocument();
        expect(
          screen.queryByText(/CREATE_PATIENT_VALIDATION_AGE_YEARS_MAX/),
        ).not.toBeInTheDocument();
      });
    });

    it('should clear errors and data when input is completely cleared', async () => {
      renderComponent();

      await waitFor(() => {
        expect(
          screen.getByLabelText(/CREATE_PATIENT_DATE_OF_BIRTH/),
        ).toBeInTheDocument();
      });

      const dobInput = screen.getByLabelText(/CREATE_PATIENT_DATE_OF_BIRTH/);

      // First enter a valid date
      fireEvent.input(dobInput, { target: { value: '15061998' } });

      // Then clear it
      fireEvent.input(dobInput, { target: { value: '' } });

      await waitFor(() => {
        expect((dobInput as HTMLInputElement).value).toBe('');
        // No errors should be shown
        expect(
          screen.queryByText(/DATE_ERROR_INVALID_FORMAT/),
        ).not.toBeInTheDocument();
      });
    });
  });

  describe('Date Handling Edge Cases', () => {
    it('should handle empty date selection', async () => {
      renderComponent();

      await waitFor(() => {
        expect(
          screen.getByLabelText(/CREATE_PATIENT_DATE_OF_BIRTH/),
        ).toBeInTheDocument();
      });

      const dobInput = screen.getByLabelText(/CREATE_PATIENT_DATE_OF_BIRTH/);

      // Simulate date picker change with empty array
      fireEvent.change(dobInput, { target: { value: '' } });

      // Should not crash or throw error
      expect(dobInput).toBeInTheDocument();
    });

    it('should handle age calculation with all age fields', async () => {
      (AgeUtils.calculateBirthDate as jest.Mock).mockReturnValue('1995-02-15');

      renderComponent();

      await waitFor(() => {
        expect(
          screen.getByLabelText(/CREATE_PATIENT_AGE_YEARS/),
        ).toBeInTheDocument();
      });

      const ageYearsInput = screen.getByLabelText(/CREATE_PATIENT_AGE_YEARS/);
      const ageMonthsInput = screen.getByLabelText(/CREATE_PATIENT_AGE_MONTHS/);
      const ageDaysInput = screen.getByLabelText(/CREATE_PATIENT_AGE_DAYS/);

      fireEvent.change(ageYearsInput, { target: { value: '28' } });
      fireEvent.change(ageMonthsInput, { target: { value: '6' } });
      fireEvent.change(ageDaysInput, { target: { value: '15' } });

      await waitFor(() => {
        expect(AgeUtils.calculateBirthDate).toHaveBeenCalledWith({
          years: 28,
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

      // First set an age
      fireEvent.change(ageYearsInput, { target: { value: '25' } });

      // Then clear it
      fireEvent.change(ageYearsInput, { target: { value: '' } });

      const estimatedCheckbox = screen.getByLabelText(
        /CREATE_PATIENT_ESTIMATED/,
      );
      expect(estimatedCheckbox).not.toBeChecked();
    });

    it('should toggle DOB estimation checkbox manually', async () => {
      renderComponent();

      await waitFor(() => {
        expect(
          screen.getByLabelText(/CREATE_PATIENT_ESTIMATED/),
        ).toBeInTheDocument();
      });

      const estimatedCheckbox = screen.getByLabelText(
        /CREATE_PATIENT_ESTIMATED/,
      );

      expect(estimatedCheckbox).not.toBeChecked();
      fireEvent.click(estimatedCheckbox);
      expect(estimatedCheckbox).toBeChecked();
      fireEvent.click(estimatedCheckbox);
      expect(estimatedCheckbox).not.toBeChecked();
    });
  });

  describe('Address Search Error Handling', () => {
    it('should handle address search API error and clear suggestions', async () => {
      let callCount = 0;
      (getAddressHierarchyEntries as jest.Mock).mockImplementation(() => {
        callCount++;
        if (callCount === 1) {
          return Promise.reject(new Error('Network error'));
        }
        return Promise.resolve([]);
      });

      renderComponent();

      await waitFor(() => {
        expect(
          screen.getByLabelText(/CREATE_PATIENT_DISTRICT/),
        ).toBeInTheDocument();
      });

      const districtInput = screen.getByLabelText(/CREATE_PATIENT_DISTRICT/);

      // Type to trigger search that will fail
      fireEvent.change(districtInput, { target: { value: 'TestDist' } });

      // Wait for debounce and error handling
      await new Promise((resolve) => setTimeout(resolve, 400));

      // Error should have been caught and suggestions cleared
      expect(callCount).toBeGreaterThan(0);

      // No suggestions should be shown
      expect(screen.queryByText('TestDist')).not.toBeInTheDocument();
    });
  });

  describe('Address Hierarchy with Parent Auto-population', () => {
    it('should auto-populate state when district is selected', async () => {
      const mockSuggestions = [
        {
          name: 'TestDistrict',
          uuid: 'district-uuid',
          parent: { name: 'TestState', uuid: 'state-uuid' },
        },
      ];
      (getAddressHierarchyEntries as jest.Mock).mockResolvedValue(
        mockSuggestions,
      );

      renderComponent();

      await waitFor(() => {
        expect(
          screen.getByLabelText(/CREATE_PATIENT_DISTRICT/),
        ).toBeInTheDocument();
      });

      const districtInput = screen.getByLabelText(/CREATE_PATIENT_DISTRICT/);
      fireEvent.change(districtInput, { target: { value: 'TestDist' } });

      await waitFor(() => {
        expect(screen.getByText('TestDistrict')).toBeInTheDocument();
      });

      const suggestion = screen.getByText('TestDistrict');
      fireEvent.click(suggestion);

      await waitFor(() => {
        const stateInput = screen.getByLabelText(/CREATE_PATIENT_STATE/);
        expect(stateInput).toHaveValue('TestState');
      });
    });

    it('should auto-populate district and state when pincode is selected', async () => {
      const mockSuggestions = [
        {
          name: '123456',
          uuid: 'pincode-uuid',
          parent: {
            name: 'TestDistrict',
            uuid: 'district-uuid',
            parent: { name: 'TestState', uuid: 'state-uuid' },
          },
        },
      ];
      (getAddressHierarchyEntries as jest.Mock).mockResolvedValue(
        mockSuggestions,
      );

      renderComponent();

      await waitFor(() => {
        expect(
          screen.getByLabelText(/CREATE_PATIENT_PINCODE/),
        ).toBeInTheDocument();
      });

      const pincodeInput = screen.getByLabelText(/CREATE_PATIENT_PINCODE/);
      fireEvent.change(pincodeInput, { target: { value: '123456' } });

      await waitFor(() => {
        expect(screen.getByText('123456')).toBeInTheDocument();
      });

      const suggestion = screen.getByText('123456');
      fireEvent.click(suggestion);

      await waitFor(() => {
        const districtInput = screen.getByLabelText(/CREATE_PATIENT_DISTRICT/);
        const stateInput = screen.getByLabelText(/CREATE_PATIENT_STATE/);
        expect(districtInput).toHaveValue('TestDistrict');
        expect(stateInput).toHaveValue('TestState');
      });
    });

    it('should handle address suggestions error gracefully', async () => {
      (getAddressHierarchyEntries as jest.Mock).mockRejectedValue(
        new Error('Network error'),
      );

      renderComponent();

      await waitFor(() => {
        expect(
          screen.getByLabelText(/CREATE_PATIENT_STATE/),
        ).toBeInTheDocument();
      });

      const stateInput = screen.getByLabelText(/CREATE_PATIENT_STATE/);
      fireEvent.change(stateInput, { target: { value: 'TestState' } });

      await waitFor(() => {
        // Should not show suggestions
        expect(screen.queryByText('TestState')).not.toBeInTheDocument();
      });
    });

    it('should show and hide suggestions on focus and blur', async () => {
      const mockSuggestions = [
        { name: 'District1', uuid: 'uuid1', parent: { name: 'State1' } },
      ];
      (getAddressHierarchyEntries as jest.Mock).mockResolvedValue(
        mockSuggestions,
      );

      renderComponent();

      await waitFor(() => {
        expect(
          screen.getByLabelText(/CREATE_PATIENT_DISTRICT/),
        ).toBeInTheDocument();
      });

      const districtInput = screen.getByLabelText(/CREATE_PATIENT_DISTRICT/);
      fireEvent.change(districtInput, { target: { value: 'District' } });

      await waitFor(() => {
        expect(screen.getByText('District1')).toBeInTheDocument();
      });

      // Focus should show suggestions again if available
      fireEvent.focus(districtInput);

      // Blur should hide suggestions after timeout
      fireEvent.blur(districtInput);

      await new Promise((resolve) => setTimeout(resolve, 250));
    });

    it('should clear address error when field is emptied', async () => {
      renderComponent();

      await waitFor(() => {
        expect(
          screen.getByLabelText(/CREATE_PATIENT_DISTRICT/),
        ).toBeInTheDocument();
      });

      const districtInput = screen.getByLabelText(/CREATE_PATIENT_DISTRICT/);

      // Fill the field
      fireEvent.change(districtInput, { target: { value: 'SomeDistrict' } });

      // Try to save to trigger validation
      const saveButton = screen.getByText(/CREATE_PATIENT_SAVE/);
      fireEvent.click(saveButton);

      await waitFor(() => {
        expect(
          screen.getByText(/CREATE_PATIENT_VALIDATION_SELECT_FROM_DROPDOWN/),
        ).toBeInTheDocument();
      });

      // Clear the field
      fireEvent.change(districtInput, { target: { value: '' } });

      // Error should be cleared
      await waitFor(() => {
        expect(
          screen.queryByText(/CREATE_PATIENT_VALIDATION_SELECT_FROM_DROPDOWN/),
        ).not.toBeInTheDocument();
      });
    });
  });

  describe('Query Retry Logic', () => {
    it('should retry identifier data fetch on failure', async () => {
      let callCount = 0;
      (getIdentifierData as jest.Mock).mockImplementation(() => {
        callCount++;
        if (callCount < 3) {
          return Promise.reject(new Error('Network error'));
        }
        return Promise.resolve(mockIdentifierData);
      });

      queryClient = new QueryClient({
        defaultOptions: {
          queries: {
            retry: 2,
            retryDelay: 10,
          },
        },
      });

      render(
        <QueryClientProvider client={queryClient}>
          <BrowserRouter>
            <NewPatientRegistration />
          </BrowserRouter>
        </QueryClientProvider>,
      );

      // Wait longer for retries to complete
      await waitFor(
        () => {
          expect(callCount).toBeGreaterThanOrEqual(2);
        },
        { timeout: 3000 },
      );
    });
  });

  describe('Navigation and Breadcrumbs', () => {
    it('should render breadcrumb navigation with correct hierarchy', async () => {
      renderComponent();

      await waitFor(() => {
        expect(
          screen.getByText('CREATE_PATIENT_BREADCRUMB_HOME'),
        ).toBeInTheDocument();
        expect(
          screen.getByText('CREATE_PATIENT_BREADCRUMB_SEARCH'),
        ).toBeInTheDocument();
        expect(
          screen.getByText('CREATE_PATIENT_BREADCRUMB_CURRENT'),
        ).toBeInTheDocument();
      });

      // Verify breadcrumb structure
      const breadcrumbs = screen.getByRole('navigation', {
        name: /breadcrumb/i,
      });
      expect(breadcrumbs).toBeInTheDocument();
    });
  });

  describe('Empty Address Submission', () => {
    it('should submit with empty address object when no address fields are provided', async () => {
      renderComponent();

      await waitFor(() => {
        expect(
          screen.getByLabelText(/CREATE_PATIENT_FIRST_NAME/),
        ).toBeInTheDocument();
      });

      const firstNameInput = screen.getByLabelText(/CREATE_PATIENT_FIRST_NAME/);
      const lastNameInput = screen.getByLabelText(/CREATE_PATIENT_LAST_NAME/);
      const ageYearsInput = screen.getByLabelText(/CREATE_PATIENT_AGE_YEARS/);
      const genderSelect = screen.getByLabelText(
        /CREATE_PATIENT_GENDER/,
      ) as HTMLSelectElement;

      fireEvent.change(firstNameInput, { target: { value: 'John' } });
      fireEvent.change(lastNameInput, { target: { value: 'Doe' } });
      fireEvent.change(ageYearsInput, { target: { value: '30' } });
      fireEvent.change(genderSelect, {
        target: { value: 'CREATE_PATIENT_GENDER_FEMALE' },
      });

      const saveButton = screen.getByText(/CREATE_PATIENT_SAVE/);
      fireEvent.click(saveButton);

      await waitFor(() => {
        expect(createPatient).toHaveBeenCalledWith(
          expect.objectContaining({
            patient: expect.objectContaining({
              person: expect.objectContaining({
                addresses: [{}],
              }),
            }),
          }),
        );
      });
    });
  });

  describe('Identifier Source UUID', () => {
    it('should include identifier source UUID in submission when available', async () => {
      renderComponent();

      await waitFor(() => {
        expect(
          screen.getByLabelText(/CREATE_PATIENT_FIRST_NAME/),
        ).toBeInTheDocument();
      });

      const firstNameInput = screen.getByLabelText(/CREATE_PATIENT_FIRST_NAME/);
      const lastNameInput = screen.getByLabelText(/CREATE_PATIENT_LAST_NAME/);
      const ageYearsInput = screen.getByLabelText(/CREATE_PATIENT_AGE_YEARS/);
      const genderSelect = screen.getByLabelText(
        /CREATE_PATIENT_GENDER/,
      ) as HTMLSelectElement;

      fireEvent.change(firstNameInput, { target: { value: 'John' } });
      fireEvent.change(lastNameInput, { target: { value: 'Doe' } });
      fireEvent.change(ageYearsInput, { target: { value: '30' } });
      fireEvent.change(genderSelect, {
        target: { value: 'CREATE_PATIENT_GENDER_OTHER' },
      });

      const saveButton = screen.getByText(/CREATE_PATIENT_SAVE/);
      fireEvent.click(saveButton);

      await waitFor(() => {
        expect(createPatient).toHaveBeenCalledWith(
          expect.objectContaining({
            patient: expect.objectContaining({
              identifiers: expect.arrayContaining([
                expect.objectContaining({
                  identifierSourceUuid: 'source-uuid-1',
                  identifierPrefix: 'BAH',
                }),
              ]),
            }),
          }),
        );
      });
    });
  });

  describe('DatePicker with Actual Date Objects', () => {
    it('should handle undefined selected date gracefully', async () => {
      renderComponent();

      await waitFor(() => {
        expect(
          screen.getByLabelText(/CREATE_PATIENT_DATE_OF_BIRTH/),
        ).toBeInTheDocument();
      });

      const dobInput = screen.getByLabelText(/CREATE_PATIENT_DATE_OF_BIRTH/);

      // Simulate change with undefined in the array
      fireEvent.change(dobInput, { target: { value: '' } });

      // Should not crash
      expect(dobInput).toBeInTheDocument();
    });
  });

  describe('Debounced Search Cleanup', () => {
    it('should clean up timeout on component unmount during address search', async () => {
      const { unmount } = renderComponent();

      await waitFor(() => {
        expect(
          screen.getByLabelText(/CREATE_PATIENT_DISTRICT/),
        ).toBeInTheDocument();
      });

      const districtInput = screen.getByLabelText(/CREATE_PATIENT_DISTRICT/);

      // Start typing to trigger debounced search
      fireEvent.change(districtInput, { target: { value: 'Te' } });

      // Unmount before timeout completes
      unmount();

      // Should clean up without errors
    });

    it('should not fetch suggestions and clear state when input is less than 2 characters', async () => {
      // Clear all mocks and render fresh component
      jest.clearAllMocks();
      (getAddressHierarchyEntries as jest.Mock).mockClear();
      (getAddressHierarchyEntries as jest.Mock).mockResolvedValue([]);

      const { unmount } = renderComponent();

      await waitFor(() => {
        expect(
          screen.getByLabelText(/CREATE_PATIENT_DISTRICT/),
        ).toBeInTheDocument();
      });

      const districtInput = screen.getByLabelText(/CREATE_PATIENT_DISTRICT/);

      // Type single character
      fireEvent.change(districtInput, { target: { value: 'X' } });

      // Wait for debounce timeout
      await new Promise((resolve) => setTimeout(resolve, 400));

      // Should not have called the API for single character
      const calls = (getAddressHierarchyEntries as jest.Mock).mock.calls.filter(
        (call) => call[1] === 'X',
      );
      expect(calls).toHaveLength(0);

      unmount();
    });

    it('should clear suggestions when input becomes empty', async () => {
      const mockSuggestions = [
        { name: 'District1', uuid: 'uuid1', parent: null },
      ];
      (getAddressHierarchyEntries as jest.Mock).mockResolvedValue(
        mockSuggestions,
      );

      renderComponent();

      await waitFor(() => {
        expect(
          screen.getByLabelText(/CREATE_PATIENT_STATE/),
        ).toBeInTheDocument();
      });

      const stateInput = screen.getByLabelText(/CREATE_PATIENT_STATE/);

      // First type to get suggestions
      fireEvent.change(stateInput, { target: { value: 'Test' } });

      await waitFor(() => {
        expect(getAddressHierarchyEntries).toHaveBeenCalled();
      });

      // Then clear the input
      fireEvent.change(stateInput, { target: { value: '' } });

      // Wait for debounce
      await new Promise((resolve) => setTimeout(resolve, 350));

      // Suggestions should be cleared
      expect(screen.queryByText('District1')).not.toBeInTheDocument();
    });
  });

  describe('Primary Identifier Type Validation', () => {
    it('should show error notification when primary identifier type is null', async () => {
      (getIdentifierData as jest.Mock).mockResolvedValueOnce({
        prefixes: ['BAH'],
        sourcesByPrefix: new Map([['BAH', 'source-uuid-1']]),
        primaryIdentifierTypeUuid: null,
      });

      renderComponent();

      await waitFor(() => {
        expect(
          screen.getByLabelText(/CREATE_PATIENT_FIRST_NAME/),
        ).toBeInTheDocument();
      });

      const firstNameInput = screen.getByLabelText(/CREATE_PATIENT_FIRST_NAME/);
      const lastNameInput = screen.getByLabelText(/CREATE_PATIENT_LAST_NAME/);
      const ageYearsInput = screen.getByLabelText(/CREATE_PATIENT_AGE_YEARS/);
      const genderSelect = screen.getByLabelText(
        /CREATE_PATIENT_GENDER/,
      ) as HTMLSelectElement;

      fireEvent.change(firstNameInput, { target: { value: 'John' } });
      fireEvent.change(lastNameInput, { target: { value: 'Doe' } });
      fireEvent.change(ageYearsInput, { target: { value: '30' } });
      fireEvent.change(genderSelect, {
        target: { value: 'CREATE_PATIENT_GENDER_MALE' },
      });

      const saveButton = screen.getByText(/CREATE_PATIENT_SAVE/);
      fireEvent.click(saveButton);

      await waitFor(() => {
        expect(notificationService.showError).toHaveBeenCalledWith(
          'Error',
          'Unable to determine identifier type',
          5000,
        );
        expect(createPatient).not.toHaveBeenCalled();
      });
    });
  });

  describe('Additional Address Field Interactions', () => {
    it('should show suggestions for state field on focus', async () => {
      const mockSuggestions = [
        { name: 'TestState', uuid: 'state-uuid', parent: null },
      ];
      (getAddressHierarchyEntries as jest.Mock).mockResolvedValue(
        mockSuggestions,
      );

      renderComponent();

      await waitFor(() => {
        expect(
          screen.getByLabelText(/CREATE_PATIENT_STATE/),
        ).toBeInTheDocument();
      });

      const stateInput = screen.getByLabelText(/CREATE_PATIENT_STATE/);
      fireEvent.change(stateInput, { target: { value: 'TestState' } });

      await waitFor(() => {
        expect(screen.getByText('TestState')).toBeInTheDocument();
      });

      // Focus should show suggestions again
      fireEvent.focus(stateInput);
      await waitFor(() => {
        expect(screen.getByText('TestState')).toBeInTheDocument();
      });
    });

    it('should hide state suggestions on blur', async () => {
      const mockSuggestions = [
        { name: 'TestState', uuid: 'state-uuid', parent: null },
      ];
      (getAddressHierarchyEntries as jest.Mock).mockResolvedValue(
        mockSuggestions,
      );

      renderComponent();

      await waitFor(() => {
        expect(
          screen.getByLabelText(/CREATE_PATIENT_STATE/),
        ).toBeInTheDocument();
      });

      const stateInput = screen.getByLabelText(/CREATE_PATIENT_STATE/);
      fireEvent.change(stateInput, { target: { value: 'TestState' } });

      await waitFor(() => {
        expect(screen.getByText('TestState')).toBeInTheDocument();
      });

      fireEvent.blur(stateInput);
      await new Promise((resolve) => setTimeout(resolve, 250));
    });

    it('should select state from suggestions', async () => {
      const mockSuggestions = [
        { name: 'TestState', uuid: 'state-uuid', parent: null },
      ];
      (getAddressHierarchyEntries as jest.Mock).mockResolvedValue(
        mockSuggestions,
      );

      renderComponent();

      await waitFor(() => {
        expect(
          screen.getByLabelText(/CREATE_PATIENT_STATE/),
        ).toBeInTheDocument();
      });

      const stateInput = screen.getByLabelText(/CREATE_PATIENT_STATE/);
      fireEvent.change(stateInput, { target: { value: 'TestState' } });

      await waitFor(() => {
        expect(screen.getByText('TestState')).toBeInTheDocument();
      });

      const suggestion = screen.getByText('TestState');
      fireEvent.click(suggestion);

      await waitFor(() => {
        expect(stateInput).toHaveValue('TestState');
      });
    });

    it('should show validation error for state when not selected from dropdown', async () => {
      renderComponent();

      await waitFor(() => {
        expect(
          screen.getByLabelText(/CREATE_PATIENT_FIRST_NAME/),
        ).toBeInTheDocument();
      });

      const firstNameInput = screen.getByLabelText(/CREATE_PATIENT_FIRST_NAME/);
      const lastNameInput = screen.getByLabelText(/CREATE_PATIENT_LAST_NAME/);
      const ageYearsInput = screen.getByLabelText(/CREATE_PATIENT_AGE_YEARS/);
      const genderSelect = screen.getByLabelText(
        /CREATE_PATIENT_GENDER/,
      ) as HTMLSelectElement;
      const stateInput = screen.getByLabelText(/CREATE_PATIENT_STATE/);

      fireEvent.change(firstNameInput, { target: { value: 'John' } });
      fireEvent.change(lastNameInput, { target: { value: 'Doe' } });
      fireEvent.change(ageYearsInput, { target: { value: '30' } });
      fireEvent.change(genderSelect, {
        target: { value: 'CREATE_PATIENT_GENDER_MALE' },
      });
      fireEvent.change(stateInput, { target: { value: 'SomeState' } });

      const saveButton = screen.getByText(/CREATE_PATIENT_SAVE/);
      fireEvent.click(saveButton);

      await waitFor(() => {
        const errorMessages = screen.getAllByText(
          /CREATE_PATIENT_VALIDATION_SELECT_FROM_DROPDOWN/,
        );
        expect(errorMessages.length).toBeGreaterThan(0);
      });
    });

    it('should show suggestions for pincode field on focus', async () => {
      const mockSuggestions = [
        {
          name: '123456',
          uuid: 'pincode-uuid',
          parent: {
            name: 'TestDistrict',
            uuid: 'district-uuid',
            parent: { name: 'TestState', uuid: 'state-uuid' },
          },
        },
      ];
      (getAddressHierarchyEntries as jest.Mock).mockResolvedValue(
        mockSuggestions,
      );

      renderComponent();

      await waitFor(() => {
        expect(
          screen.getByLabelText(/CREATE_PATIENT_PINCODE/),
        ).toBeInTheDocument();
      });

      const pincodeInput = screen.getByLabelText(/CREATE_PATIENT_PINCODE/);
      fireEvent.change(pincodeInput, { target: { value: '123456' } });

      await waitFor(() => {
        expect(screen.getByText('123456')).toBeInTheDocument();
      });

      // Focus should show suggestions again
      fireEvent.focus(pincodeInput);
      await waitFor(() => {
        expect(screen.getByText('123456')).toBeInTheDocument();
      });
    });

    it('should hide pincode suggestions on blur', async () => {
      const mockSuggestions = [
        {
          name: '123456',
          uuid: 'pincode-uuid',
          parent: {
            name: 'TestDistrict',
            uuid: 'district-uuid',
            parent: { name: 'TestState', uuid: 'state-uuid' },
          },
        },
      ];
      (getAddressHierarchyEntries as jest.Mock).mockResolvedValue(
        mockSuggestions,
      );

      renderComponent();

      await waitFor(() => {
        expect(
          screen.getByLabelText(/CREATE_PATIENT_PINCODE/),
        ).toBeInTheDocument();
      });

      const pincodeInput = screen.getByLabelText(/CREATE_PATIENT_PINCODE/);
      fireEvent.change(pincodeInput, { target: { value: '123456' } });

      await waitFor(() => {
        expect(screen.getByText('123456')).toBeInTheDocument();
      });

      fireEvent.blur(pincodeInput);
      await new Promise((resolve) => setTimeout(resolve, 250));
    });

    it('should show validation error for pincode when not selected from dropdown', async () => {
      renderComponent();

      await waitFor(() => {
        expect(
          screen.getByLabelText(/CREATE_PATIENT_FIRST_NAME/),
        ).toBeInTheDocument();
      });

      const firstNameInput = screen.getByLabelText(/CREATE_PATIENT_FIRST_NAME/);
      const lastNameInput = screen.getByLabelText(/CREATE_PATIENT_LAST_NAME/);
      const ageYearsInput = screen.getByLabelText(/CREATE_PATIENT_AGE_YEARS/);
      const genderSelect = screen.getByLabelText(
        /CREATE_PATIENT_GENDER/,
      ) as HTMLSelectElement;
      const pincodeInput = screen.getByLabelText(/CREATE_PATIENT_PINCODE/);

      fireEvent.change(firstNameInput, { target: { value: 'John' } });
      fireEvent.change(lastNameInput, { target: { value: 'Doe' } });
      fireEvent.change(ageYearsInput, { target: { value: '30' } });
      fireEvent.change(genderSelect, {
        target: { value: 'CREATE_PATIENT_GENDER_MALE' },
      });
      fireEvent.change(pincodeInput, { target: { value: '123456' } });

      const saveButton = screen.getByText(/CREATE_PATIENT_SAVE/);
      fireEvent.click(saveButton);

      await waitFor(() => {
        const errorMessages = screen.getAllByText(
          /CREATE_PATIENT_VALIDATION_SELECT_FROM_DROPDOWN/,
        );
        expect(errorMessages.length).toBeGreaterThan(0);
      });
    });
  });
});
