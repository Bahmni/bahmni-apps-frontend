import {
  getAddressHierarchyEntries,
  type AddressHierarchyEntry,
} from '@bahmni-frontend/bahmni-services';
import { NotificationProvider } from '@bahmni-frontend/bahmni-widgets';
import {
  QueryClient,
  QueryClientProvider,
  useMutation,
  useQuery,
} from '@tanstack/react-query';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { axe, toHaveNoViolations } from 'jest-axe';
import { MemoryRouter, useNavigate } from 'react-router-dom';
import i18n from '../../../../setupTests.i18n';
import NewPatientRegistration from '../createPatient';

expect.extend(toHaveNoViolations);

// Mock dependencies
jest.mock('@tanstack/react-query', () => ({
  ...jest.requireActual('@tanstack/react-query'),
  useQuery: jest.fn(),
  useMutation: jest.fn(),
}));

jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: jest.fn(),
}));

jest.mock('@bahmni-frontend/bahmni-services', () => ({
  ...jest.requireActual('@bahmni-frontend/bahmni-services'),
  createPatient: jest.fn(),
  getIdentifierData: jest.fn(),
  getGenders: jest.fn(),
  getAddressHierarchyEntries: jest.fn(),
  notificationService: {
    showSuccess: jest.fn(),
    showError: jest.fn(),
  },
}));

// Mock data
const mockIdentifierData = {
  prefixes: ['BAH', 'TEST', 'ABC'],
  sourcesByPrefix: new Map([
    ['BAH', 'source-uuid-1'],
    ['TEST', 'source-uuid-2'],
    ['ABC', 'source-uuid-3'],
  ]),
  primaryIdentifierTypeUuid: 'primary-identifier-uuid',
};

const mockGenders = ['Male', 'Female', 'Other'];

const mockAddressHierarchyDistrict: AddressHierarchyEntry[] = [
  {
    uuid: 'district-1',
    name: 'Bangalore Urban',
    userGeneratedId: 'BLR',
    parent: {
      uuid: 'state-1',
      name: 'Karnataka',
      userGeneratedId: 'KA',
      parent: undefined,
    },
  },
];

const mockAddressHierarchyPincode: AddressHierarchyEntry[] = [
  {
    uuid: 'pincode-1',
    name: '560001',
    userGeneratedId: 'PIN1',
    parent: {
      uuid: 'district-1',
      name: 'Bangalore Urban',
      userGeneratedId: 'BLR',
      parent: {
        uuid: 'state-1',
        name: 'Karnataka',
        userGeneratedId: 'KA',
        parent: undefined,
      },
    },
  },
];

describe('NewPatientRegistration', () => {
  let queryClient: QueryClient;
  let mockNavigate: jest.Mock;
  let mockMutate: jest.Mock;

  beforeEach(() => {
    i18n.changeLanguage('en');
    jest.clearAllMocks();
    mockNavigate = jest.fn();
    mockMutate = jest.fn();

    // Mock scrollIntoView for jsdom
    Element.prototype.scrollIntoView = jest.fn();

    (useNavigate as jest.Mock).mockReturnValue(mockNavigate);

    (useQuery as jest.Mock).mockImplementation(({ queryKey }) => {
      if (queryKey[0] === 'identifierData') {
        return {
          data: mockIdentifierData,
          error: null,
          isLoading: false,
        };
      }
      if (queryKey[0] === 'genders') {
        return {
          data: mockGenders,
          error: null,
          isLoading: false,
        };
      }
      return {
        data: undefined,
        error: null,
        isLoading: false,
      };
    });

    // Mock useMutation to capture and execute onSuccess/onError callbacks
    (useMutation as jest.Mock).mockImplementation((options) => {
      return {
        mutate: (data: any) => {
          mockMutate(data, options);
        },
        isPending: false,
        isError: false,
        isSuccess: false,
      };
    });

    queryClient = new QueryClient({
      defaultOptions: {
        queries: {
          retry: false,
        },
      },
    });
  });

  afterEach(() => {
    queryClient.clear();
  });

  const renderComponent = () => {
    return render(
      <MemoryRouter>
        <NotificationProvider>
          <QueryClientProvider client={queryClient}>
            <NewPatientRegistration />
          </QueryClientProvider>
        </NotificationProvider>
      </MemoryRouter>,
    );
  };

  // ===== HAPPY PATH TESTS =====

  describe('Happy Path - Component Rendering', () => {
    it('should render the component with all form sections', () => {
      renderComponent();

      expect(
        screen.getByText('CREATE_PATIENT_HEADER_TITLE'),
      ).toBeInTheDocument();
      expect(
        screen.getByText('CREATE_PATIENT_SECTION_BASIC_INFO'),
      ).toBeInTheDocument();
      expect(
        screen.getByText('CREATE_PATIENT_SECTION_ADDRESS_INFO'),
      ).toBeInTheDocument();
      expect(
        screen.getByText('CREATE_PATIENT_SECTION_CONTACT_INFO'),
      ).toBeInTheDocument();
      expect(
        screen.getByText('CREATE_PATIENT_SECTION_ADDITIONAL_INFO'),
      ).toBeInTheDocument();
    });

    it('should render all basic information fields', () => {
      renderComponent();

      expect(
        screen.getByLabelText('CREATE_PATIENT_FIRST_NAME'),
      ).toBeInTheDocument();
      expect(
        screen.getByLabelText('CREATE_PATIENT_MIDDLE_NAME'),
      ).toBeInTheDocument();
      expect(
        screen.getByLabelText('CREATE_PATIENT_LAST_NAME'),
      ).toBeInTheDocument();
      expect(
        screen.getByLabelText('CREATE_PATIENT_AGE_YEARS'),
      ).toBeInTheDocument();
      expect(
        screen.getByLabelText('CREATE_PATIENT_AGE_MONTHS'),
      ).toBeInTheDocument();
      expect(
        screen.getByLabelText('CREATE_PATIENT_AGE_DAYS'),
      ).toBeInTheDocument();
      expect(
        screen.getByLabelText('CREATE_PATIENT_DATE_OF_BIRTH'),
      ).toBeInTheDocument();

      // Check for gender and patient ID format using getAllByLabelText since they appear multiple times in Carbon Design
      const genderFields = screen.getAllByLabelText('CREATE_PATIENT_GENDER');
      expect(genderFields.length).toBeGreaterThan(0);

      const patientIdFields = screen.getAllByLabelText(
        'CREATE_PATIENT_PATIENT_ID_FORMAT',
      );
      expect(patientIdFields.length).toBeGreaterThan(0);
    });

    it('should render all address fields', () => {
      renderComponent();

      expect(
        screen.getByLabelText('CREATE_PATIENT_HOUSE_NUMBER'),
      ).toBeInTheDocument();
      expect(
        screen.getByLabelText('CREATE_PATIENT_LOCALITY'),
      ).toBeInTheDocument();
      expect(
        screen.getByLabelText('CREATE_PATIENT_DISTRICT'),
      ).toBeInTheDocument();
      expect(screen.getByLabelText('CREATE_PATIENT_CITY')).toBeInTheDocument();
      expect(screen.getByLabelText('CREATE_PATIENT_STATE')).toBeInTheDocument();
      expect(
        screen.getByLabelText('CREATE_PATIENT_PINCODE'),
      ).toBeInTheDocument();
    });

    it('should render contact information fields', () => {
      renderComponent();

      expect(
        screen.getByLabelText('CREATE_PATIENT_PHONE_NUMBER'),
      ).toBeInTheDocument();
      expect(
        screen.getByLabelText('CREATE_PATIENT_ALT_PHONE_NUMBER'),
      ).toBeInTheDocument();
    });

    it('should render additional information fields', () => {
      renderComponent();

      expect(screen.getByLabelText('CREATE_PATIENT_EMAIL')).toBeInTheDocument();
    });

    it('should render action buttons', () => {
      renderComponent();

      expect(
        screen.getByText('CREATE_PATIENT_BACK_TO_SEARCH'),
      ).toBeInTheDocument();
      expect(screen.getByText('CREATE_PATIENT_SAVE')).toBeInTheDocument();
      expect(
        screen.getByText('CREATE_PATIENT_PRINT_REG_CARD'),
      ).toBeInTheDocument();
      expect(
        screen.getByText('CREATE_PATIENT_START_OPD_VISIT'),
      ).toBeInTheDocument();
    });
  });

  describe('Happy Path - Form Interactions', () => {
    it('should allow user to input first name', async () => {
      renderComponent();
      const firstNameInput = screen.getByLabelText(
        'CREATE_PATIENT_FIRST_NAME',
      ) as HTMLInputElement;

      await userEvent.type(firstNameInput, 'John');

      expect(firstNameInput).toHaveValue('John');
    });

    it('should allow user to input last name', async () => {
      renderComponent();
      const lastNameInput = screen.getByLabelText(
        'CREATE_PATIENT_LAST_NAME',
      ) as HTMLInputElement;

      await userEvent.type(lastNameInput, 'Doe');

      expect(lastNameInput).toHaveValue('Doe');
    });

    it('should allow user to select gender from dropdown', async () => {
      renderComponent();

      // Gender dropdown is rendered by Carbon Design System with specific structure
      const genderDropdown = screen.getByRole('combobox', {
        name: 'CREATE_PATIENT_GENDER',
      });
      await userEvent.click(genderDropdown);

      await waitFor(() => {
        expect(
          screen.getByText('CREATE_PATIENT_GENDER_MALE'),
        ).toBeInTheDocument();
      });
    });

    it('should allow user to input age in years', async () => {
      renderComponent();
      const ageYearsInput = screen.getByLabelText(
        'CREATE_PATIENT_AGE_YEARS',
      ) as HTMLInputElement;

      await userEvent.clear(ageYearsInput);
      await userEvent.type(ageYearsInput, '30');

      expect(ageYearsInput).toHaveValue(30);
    });

    it('should allow user to input age in months', async () => {
      renderComponent();
      const ageMonthsInput = screen.getByLabelText(
        'CREATE_PATIENT_AGE_MONTHS',
      ) as HTMLInputElement;

      await userEvent.clear(ageMonthsInput);
      await userEvent.type(ageMonthsInput, '6');

      expect(ageMonthsInput).toHaveValue(6);
    });

    it('should allow user to input age in days', async () => {
      renderComponent();
      const ageDaysInput = screen.getByLabelText(
        'CREATE_PATIENT_AGE_DAYS',
      ) as HTMLInputElement;

      await userEvent.clear(ageDaysInput);
      await userEvent.type(ageDaysInput, '15');

      expect(ageDaysInput).toHaveValue(15);
    });

    it('should allow user to input phone number', async () => {
      renderComponent();
      const phoneInput = screen.getByLabelText(
        'CREATE_PATIENT_PHONE_NUMBER',
      ) as HTMLInputElement;

      await userEvent.type(phoneInput, '1234567890');

      expect(phoneInput).toHaveValue('1234567890');
    });

    it('should allow user to input alternate phone number', async () => {
      renderComponent();
      const altPhoneInput = screen.getByLabelText(
        'CREATE_PATIENT_ALT_PHONE_NUMBER',
      ) as HTMLInputElement;

      await userEvent.type(altPhoneInput, '9876543210');

      expect(altPhoneInput).toHaveValue('9876543210');
    });

    it('should allow user to input email', async () => {
      renderComponent();
      const emailInput = screen.getByLabelText(
        'CREATE_PATIENT_EMAIL',
      ) as HTMLInputElement;

      await userEvent.type(emailInput, 'test@example.com');

      expect(emailInput).toHaveValue('test@example.com');
    });

    it('should allow user to input address fields', async () => {
      renderComponent();

      const houseNumberInput = screen.getByLabelText(
        'CREATE_PATIENT_HOUSE_NUMBER',
      ) as HTMLInputElement;
      await userEvent.type(houseNumberInput, '123');
      expect(houseNumberInput).toHaveValue('123');

      const localityInput = screen.getByLabelText(
        'CREATE_PATIENT_LOCALITY',
      ) as HTMLInputElement;
      await userEvent.type(localityInput, 'Main Street');
      expect(localityInput).toHaveValue('Main Street');

      const cityInput = screen.getByLabelText(
        'CREATE_PATIENT_CITY',
      ) as HTMLInputElement;
      await userEvent.type(cityInput, 'Bangalore');
      expect(cityInput).toHaveValue('Bangalore');
    });
  });

  describe('Happy Path - Age and DOB Calculations', () => {
    it('should calculate DOB from age when user enters age', async () => {
      renderComponent();
      const ageYearsInput = screen.getByLabelText(
        'CREATE_PATIENT_AGE_YEARS',
      ) as HTMLInputElement;

      await userEvent.clear(ageYearsInput);
      await userEvent.type(ageYearsInput, '30');

      const dobInput = screen.getByLabelText(
        'CREATE_PATIENT_DATE_OF_BIRTH',
      ) as HTMLInputElement;
      await waitFor(() => {
        expect(dobInput.value).toBeTruthy();
      });
    });

    it('should mark DOB as estimated when calculated from age', async () => {
      renderComponent();
      const ageYearsInput = screen.getByLabelText(
        'CREATE_PATIENT_AGE_YEARS',
      ) as HTMLInputElement;

      await userEvent.clear(ageYearsInput);
      await userEvent.type(ageYearsInput, '25');

      const estimatedCheckbox = screen.getByLabelText(
        'CREATE_PATIENT_ESTIMATED',
      ) as HTMLInputElement;
      await waitFor(() => {
        expect(estimatedCheckbox).toBeChecked();
      });
    });

    it('should calculate age from DOB when user enters age', async () => {
      renderComponent();

      const ageYearsInput = screen.getByLabelText(
        'CREATE_PATIENT_AGE_YEARS',
      ) as HTMLInputElement;
      await userEvent.clear(ageYearsInput);
      await userEvent.type(ageYearsInput, '30');

      await waitFor(() => {
        // When age is entered, DOB should be calculated
        const dobInput = screen.getByLabelText(
          'CREATE_PATIENT_DATE_OF_BIRTH',
        ) as HTMLInputElement;
        expect(dobInput.value).toBeTruthy();
      });
    });

    it('should mark and unmark estimated checkbox when toggled', async () => {
      renderComponent();

      // First set age to trigger estimated
      const ageYearsInput = screen.getByLabelText(
        'CREATE_PATIENT_AGE_YEARS',
      ) as HTMLInputElement;
      await userEvent.clear(ageYearsInput);
      await userEvent.type(ageYearsInput, '25');

      const estimatedCheckbox = screen.getByLabelText(
        'CREATE_PATIENT_ESTIMATED',
      ) as HTMLInputElement;
      await waitFor(() => {
        expect(estimatedCheckbox).toBeChecked();
      });

      // Manually toggle the checkbox
      await userEvent.click(estimatedCheckbox);

      await waitFor(() => {
        expect(estimatedCheckbox).not.toBeChecked();
      });
    });
  });

  describe('Happy Path - Address Hierarchy', () => {
    it('should fetch and display district suggestions', async () => {
      (getAddressHierarchyEntries as jest.Mock).mockResolvedValue(
        mockAddressHierarchyDistrict,
      );

      renderComponent();

      const districtInput = screen.getByLabelText('CREATE_PATIENT_DISTRICT');
      await userEvent.type(districtInput, 'Bang');

      await waitFor(
        () => {
          expect(getAddressHierarchyEntries).toHaveBeenCalledWith(
            'countyDistrict',
            'Bang',
          );
          expect(screen.getByText('Bangalore Urban')).toBeInTheDocument();
          expect(screen.getByText('Karnataka')).toBeInTheDocument();
        },
        { timeout: 1000 },
      );
    });

    it('should auto-populate state when district is selected', async () => {
      (getAddressHierarchyEntries as jest.Mock).mockResolvedValue(
        mockAddressHierarchyDistrict,
      );

      renderComponent();

      const districtInput = screen.getByLabelText(
        'CREATE_PATIENT_DISTRICT',
      ) as HTMLInputElement;
      await userEvent.type(districtInput, 'Bang');

      await waitFor(
        () => {
          expect(screen.getByText('Bangalore Urban')).toBeInTheDocument();
        },
        { timeout: 1000 },
      );

      fireEvent.click(screen.getByText('Bangalore Urban'));

      await waitFor(() => {
        expect(districtInput).toHaveValue('Bangalore Urban');
        const stateInput = screen.getByLabelText(
          'CREATE_PATIENT_STATE',
        ) as HTMLInputElement;
        expect(stateInput).toHaveValue('Karnataka');
      });
    });

    it('should fetch and display pincode suggestions', async () => {
      (getAddressHierarchyEntries as jest.Mock).mockResolvedValue(
        mockAddressHierarchyPincode,
      );

      renderComponent();

      const pincodeInput = screen.getByLabelText('CREATE_PATIENT_PINCODE');
      await userEvent.type(pincodeInput, '560');

      await waitFor(
        () => {
          expect(getAddressHierarchyEntries).toHaveBeenCalledWith(
            'postalCode',
            '560',
          );
          expect(screen.getByText('560001')).toBeInTheDocument();
        },
        { timeout: 1000 },
      );
    });

    it('should auto-populate district and state when pincode is selected', async () => {
      (getAddressHierarchyEntries as jest.Mock).mockResolvedValue(
        mockAddressHierarchyPincode,
      );

      renderComponent();

      const pincodeInput = screen.getByLabelText(
        'CREATE_PATIENT_PINCODE',
      ) as HTMLInputElement;
      await userEvent.type(pincodeInput, '560');

      await waitFor(
        () => {
          expect(screen.getByText('560001')).toBeInTheDocument();
        },
        { timeout: 1000 },
      );

      fireEvent.click(screen.getByText('560001'));

      await waitFor(() => {
        expect(pincodeInput).toHaveValue('560001');
        const districtInput = screen.getByLabelText(
          'CREATE_PATIENT_DISTRICT',
        ) as HTMLInputElement;
        const stateInput = screen.getByLabelText(
          'CREATE_PATIENT_STATE',
        ) as HTMLInputElement;
        expect(districtInput).toHaveValue('Bangalore Urban');
        expect(stateInput).toHaveValue('Karnataka');
      });
    });
  });

  // ===== SAD PATH TESTS =====

  describe('Sad Path - Validation Errors', () => {
    it('should show validation error when first name is missing', async () => {
      renderComponent();

      await userEvent.type(
        screen.getByLabelText('CREATE_PATIENT_LAST_NAME'),
        'Doe',
      );

      const genderDropdown = screen.getByRole('combobox', {
        name: 'CREATE_PATIENT_GENDER',
      });
      await userEvent.click(genderDropdown);
      await waitFor(() => {
        fireEvent.click(screen.getByText('CREATE_PATIENT_GENDER_MALE'));
      });

      const dobInput = screen.getByLabelText('CREATE_PATIENT_DATE_OF_BIRTH');
      fireEvent.change(dobInput, { target: { value: '01/01/1990' } });

      await userEvent.click(screen.getByText('CREATE_PATIENT_SAVE'));

      await waitFor(() => {
        expect(screen.getByText('First name is required')).toBeInTheDocument();
      });
    });

    it('should show validation error when last name is missing', async () => {
      renderComponent();

      await userEvent.type(
        screen.getByLabelText('CREATE_PATIENT_FIRST_NAME'),
        'John',
      );

      const genderDropdown = screen.getByRole('combobox', {
        name: 'CREATE_PATIENT_GENDER',
      });
      await userEvent.click(genderDropdown);
      await waitFor(() => {
        fireEvent.click(screen.getByText('CREATE_PATIENT_GENDER_MALE'));
      });

      const dobInput = screen.getByLabelText('CREATE_PATIENT_DATE_OF_BIRTH');
      fireEvent.change(dobInput, { target: { value: '01/01/1990' } });

      await userEvent.click(screen.getByText('CREATE_PATIENT_SAVE'));

      await waitFor(() => {
        expect(screen.getByText('Last name is required')).toBeInTheDocument();
      });
    });

    it('should show validation error when gender is missing', async () => {
      renderComponent();

      await userEvent.type(
        screen.getByLabelText('CREATE_PATIENT_FIRST_NAME'),
        'John',
      );
      await userEvent.type(
        screen.getByLabelText('CREATE_PATIENT_LAST_NAME'),
        'Doe',
      );

      const dobInput = screen.getByLabelText('CREATE_PATIENT_DATE_OF_BIRTH');
      fireEvent.change(dobInput, { target: { value: '01/01/1990' } });

      await userEvent.click(screen.getByText('CREATE_PATIENT_SAVE'));

      await waitFor(() => {
        expect(screen.getByText('Gender is required')).toBeInTheDocument();
      });
    });

    it('should show validation error when date of birth is missing', async () => {
      renderComponent();

      await userEvent.type(
        screen.getByLabelText('CREATE_PATIENT_FIRST_NAME'),
        'John',
      );
      await userEvent.type(
        screen.getByLabelText('CREATE_PATIENT_LAST_NAME'),
        'Doe',
      );

      const genderDropdown = screen.getByRole('combobox', {
        name: 'CREATE_PATIENT_GENDER',
      });
      await userEvent.click(genderDropdown);
      await waitFor(() => {
        fireEvent.click(screen.getByText('CREATE_PATIENT_GENDER_MALE'));
      });

      await userEvent.click(screen.getByText('CREATE_PATIENT_SAVE'));

      await waitFor(() => {
        expect(
          screen.getByText('Date of birth is required'),
        ).toBeInTheDocument();
      });
    });

    it('should show multiple validation errors when multiple fields are missing', async () => {
      renderComponent();

      await userEvent.click(screen.getByText('CREATE_PATIENT_SAVE'));

      await waitFor(() => {
        expect(screen.getByText('First name is required')).toBeInTheDocument();
        expect(screen.getByText('Last name is required')).toBeInTheDocument();
        expect(screen.getByText('Gender is required')).toBeInTheDocument();
        expect(
          screen.getByText('Date of birth is required'),
        ).toBeInTheDocument();
      });
    });

    it('should clear validation error when first name is entered', async () => {
      renderComponent();

      await userEvent.click(screen.getByText('CREATE_PATIENT_SAVE'));

      await waitFor(() => {
        expect(screen.getByText('First name is required')).toBeInTheDocument();
      });

      const firstNameInput = screen.getByLabelText('CREATE_PATIENT_FIRST_NAME');
      await userEvent.type(firstNameInput, 'John');

      await waitFor(() => {
        expect(
          screen.queryByText('First name is required'),
        ).not.toBeInTheDocument();
      });
    });
  });

  describe('Sad Path - Input Validation', () => {
    it('should reject numbers in first name', async () => {
      renderComponent();

      const firstNameInput = screen.getByLabelText('CREATE_PATIENT_FIRST_NAME');
      await userEvent.type(firstNameInput, 'John123');

      await waitFor(() => {
        expect(
          screen.getByText('Numbers and special characters are not allowed.'),
        ).toBeInTheDocument();
      });
    });

    it('should reject special characters in first name', async () => {
      renderComponent();

      const firstNameInput = screen.getByLabelText('CREATE_PATIENT_FIRST_NAME');
      await userEvent.type(firstNameInput, 'John@#$');

      await waitFor(() => {
        expect(
          screen.getByText('Numbers and special characters are not allowed.'),
        ).toBeInTheDocument();
      });
    });

    it('should reject numbers in middle name', async () => {
      renderComponent();

      const middleNameInput = screen.getByLabelText(
        'CREATE_PATIENT_MIDDLE_NAME',
      );
      await userEvent.type(middleNameInput, 'Michael123');

      await waitFor(() => {
        expect(
          screen.getByText('Numbers and special characters are not allowed.'),
        ).toBeInTheDocument();
      });
    });

    it('should reject numbers in last name', async () => {
      renderComponent();

      const lastNameInput = screen.getByLabelText('CREATE_PATIENT_LAST_NAME');
      await userEvent.type(lastNameInput, 'Doe123');

      await waitFor(() => {
        expect(
          screen.getByText('Numbers and special characters are not allowed.'),
        ).toBeInTheDocument();
      });
    });

    it('should only allow numeric values in phone number', async () => {
      renderComponent();

      const phoneInput = screen.getByLabelText(
        'CREATE_PATIENT_PHONE_NUMBER',
      ) as HTMLInputElement;
      await userEvent.type(phoneInput, 'abc123');

      expect(phoneInput).toHaveValue('123');
    });

    it('should only allow numeric values in alternate phone number', async () => {
      renderComponent();

      const altPhoneInput = screen.getByLabelText(
        'CREATE_PATIENT_ALT_PHONE_NUMBER',
      ) as HTMLInputElement;
      await userEvent.type(altPhoneInput, 'xyz789');

      expect(altPhoneInput).toHaveValue('789');
    });
  });

  describe('Sad Path - API Errors', () => {
    it('should handle address hierarchy API failure gracefully', async () => {
      (getAddressHierarchyEntries as jest.Mock).mockRejectedValue(
        new Error('API Error'),
      );

      renderComponent();

      const districtInput = screen.getByLabelText('CREATE_PATIENT_DISTRICT');
      await userEvent.type(districtInput, 'Bang');

      await waitFor(
        () => {
          expect(screen.queryByText('Bangalore Urban')).not.toBeInTheDocument();
        },
        { timeout: 1000 },
      );
    });
  });

  // ===== EDGE CASE TESTS =====

  describe('Edge Cases - Age Inputs', () => {
    it('should handle age years of 0', async () => {
      renderComponent();
      const ageYearsInput = screen.getByLabelText(
        'CREATE_PATIENT_AGE_YEARS',
      ) as HTMLInputElement;

      await userEvent.clear(ageYearsInput);
      await userEvent.type(ageYearsInput, '0');

      expect(ageYearsInput).toHaveValue(0);
    });

    it('should handle maximum age years (150)', async () => {
      renderComponent();
      const ageYearsInput = screen.getByLabelText(
        'CREATE_PATIENT_AGE_YEARS',
      ) as HTMLInputElement;

      await userEvent.clear(ageYearsInput);
      await userEvent.type(ageYearsInput, '150');

      expect(ageYearsInput).toHaveValue(150);
    });

    it('should handle age months at maximum (11)', async () => {
      renderComponent();
      const ageMonthsInput = screen.getByLabelText(
        'CREATE_PATIENT_AGE_MONTHS',
      ) as HTMLInputElement;

      await userEvent.clear(ageMonthsInput);
      await userEvent.type(ageMonthsInput, '11');

      expect(ageMonthsInput).toHaveValue(11);
    });

    it('should handle age days at maximum (31)', async () => {
      renderComponent();
      const ageDaysInput = screen.getByLabelText(
        'CREATE_PATIENT_AGE_DAYS',
      ) as HTMLInputElement;

      await userEvent.clear(ageDaysInput);
      await userEvent.type(ageDaysInput, '31');

      expect(ageDaysInput).toHaveValue(31);
    });

    it('should calculate DOB with only months specified', async () => {
      renderComponent();

      const ageMonthsInput = screen.getByLabelText(
        'CREATE_PATIENT_AGE_MONTHS',
      ) as HTMLInputElement;
      await userEvent.clear(ageMonthsInput);
      await userEvent.type(ageMonthsInput, '6');

      const dobInput = screen.getByLabelText(
        'CREATE_PATIENT_DATE_OF_BIRTH',
      ) as HTMLInputElement;
      await waitFor(() => {
        expect(dobInput.value).toBeTruthy();
      });
    });

    it('should calculate DOB with only days specified', async () => {
      renderComponent();

      const ageDaysInput = screen.getByLabelText(
        'CREATE_PATIENT_AGE_DAYS',
      ) as HTMLInputElement;
      await userEvent.clear(ageDaysInput);
      await userEvent.type(ageDaysInput, '15');

      const dobInput = screen.getByLabelText(
        'CREATE_PATIENT_DATE_OF_BIRTH',
      ) as HTMLInputElement;
      await waitFor(() => {
        expect(dobInput.value).toBeTruthy();
      });
    });
  });

  describe('Edge Cases - Empty Inputs', () => {
    it('should handle whitespace-only first name as invalid', async () => {
      renderComponent();

      const firstNameInput = screen.getByLabelText('CREATE_PATIENT_FIRST_NAME');
      await userEvent.type(firstNameInput, '   ');

      await userEvent.type(
        screen.getByLabelText('CREATE_PATIENT_LAST_NAME'),
        'Doe',
      );

      const genderDropdown = screen.getByRole('combobox', {
        name: 'CREATE_PATIENT_GENDER',
      });
      await userEvent.click(genderDropdown);
      await waitFor(() => {
        fireEvent.click(screen.getByText('CREATE_PATIENT_GENDER_MALE'));
      });

      const dobInput = screen.getByLabelText('CREATE_PATIENT_DATE_OF_BIRTH');
      fireEvent.change(dobInput, { target: { value: '01/01/1990' } });

      await userEvent.click(screen.getByText('CREATE_PATIENT_SAVE'));

      await waitFor(() => {
        expect(screen.getByText('First name is required')).toBeInTheDocument();
      });
    });
  });

  describe('Edge Cases - Special Scenarios', () => {
    it('should hide suggestions when input loses focus', async () => {
      (getAddressHierarchyEntries as jest.Mock).mockResolvedValue(
        mockAddressHierarchyDistrict,
      );

      renderComponent();

      const districtInput = screen.getByLabelText('CREATE_PATIENT_DISTRICT');
      await userEvent.type(districtInput, 'Bang');

      await waitFor(
        () => {
          expect(screen.getByText('Bangalore Urban')).toBeInTheDocument();
        },
        { timeout: 1000 },
      );

      fireEvent.blur(districtInput);

      await waitFor(
        () => {
          expect(screen.queryByText('Bangalore Urban')).not.toBeInTheDocument();
        },
        { timeout: 300 },
      );
    });

    it('should show suggestions again on focus if data exists', async () => {
      (getAddressHierarchyEntries as jest.Mock).mockResolvedValue(
        mockAddressHierarchyDistrict,
      );

      renderComponent();

      const districtInput = screen.getByLabelText('CREATE_PATIENT_DISTRICT');
      await userEvent.type(districtInput, 'Bang');

      await waitFor(
        () => {
          expect(screen.getByText('Bangalore Urban')).toBeInTheDocument();
        },
        { timeout: 1000 },
      );

      fireEvent.blur(districtInput);

      await waitFor(
        () => {
          expect(screen.queryByText('Bangalore Urban')).not.toBeInTheDocument();
        },
        { timeout: 300 },
      );

      fireEvent.focus(districtInput);

      await waitFor(() => {
        expect(screen.getByText('Bangalore Urban')).toBeInTheDocument();
      });
    });

    it('should not show suggestions for search text less than 2 characters', async () => {
      (getAddressHierarchyEntries as jest.Mock).mockResolvedValue(
        mockAddressHierarchyDistrict,
      );

      renderComponent();

      const districtInput = screen.getByLabelText('CREATE_PATIENT_DISTRICT');
      await userEvent.type(districtInput, 'B');

      await waitFor(
        () => {
          expect(getAddressHierarchyEntries).not.toHaveBeenCalled();
        },
        { timeout: 500 },
      );
    });
  });

  describe('Edge Cases - Identifier Prefixes', () => {
    it('should default to first prefix when loaded', () => {
      renderComponent();

      const dropdown = screen.getByRole('combobox', {
        name: 'CREATE_PATIENT_PATIENT_ID_FORMAT',
      });
      expect(dropdown).toHaveTextContent('BAH');
    });

    it('should allow changing identifier prefix', async () => {
      renderComponent();

      const dropdown = screen.getByRole('combobox', {
        name: 'CREATE_PATIENT_PATIENT_ID_FORMAT',
      });
      await userEvent.click(dropdown);

      await waitFor(() => {
        expect(screen.getByText('TEST')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText('TEST'));

      await waitFor(() => {
        expect(dropdown).toHaveTextContent('TEST');
      });
    });

    it('should handle empty identifier prefixes array', () => {
      (useQuery as jest.Mock).mockImplementation(({ queryKey }) => {
        if (queryKey[0] === 'identifierData') {
          return {
            data: {
              prefixes: [],
              sourcesByPrefix: new Map(),
              primaryIdentifierTypeUuid: 'primary-identifier-uuid',
            },
            error: null,
            isLoading: false,
          };
        }
        if (queryKey[0] === 'genders') {
          return {
            data: mockGenders,
            error: null,
            isLoading: false,
          };
        }
        return {
          data: undefined,
          error: null,
          isLoading: false,
        };
      });

      renderComponent();

      const dropdown = screen.getByRole('combobox', {
        name: 'CREATE_PATIENT_PATIENT_ID_FORMAT',
      });
      expect(dropdown).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('should have no critical accessibility violations', async () => {
      const { container } = renderComponent();
      const results = await axe(container);

      // Filter out known issues with Carbon Design System components
      // aria-required on div is a known Carbon Design System issue
      const criticalViolations = results.violations.filter(
        (violation) =>
          (violation.impact === 'critical' || violation.impact === 'serious') &&
          violation.id !== 'aria-allowed-attr',
      );

      expect(criticalViolations).toHaveLength(0);
    });

    it('should have proper labels for all form inputs', () => {
      renderComponent();

      expect(
        screen.getByLabelText('CREATE_PATIENT_FIRST_NAME'),
      ).toHaveAttribute('id', 'first-name');
      expect(screen.getByLabelText('CREATE_PATIENT_LAST_NAME')).toHaveAttribute(
        'id',
        'last-name',
      );
      expect(
        screen.getByLabelText('CREATE_PATIENT_MIDDLE_NAME'),
      ).toHaveAttribute('id', 'middle-name');
      expect(
        screen.getByLabelText('CREATE_PATIENT_PHONE_NUMBER'),
      ).toHaveAttribute('id', 'phone-number');
      expect(screen.getByLabelText('CREATE_PATIENT_EMAIL')).toHaveAttribute(
        'id',
        'email',
      );
    });
  });

  describe('Breadcrumb Navigation', () => {
    it('should navigate to search page when search breadcrumb is clicked', async () => {
      renderComponent();

      const searchBreadcrumb = screen.getByText(
        'CREATE_PATIENT_BREADCRUMB_SEARCH',
      );
      fireEvent.click(searchBreadcrumb);

      expect(mockNavigate).toHaveBeenCalledWith('/registration/search');
    });
  });
});
