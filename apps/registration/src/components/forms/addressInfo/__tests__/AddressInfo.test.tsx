import {
  useTranslation,
  getAddressHierarchyEntries,
  getOrderedAddressHierarchyLevels,
} from '@bahmni/services';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import {
  render,
  screen,
  fireEvent,
  waitFor,
  act,
} from '@testing-library/react';
import { createRef } from 'react';
import '@testing-library/jest-dom';
import { AddressInfo, AddressInfoRef } from '../AddressInfo';

// Mock translation and address service
jest.mock('@bahmni/services', () => ({
  useTranslation: jest.fn(),
  getAddressHierarchyEntries: jest.fn(),
  getOrderedAddressHierarchyLevels: jest.fn(),
}));

// Mock registration config hook - with overridable return value
// Default: no strictAutocompleteFromLevel (all fields are plain text inputs)
const mockUseRegistrationConfig = jest.fn(() => ({
  registrationConfig: {
    patientInformation: {
      addressHierarchy: {
        showAddressFieldsTopDown: false,
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

const mockUseTranslation = useTranslation as jest.MockedFunction<
  typeof useTranslation
>;
const mockGetAddressHierarchyEntries =
  getAddressHierarchyEntries as jest.MockedFunction<
    typeof getAddressHierarchyEntries
  >;
const mockGetOrderedAddressHierarchyLevels =
  getOrderedAddressHierarchyLevels as jest.MockedFunction<
    typeof getOrderedAddressHierarchyLevels
  >;

// Helper to render with QueryClient and wait for async loading
const renderWithQueryClient = async (component: React.ReactElement) => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });
  const result = render(
    <QueryClientProvider client={queryClient}>{component}</QueryClientProvider>,
  );

  // Wait for address levels to load
  await waitFor(() => {
    expect(
      screen.queryByText('Loading address fields...'),
    ).not.toBeInTheDocument();
  });

  return result;
};

describe('AddressInfo', () => {
  const mockT = jest.fn((key: string) => key) as any;

  beforeEach(() => {
    jest.useFakeTimers();
    mockUseTranslation.mockReturnValue({ t: mockT } as any);
    mockGetAddressHierarchyEntries.mockClear();

    // Mock the address hierarchy levels from backend
    mockGetOrderedAddressHierarchyLevels.mockResolvedValue([
      {
        addressField: 'address1',
        name: 'CREATE_PATIENT_HOUSE_NUMBER',
        required: false,
      },
      {
        addressField: 'address2',
        name: 'CREATE_PATIENT_LOCALITY',
        required: false,
      },
      {
        addressField: 'stateProvince',
        name: 'CREATE_PATIENT_STATE',
        required: false,
      },
      {
        addressField: 'countyDistrict',
        name: 'CREATE_PATIENT_DISTRICT',
        required: false,
      },
      {
        addressField: 'cityVillage',
        name: 'CREATE_PATIENT_CITY',
        required: false,
      },
      {
        addressField: 'postalCode',
        name: 'CREATE_PATIENT_PINCODE',
        required: false,
      },
    ]);
  });

  afterEach(() => {
    act(() => {
      jest.runOnlyPendingTimers();
    });
    jest.useRealTimers();
    jest.clearAllMocks();
    // Reset mock to default
    mockUseRegistrationConfig.mockImplementation(() => ({
      registrationConfig: {
        patientInformation: {
          addressHierarchy: {
            showAddressFieldsTopDown: false,
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
  });

  describe('Rendering', () => {
    it('should render all address input fields correctly', async () => {
      await renderWithQueryClient(<AddressInfo />);

      expect(
        screen.getByLabelText(/CREATE_PATIENT_HOUSE_NUMBER/),
      ).toBeInTheDocument();
      expect(
        screen.getByLabelText(/CREATE_PATIENT_LOCALITY/),
      ).toBeInTheDocument();
      expect(
        screen.getByLabelText(/CREATE_PATIENT_DISTRICT/),
      ).toBeInTheDocument();
      expect(screen.getByLabelText(/CREATE_PATIENT_CITY/)).toBeInTheDocument();
      expect(screen.getByLabelText(/CREATE_PATIENT_STATE/)).toBeInTheDocument();
      expect(
        screen.getByLabelText(/CREATE_PATIENT_PINCODE/),
      ).toBeInTheDocument();
    });

    it('should render section title', async () => {
      await renderWithQueryClient(<AddressInfo />);
      expect(mockT).toHaveBeenCalledWith('CREATE_PATIENT_SECTION_ADDRESS_INFO');
    });

    it('should show loading state while fetching address levels', () => {
      const queryClient = new QueryClient();
      render(
        <QueryClientProvider client={queryClient}>
          <AddressInfo />
        </QueryClientProvider>,
      );
      expect(screen.getByText('Loading address fields...')).toBeInTheDocument();
    });
  });

  describe('Input Handling - Text Fields', () => {
    it('should update text fields when user types', async () => {
      await renderWithQueryClient(<AddressInfo />);

      const houseNumberInput = screen.getByLabelText(
        /CREATE_PATIENT_HOUSE_NUMBER/,
      );
      const localityInput = screen.getByLabelText(/CREATE_PATIENT_LOCALITY/);

      fireEvent.change(houseNumberInput, { target: { value: '123' } });
      fireEvent.change(localityInput, { target: { value: 'Street Name' } });

      expect(houseNumberInput).toHaveValue('123');
      expect(localityInput).toHaveValue('Street Name');
    });

    it('should allow clearing field values', async () => {
      await renderWithQueryClient(<AddressInfo />);

      const houseNumberInput = screen.getByLabelText(
        /CREATE_PATIENT_HOUSE_NUMBER/,
      );
      fireEvent.change(houseNumberInput, { target: { value: '123' } });
      expect(houseNumberInput).toHaveValue('123');

      fireEvent.change(houseNumberInput, { target: { value: '' } });
      expect(houseNumberInput).toHaveValue('');
    });
  });

  describe('getData Method', () => {
    it('should return empty object when no fields are filled', async () => {
      const ref = createRef<AddressInfoRef>();
      await renderWithQueryClient(<AddressInfo ref={ref} />);

      const data = ref.current?.getData();
      expect(data).toEqual({});
    });

    it('should return only filled fields', async () => {
      const ref = createRef<AddressInfoRef>();
      await renderWithQueryClient(<AddressInfo ref={ref} />);

      const houseNumberInput = screen.getByLabelText(
        /CREATE_PATIENT_HOUSE_NUMBER/,
      );
      fireEvent.change(houseNumberInput, { target: { value: '123' } });

      const data = ref.current?.getData();
      expect(data).toEqual({
        address1: '123',
      });
    });

    it('should return multiple filled fields', async () => {
      const ref = createRef<AddressInfoRef>();
      await renderWithQueryClient(<AddressInfo ref={ref} />);

      fireEvent.change(screen.getByLabelText(/CREATE_PATIENT_HOUSE_NUMBER/), {
        target: { value: '123' },
      });
      fireEvent.change(screen.getByLabelText(/CREATE_PATIENT_LOCALITY/), {
        target: { value: 'Street' },
      });

      const data = ref.current?.getData();
      expect(data).toEqual({
        address1: '123',
        address2: 'Street',
      });
    });
  });

  describe('Validation - Text Fields', () => {
    it('should pass validation when no fields are required', async () => {
      const ref = createRef<AddressInfoRef>();
      await renderWithQueryClient(<AddressInfo ref={ref} />);

      let isValid: boolean | undefined;
      act(() => {
        isValid = ref.current?.validate();
      });

      expect(isValid).toBe(true);
    });

    it('should pass validation for text fields with any value', async () => {
      const ref = createRef<AddressInfoRef>();
      await renderWithQueryClient(<AddressInfo ref={ref} />);

      fireEvent.change(screen.getByLabelText(/CREATE_PATIENT_HOUSE_NUMBER/), {
        target: { value: 'Any value' },
      });

      let isValid: boolean | undefined;
      act(() => {
        isValid = ref.current?.validate();
      });

      expect(isValid).toBe(true);
    });
  });

  describe('Autocomplete Fields with Strict Entry', () => {
    beforeEach(() => {
      // Configure strict autocomplete from countyDistrict
      // This makes countyDistrict and its parents (stateProvince, address2, address1) strict
      // while cityVillage and postalCode remain as plain text inputs
      mockUseRegistrationConfig.mockImplementation(
        () =>
          ({
            registrationConfig: {
              patientInformation: {
                addressHierarchy: {
                  showAddressFieldsTopDown: false,
                  strictAutocompleteFromLevel: 'countyDistrict',
                } as any,
              },
            },
            setRegistrationConfig: jest.fn(),
            isLoading: false,
            setIsLoading: jest.fn(),
            error: null,
            setError: jest.fn(),
            refetch: jest.fn(),
          }) as any,
      );
    });

    it('should clear only autocomplete fields when selecting autocomplete value, preserving free text child fields', async () => {
      // Setup: Fill in autocomplete field (district), then fill free text child fields (city, pincode)
      mockGetAddressHierarchyEntries.mockResolvedValue([
        {
          uuid: 'district-1',
          name: 'Mumbai District',
          userGeneratedId: null,
          parent: {
            uuid: 'state-1',
            name: 'Maharashtra',
            userGeneratedId: null,
            parent: {
              uuid: 'country-1',
              name: 'India',
              userGeneratedId: null,
            },
          },
        },
      ]);

      const ref = createRef<AddressInfoRef>();
      await renderWithQueryClient(<AddressInfo ref={ref} />);

      // Fill city (free text - child of district)
      const cityInput = screen.getByLabelText(/CREATE_PATIENT_CITY/);
      fireEvent.change(cityInput, { target: { value: 'Mumbai City' } });
      expect(cityInput).toHaveValue('Mumbai City');

      // Fill pincode (free text - child of city)
      const pincodeInput = screen.getByLabelText(/CREATE_PATIENT_PINCODE/);
      fireEvent.change(pincodeInput, { target: { value: '400001' } });
      expect(pincodeInput).toHaveValue('400001');

      // Select district from autocomplete (this will clear autocomplete descendants)
      const districtInput = screen.getByRole('combobox', {
        name: /CREATE_PATIENT_DISTRICT/,
      });
      fireEvent.change(districtInput, { target: { value: 'Mumbai' } });

      act(() => {
        jest.advanceTimersByTime(300);
      });

      await waitFor(() => {
        expect(screen.getByText(/Mumbai District/)).toBeInTheDocument();
      });

      // Click on the suggestion
      fireEvent.click(screen.getByText(/Mumbai District/));

      // Verify that free text fields (city and pincode) are preserved
      await waitFor(() => {
        expect(cityInput).toHaveValue('Mumbai City');
        expect(pincodeInput).toHaveValue('400001');
      });
    });

    it('should render ComboBox for strict autocomplete fields', async () => {
      await renderWithQueryClient(<AddressInfo />);

      // District should be a combobox (configured level)
      const districtInput = screen.getByRole('combobox', {
        name: /CREATE_PATIENT_DISTRICT/,
      });
      expect(districtInput).toBeInTheDocument();

      // Pincode should be plain text input (child of configured level)
      const pincodeInput = screen.getByLabelText(/CREATE_PATIENT_PINCODE/);
      expect(pincodeInput).toHaveAttribute('type', 'text');
      expect(pincodeInput).not.toHaveAttribute('role', 'combobox');
    });

    it('should trigger search when typing in autocomplete field', async () => {
      mockGetAddressHierarchyEntries.mockResolvedValue([
        {
          uuid: '1',
          name: 'Test District',
          userGeneratedId: null,
          parent: undefined,
        },
      ]);

      await renderWithQueryClient(<AddressInfo />);

      const districtInput = screen.getByRole('combobox', {
        name: /CREATE_PATIENT_DISTRICT/,
      });

      fireEvent.change(districtInput, { target: { value: 'Te' } });

      act(() => {
        jest.advanceTimersByTime(300);
      });

      await waitFor(() => {
        expect(mockGetAddressHierarchyEntries).toHaveBeenCalledWith(
          'countyDistrict',
          'Te',
          20,
          undefined,
        );
      });
    });

    it('should display suggestions when available', async () => {
      mockGetAddressHierarchyEntries.mockResolvedValue([
        {
          uuid: '1',
          name: 'District A',
          userGeneratedId: null,
          parent: { uuid: 'state-1', name: 'State A', userGeneratedId: null },
        },
      ]);

      await renderWithQueryClient(<AddressInfo />);

      const districtInput = screen.getByRole('combobox', {
        name: /CREATE_PATIENT_DISTRICT/,
      });

      fireEvent.change(districtInput, { target: { value: 'District' } });

      act(() => {
        jest.advanceTimersByTime(300);
      });

      await waitFor(() => {
        expect(screen.getByText(/District A/)).toBeInTheDocument();
      });
    });
  });

  describe('Debouncing', () => {
    beforeEach(() => {
      mockUseRegistrationConfig.mockImplementation(
        () =>
          ({
            registrationConfig: {
              patientInformation: {
                addressHierarchy: {
                  showAddressFieldsTopDown: false,
                  strictAutocompleteFromLevel: 'countyDistrict',
                } as any,
              },
            },
            setRegistrationConfig: jest.fn(),
            isLoading: false,
            setIsLoading: jest.fn(),
            error: null,
            setError: jest.fn(),
            refetch: jest.fn(),
          }) as any,
      );
    });

    it('should cancel previous debounced search when typing rapidly', async () => {
      mockGetAddressHierarchyEntries.mockResolvedValue([
        {
          uuid: '1',
          name: 'Test',
          userGeneratedId: null,
          parent: undefined,
        },
      ]);

      await renderWithQueryClient(<AddressInfo />);

      const districtInput = screen.getByRole('combobox', {
        name: /CREATE_PATIENT_DISTRICT/,
      });

      // Type rapidly
      fireEvent.change(districtInput, { target: { value: 'T' } });
      act(() => {
        jest.advanceTimersByTime(50);
      });

      fireEvent.change(districtInput, { target: { value: 'Te' } });
      act(() => {
        jest.advanceTimersByTime(50);
      });

      fireEvent.change(districtInput, { target: { value: 'Tes' } });
      act(() => {
        jest.advanceTimersByTime(50);
      });

      fireEvent.change(districtInput, { target: { value: 'Test' } });
      act(() => {
        jest.advanceTimersByTime(250);
      });

      act(() => {
        jest.runOnlyPendingTimers();
      });

      // Should only call once with the final value
      await waitFor(
        () => {
          expect(mockGetAddressHierarchyEntries).toHaveBeenCalledTimes(1);
          expect(mockGetAddressHierarchyEntries).toHaveBeenCalledWith(
            'countyDistrict',
            'Test',
            20,
            undefined,
          );
        },
        { timeout: 3000 },
      );
    });

    it('should debounce search and wait 200ms before API call', async () => {
      mockGetAddressHierarchyEntries.mockResolvedValue([
        {
          uuid: '1',
          name: 'Test District',
          userGeneratedId: null,
          parent: undefined,
        },
      ]);

      await renderWithQueryClient(<AddressInfo />);

      const districtInput = screen.getByRole('combobox', {
        name: /CREATE_PATIENT_DISTRICT/,
      });

      fireEvent.change(districtInput, { target: { value: 'Test' } });

      // Should not call immediately
      expect(mockGetAddressHierarchyEntries).not.toHaveBeenCalled();

      // Advance by 150ms
      act(() => {
        jest.advanceTimersByTime(150);
      });
      expect(mockGetAddressHierarchyEntries).not.toHaveBeenCalled();

      // Advance by another 100ms
      act(() => {
        jest.advanceTimersByTime(100);
      });

      await waitFor(() => {
        expect(mockGetAddressHierarchyEntries).toHaveBeenCalledWith(
          'countyDistrict',
          'Test',
          20,
          undefined,
        );
      });
    });
  });

  describe('Field Ordering Configuration', () => {
    it('should render fields in bottom-up order by default', async () => {
      await renderWithQueryClient(<AddressInfo />);

      const allInputs = screen.getAllByRole('textbox');
      const inputIds = allInputs.map((input) => input.getAttribute('id'));

      // Bottom-up means reversed order from API
      expect(inputIds).toEqual([
        'postalCode',
        'cityVillage',
        'countyDistrict',
        'stateProvince',
        'address2',
        'address1',
      ]);
    });

    it('should render fields in top-down order when configured', async () => {
      mockUseRegistrationConfig.mockReturnValue({
        registrationConfig: {
          patientInformation: {
            addressHierarchy: {
              showAddressFieldsTopDown: true,
            } as any,
          },
        },
        setRegistrationConfig: jest.fn(),
        isLoading: false,
        setIsLoading: jest.fn(),
        error: null,
        setError: jest.fn(),
        refetch: jest.fn(),
      } as any);

      await renderWithQueryClient(<AddressInfo />);

      const allInputs = screen.getAllByRole('textbox');
      const inputIds = allInputs.map((input) => input.getAttribute('id'));

      // Top-down means API order as-is
      expect(inputIds).toEqual([
        'address1',
        'address2',
        'stateProvince',
        'countyDistrict',
        'cityVillage',
        'postalCode',
      ]);
    });
  });

  describe('Field Value Preservation', () => {
    it('should preserve child field values when typing in a parent field', async () => {
      await renderWithQueryClient(<AddressInfo />);

      // In the mock hierarchy: address1 > address2 > stateProvince > countyDistrict > cityVillage > postalCode
      // postalCode is a descendant of cityVillage.
      // With showAddressFieldsTopDown=false, display order is reversed:
      // postalCode, cityVillage, countyDistrict, stateProvince, address2, address1
      // So the user types in postalCode first (child), then cityVillage (parent).
      const pincodeInput = screen.getByLabelText(/CREATE_PATIENT_PINCODE/);
      fireEvent.change(pincodeInput, { target: { value: '400001' } });
      expect(pincodeInput).toHaveValue('400001');

      // Now type in cityVillage - a parent of postalCode in the hierarchy
      const cityInput = screen.getByLabelText(/CREATE_PATIENT_CITY/);
      fireEvent.change(cityInput, { target: { value: 'Mumbai' } });

      // postalCode (child) should still have its value
      expect(pincodeInput).toHaveValue('400001');
      expect(cityInput).toHaveValue('Mumbai');
    });

    it('should preserve all field values when filling fields in display order', async () => {
      const ref = createRef<AddressInfoRef>();
      await renderWithQueryClient(<AddressInfo ref={ref} />);

      // Fill fields in the bottom-up display order (child → parent):
      // postalCode, cityVillage, countyDistrict, stateProvince, address2, address1
      fireEvent.change(screen.getByLabelText(/CREATE_PATIENT_PINCODE/), {
        target: { value: '400001' },
      });
      fireEvent.change(screen.getByLabelText(/CREATE_PATIENT_CITY/), {
        target: { value: 'Mumbai' },
      });
      fireEvent.change(screen.getByLabelText(/CREATE_PATIENT_DISTRICT/), {
        target: { value: 'Mumbai District' },
      });
      fireEvent.change(screen.getByLabelText(/CREATE_PATIENT_STATE/), {
        target: { value: 'Maharashtra' },
      });
      fireEvent.change(screen.getByLabelText(/CREATE_PATIENT_LOCALITY/), {
        target: { value: 'Andheri' },
      });
      fireEvent.change(screen.getByLabelText(/CREATE_PATIENT_HOUSE_NUMBER/), {
        target: { value: '42B' },
      });

      // All fields should retain their values
      const data = ref.current?.getData();
      expect(data).toEqual({
        address1: '42B',
        address2: 'Andheri',
        stateProvince: 'Maharashtra',
        countyDistrict: 'Mumbai District',
        cityVillage: 'Mumbai',
        postalCode: '400001',
      });
    });

    it('should preserve pre-filled field values when editing another field', async () => {
      const initialData = {
        address1: '123 Main St',
        address2: 'Locality A',
        stateProvince: 'State X',
        countyDistrict: 'District Y',
        cityVillage: 'City Z',
        postalCode: '12345',
      };

      await renderWithQueryClient(<AddressInfo initialData={initialData} />);

      // Verify initial values loaded
      expect(screen.getByLabelText(/CREATE_PATIENT_PINCODE/)).toHaveValue(
        '12345',
      );
      expect(screen.getByLabelText(/CREATE_PATIENT_CITY/)).toHaveValue(
        'City Z',
      );

      // Edit cityVillage (parent of postalCode in the hierarchy)
      fireEvent.change(screen.getByLabelText(/CREATE_PATIENT_CITY/), {
        target: { value: 'New City' },
      });

      // postalCode (child) should still have its value
      expect(screen.getByLabelText(/CREATE_PATIENT_PINCODE/)).toHaveValue(
        '12345',
      );
      expect(screen.getByLabelText(/CREATE_PATIENT_CITY/)).toHaveValue(
        'New City',
      );
    });
  });

  describe('Error Handling', () => {
    it('should show default fields when API fails', async () => {
      mockGetOrderedAddressHierarchyLevels.mockRejectedValue(
        new Error('API Error'),
      );

      const queryClient = new QueryClient({
        defaultOptions: {
          queries: {
            retry: false,
          },
        },
      });

      render(
        <QueryClientProvider client={queryClient}>
          <AddressInfo />
        </QueryClientProvider>,
      );

      // Query has retry: 2 configured, so need to wait for retries to complete
      // Should render default address fields after error with default labels
      await waitFor(
        () => {
          expect(
            screen.getByLabelText(/House Number \/ Flat/),
          ).toBeInTheDocument();
          expect(screen.getByLabelText(/Postal Code/)).toBeInTheDocument();
        },
        { timeout: 10000 },
      );
    });

    it('should handle empty API response', async () => {
      mockGetOrderedAddressHierarchyLevels.mockResolvedValue([]);

      await renderWithQueryClient(<AddressInfo />);

      // Should render default address fields with default labels
      await waitFor(() => {
        expect(
          screen.getByLabelText(/House Number \/ Flat/),
        ).toBeInTheDocument();
        expect(screen.getByLabelText(/Postal Code/)).toBeInTheDocument();
      });
    });
  });
});
