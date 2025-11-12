import {
  useTranslation,
  getAddressHierarchyEntries,
  type AddressHierarchyEntry,
} from '@bahmni-frontend/bahmni-services';
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
jest.mock('@bahmni-frontend/bahmni-services', () => ({
  useTranslation: jest.fn(),
  getAddressHierarchyEntries: jest.fn(),
}));

// Mock registration config hook
jest.mock('../../../../hooks/useRegistrationConfig', () => ({
  useRegistrationConfig: () => ({
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
  }),
}));

const mockUseTranslation = useTranslation as jest.MockedFunction<
  typeof useTranslation
>;
const mockGetAddressHierarchyEntries =
  getAddressHierarchyEntries as jest.MockedFunction<
    typeof getAddressHierarchyEntries
  >;

// Helper to render with QueryClient
const renderWithQueryClient = (component: React.ReactElement) => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });
  return render(
    <QueryClientProvider client={queryClient}>{component}</QueryClientProvider>,
  );
};

describe('AddressInfo', () => {
  const mockT = jest.fn((key: string) => key) as any;

  beforeEach(() => {
    jest.useFakeTimers();
    mockUseTranslation.mockReturnValue({ t: mockT } as any);
    mockGetAddressHierarchyEntries.mockClear();
  });

  afterEach(() => {
    act(() => {
      jest.runOnlyPendingTimers();
    });
    jest.useRealTimers();
    jest.clearAllMocks();
  });

  describe('Rendering', () => {
    it('renders all address input fields correctly', () => {
      renderWithQueryClient(<AddressInfo />);

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

    it('renders section title', () => {
      renderWithQueryClient(<AddressInfo />);

      expect(mockT).toHaveBeenCalledWith('CREATE_PATIENT_SECTION_ADDRESS_INFO');
    });
  });

  describe('Input Handling', () => {
    it('updates simple text fields without validation', () => {
      const ref = createRef<AddressInfoRef>();
      renderWithQueryClient(<AddressInfo ref={ref} />);

      const houseNumberInput = screen.getByLabelText(
        /CREATE_PATIENT_HOUSE_NUMBER/,
      );
      const localityInput = screen.getByLabelText(/CREATE_PATIENT_LOCALITY/);
      const cityInput = screen.getByLabelText(/CREATE_PATIENT_CITY/);

      fireEvent.change(houseNumberInput, { target: { value: '123' } });
      fireEvent.change(localityInput, { target: { value: 'Street Name' } });
      fireEvent.change(cityInput, { target: { value: 'Mumbai' } });

      expect(houseNumberInput).toHaveValue('123');
      expect(localityInput).toHaveValue('Street Name');
      expect(cityInput).toHaveValue('Mumbai');

      // Simple fields should not trigger validation errors
      let isValid: boolean | undefined;
      act(() => {
        isValid = ref.current?.validate();
      });
      expect(isValid).toBe(true);
    });

    it('allows clearing field values', () => {
      renderWithQueryClient(<AddressInfo />);

      const cityInput = screen.getByLabelText(/CREATE_PATIENT_CITY/);
      fireEvent.change(cityInput, { target: { value: 'Mumbai' } });
      expect(cityInput).toHaveValue('Mumbai');

      fireEvent.change(cityInput, { target: { value: '' } });
      expect(cityInput).toHaveValue('');
    });
  });

  describe('Validation', () => {
    it('validates that dropdown fields require selection from dropdown', () => {
      const ref = createRef<AddressInfoRef>();
      renderWithQueryClient(<AddressInfo ref={ref} />);

      const districtInput = screen.getByLabelText(/CREATE_PATIENT_DISTRICT/);
      fireEvent.change(districtInput, {
        target: { value: 'Invalid District' },
      });

      let isValid: boolean | undefined;
      act(() => {
        isValid = ref.current?.validate();
      });
      expect(isValid).toBe(false);
    });

    it('validates all three dropdown fields (district, state, pincode)', () => {
      const ref = createRef<AddressInfoRef>();
      renderWithQueryClient(<AddressInfo ref={ref} />);

      const districtInput = screen.getByLabelText(/CREATE_PATIENT_DISTRICT/);
      const stateInput = screen.getByLabelText(/CREATE_PATIENT_STATE/);
      const pincodeInput = screen.getByLabelText(/CREATE_PATIENT_PINCODE/);

      fireEvent.change(districtInput, { target: { value: 'Invalid' } });
      fireEvent.change(stateInput, { target: { value: 'Invalid' } });
      fireEvent.change(pincodeInput, { target: { value: 'Invalid' } });

      let isValid: boolean | undefined;
      act(() => {
        isValid = ref.current?.validate();
      });
      expect(isValid).toBe(false);
    });

    it('returns true when dropdown fields are empty', () => {
      const ref = createRef<AddressInfoRef>();
      renderWithQueryClient(<AddressInfo ref={ref} />);

      let isValid: boolean | undefined;
      act(() => {
        isValid = ref.current?.validate();
      });
      expect(isValid).toBe(true);
    });

    it('validates correctly after clearing a dropdown field', () => {
      const ref = createRef<AddressInfoRef>();
      renderWithQueryClient(<AddressInfo ref={ref} />);

      const districtInput = screen.getByLabelText(/CREATE_PATIENT_DISTRICT/);

      // Enter invalid value
      fireEvent.change(districtInput, { target: { value: 'Invalid' } });
      let isValid: boolean | undefined;
      act(() => {
        isValid = ref.current?.validate();
      });
      expect(isValid).toBe(false);

      // Clear the field
      fireEvent.change(districtInput, { target: { value: '' } });
      act(() => {
        isValid = ref.current?.validate();
      });
      expect(isValid).toBe(true);
    });
  });

  describe('Address Suggestions', () => {
    it('debounces search and fetches suggestions after 300ms', async () => {
      const mockSuggestions: AddressHierarchyEntry[] = [
        {
          uuid: '1',
          name: 'Test District',
          userGeneratedId: null,
          parent: undefined,
        },
      ];
      mockGetAddressHierarchyEntries.mockResolvedValue(mockSuggestions);

      renderWithQueryClient(<AddressInfo />);

      const districtInput = screen.getByLabelText(/CREATE_PATIENT_DISTRICT/);
      fireEvent.change(districtInput, { target: { value: 'Test' } });

      // Should not call immediately
      expect(mockGetAddressHierarchyEntries).not.toHaveBeenCalled();

      // Advance timers by debounce delay
      act(() => {
        jest.advanceTimersByTime(300);
      });

      await waitFor(() => {
        expect(mockGetAddressHierarchyEntries).toHaveBeenCalledWith(
          'countyDistrict',
          'Test',
        );
      });
    });

    it('does not fetch suggestions for short search terms (< 2 chars)', async () => {
      renderWithQueryClient(<AddressInfo />);

      const districtInput = screen.getByLabelText(/CREATE_PATIENT_DISTRICT/);
      fireEvent.change(districtInput, { target: { value: 'T' } });

      act(() => {
        jest.advanceTimersByTime(300);
      });

      await waitFor(() => {
        expect(mockGetAddressHierarchyEntries).not.toHaveBeenCalled();
      });
    });

    it('clears suggestions when input is cleared', async () => {
      const mockSuggestions: AddressHierarchyEntry[] = [
        {
          uuid: '1',
          name: 'Test District',
          userGeneratedId: null,
          parent: undefined,
        },
      ];
      mockGetAddressHierarchyEntries.mockResolvedValue(mockSuggestions);

      renderWithQueryClient(<AddressInfo />);

      const districtInput = screen.getByLabelText(/CREATE_PATIENT_DISTRICT/);

      // First, trigger suggestions
      fireEvent.change(districtInput, { target: { value: 'Test' } });
      act(() => {
        jest.advanceTimersByTime(300);
      });

      await waitFor(() => {
        expect(screen.getByText('Test District')).toBeInTheDocument();
      });

      // Clear input
      fireEvent.change(districtInput, { target: { value: '' } });
      act(() => {
        jest.advanceTimersByTime(300);
      });

      await waitFor(() => {
        expect(screen.queryByText('Test District')).not.toBeInTheDocument();
      });
    });

    it('displays suggestions when available', async () => {
      const mockSuggestions: AddressHierarchyEntry[] = [
        {
          uuid: '1',
          name: 'District A',
          userGeneratedId: null,
          parent: {
            uuid: 'state-x',
            name: 'State X',
            userGeneratedId: null,
            parent: undefined,
          },
        },
        {
          uuid: '2',
          name: 'District B',
          userGeneratedId: null,
          parent: {
            uuid: 'state-y',
            name: 'State Y',
            userGeneratedId: null,
            parent: undefined,
          },
        },
      ];
      mockGetAddressHierarchyEntries.mockResolvedValue(mockSuggestions);

      renderWithQueryClient(<AddressInfo />);

      const districtInput = screen.getByLabelText(/CREATE_PATIENT_DISTRICT/);
      fireEvent.change(districtInput, { target: { value: 'District' } });

      act(() => {
        jest.advanceTimersByTime(300);
      });

      await waitFor(() => {
        expect(screen.getByText('District A')).toBeInTheDocument();
        expect(screen.getByText('District B')).toBeInTheDocument();
        expect(screen.getByText('State X')).toBeInTheDocument();
        expect(screen.getByText('State Y')).toBeInTheDocument();
      });
    });

    it('handles API errors gracefully', async () => {
      mockGetAddressHierarchyEntries.mockRejectedValue(new Error('API Error'));

      renderWithQueryClient(<AddressInfo />);

      const districtInput = screen.getByLabelText(/CREATE_PATIENT_DISTRICT/);
      fireEvent.change(districtInput, { target: { value: 'Test' } });

      act(() => {
        jest.advanceTimersByTime(300);
      });

      await waitFor(() => {
        expect(mockGetAddressHierarchyEntries).toHaveBeenCalled();
      });

      // Should not display any suggestions or error messages
      expect(screen.queryByText('Test District')).not.toBeInTheDocument();
    });

    it('hides suggestions on blur after delay', async () => {
      const mockSuggestions: AddressHierarchyEntry[] = [
        {
          uuid: '1',
          name: 'Test District',
          userGeneratedId: null,
          parent: undefined,
        },
      ];
      mockGetAddressHierarchyEntries.mockResolvedValue(mockSuggestions);

      renderWithQueryClient(<AddressInfo />);

      const districtInput = screen.getByLabelText(/CREATE_PATIENT_DISTRICT/);
      fireEvent.change(districtInput, { target: { value: 'Test' } });

      act(() => {
        jest.advanceTimersByTime(300);
      });

      await waitFor(() => {
        expect(screen.getByText('Test District')).toBeInTheDocument();
      });

      fireEvent.blur(districtInput);

      // Advance by blur delay (200ms in component)
      act(() => {
        jest.advanceTimersByTime(200);
      });

      await waitFor(() => {
        expect(screen.queryByText('Test District')).not.toBeInTheDocument();
      });
    });

    it('shows suggestions on focus if they exist', async () => {
      const mockSuggestions: AddressHierarchyEntry[] = [
        {
          uuid: '1',
          name: 'Test District',
          userGeneratedId: null,
          parent: undefined,
        },
      ];
      mockGetAddressHierarchyEntries.mockResolvedValue(mockSuggestions);

      renderWithQueryClient(<AddressInfo />);

      const districtInput = screen.getByLabelText(/CREATE_PATIENT_DISTRICT/);

      // Trigger suggestions
      fireEvent.change(districtInput, { target: { value: 'Test' } });
      act(() => {
        jest.advanceTimersByTime(300);
      });

      await waitFor(() => {
        expect(screen.getByText('Test District')).toBeInTheDocument();
      });

      // Blur to hide
      fireEvent.blur(districtInput);
      act(() => {
        jest.advanceTimersByTime(200);
      });

      await waitFor(() => {
        expect(screen.queryByText('Test District')).not.toBeInTheDocument();
      });

      // Focus again should show suggestions
      fireEvent.focus(districtInput);

      await waitFor(() => {
        expect(screen.getByText('Test District')).toBeInTheDocument();
      });
    });
  });

  describe('Suggestion Selection', () => {
    it('selects district suggestion and updates state field', async () => {
      const mockEntry: AddressHierarchyEntry = {
        uuid: '123',
        name: 'Test District',
        userGeneratedId: null,
        parent: {
          uuid: 'state-123',
          name: 'Test State',
          userGeneratedId: null,
          parent: undefined,
        },
      };
      mockGetAddressHierarchyEntries.mockResolvedValue([mockEntry]);

      const ref = createRef<AddressInfoRef>();
      renderWithQueryClient(<AddressInfo ref={ref} />);

      const districtInput = screen.getByLabelText(/CREATE_PATIENT_DISTRICT/);
      fireEvent.change(districtInput, { target: { value: 'Test' } });

      act(() => {
        jest.advanceTimersByTime(300);
      });

      await waitFor(() => {
        expect(screen.getByText('Test District')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText('Test District'));

      expect(districtInput).toHaveValue('Test District');
      expect(screen.getByLabelText(/CREATE_PATIENT_STATE/)).toHaveValue(
        'Test State',
      );

      // Should pass validation after selection from dropdown
      let isValid: boolean | undefined;
      act(() => {
        isValid = ref.current?.validate();
      });
      expect(isValid).toBe(true);
    });

    it('selects postal code and cascades to district and state', async () => {
      const mockEntry: AddressHierarchyEntry = {
        uuid: '123',
        name: '400001',
        userGeneratedId: null,
        parent: {
          uuid: 'district-123',
          name: 'Mumbai District',
          userGeneratedId: null,
          parent: {
            uuid: 'state-123',
            name: 'Maharashtra',
            userGeneratedId: null,
            parent: undefined,
          },
        },
      };
      mockGetAddressHierarchyEntries.mockResolvedValue([mockEntry]);

      const ref = createRef<AddressInfoRef>();
      renderWithQueryClient(<AddressInfo ref={ref} />);

      const postalInput = screen.getByLabelText(/CREATE_PATIENT_PINCODE/);
      fireEvent.change(postalInput, { target: { value: '400' } });

      act(() => {
        jest.advanceTimersByTime(300);
      });

      await waitFor(() => {
        expect(screen.getByText('400001')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText('400001'));

      expect(postalInput).toHaveValue('400001');
      expect(screen.getByLabelText(/CREATE_PATIENT_DISTRICT/)).toHaveValue(
        'Mumbai District',
      );
      expect(screen.getByLabelText(/CREATE_PATIENT_STATE/)).toHaveValue(
        'Maharashtra',
      );

      // All fields should pass validation
      let isValid: boolean | undefined;
      act(() => {
        isValid = ref.current?.validate();
      });
      expect(isValid).toBe(true);
    });

    it('selects state suggestion without cascading', async () => {
      const mockEntry: AddressHierarchyEntry = {
        uuid: '123',
        name: 'Maharashtra',
        userGeneratedId: null,
        parent: undefined,
      };
      mockGetAddressHierarchyEntries.mockResolvedValue([mockEntry]);

      const ref = createRef<AddressInfoRef>();
      renderWithQueryClient(<AddressInfo ref={ref} />);

      const stateInput = screen.getByLabelText(/CREATE_PATIENT_STATE/);
      fireEvent.change(stateInput, { target: { value: 'Maha' } });

      act(() => {
        jest.advanceTimersByTime(300);
      });

      await waitFor(() => {
        expect(screen.getByText('Maharashtra')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText('Maharashtra'));

      expect(stateInput).toHaveValue('Maharashtra');

      // Should not update other fields
      expect(screen.getByLabelText(/CREATE_PATIENT_DISTRICT/)).toHaveValue('');
      expect(screen.getByLabelText(/CREATE_PATIENT_PINCODE/)).toHaveValue('');

      let isValid: boolean | undefined;
      act(() => {
        isValid = ref.current?.validate();
      });
      expect(isValid).toBe(true);
    });

    it('hides suggestions after selection', async () => {
      const mockEntry: AddressHierarchyEntry = {
        uuid: '123',
        name: 'Test District',
        userGeneratedId: null,
        parent: undefined,
      };
      mockGetAddressHierarchyEntries.mockResolvedValue([mockEntry]);

      renderWithQueryClient(<AddressInfo />);

      const districtInput = screen.getByLabelText(/CREATE_PATIENT_DISTRICT/);
      fireEvent.change(districtInput, { target: { value: 'Test' } });

      act(() => {
        jest.advanceTimersByTime(300);
      });

      await waitFor(() => {
        expect(screen.getByText('Test District')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText('Test District'));

      expect(screen.queryByText('Test District')).not.toBeInTheDocument();
    });

    it('clears validation errors when suggestion is selected', async () => {
      const mockEntry: AddressHierarchyEntry = {
        uuid: '123',
        name: 'Valid District',
        userGeneratedId: null,
        parent: undefined,
      };
      mockGetAddressHierarchyEntries.mockResolvedValue([mockEntry]);

      const ref = createRef<AddressInfoRef>();
      renderWithQueryClient(<AddressInfo ref={ref} />);

      const districtInput = screen.getByLabelText(/CREATE_PATIENT_DISTRICT/);

      // Type invalid value and validate
      fireEvent.change(districtInput, { target: { value: 'Invalid' } });
      let isValid: boolean | undefined;
      act(() => {
        isValid = ref.current?.validate();
      });
      expect(isValid).toBe(false);

      // Now select from dropdown
      fireEvent.change(districtInput, { target: { value: 'Valid' } });
      act(() => {
        jest.advanceTimersByTime(300);
      });

      await waitFor(() => {
        expect(screen.getByText('Valid District')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText('Valid District'));

      // Validation should pass after selection
      act(() => {
        isValid = ref.current?.validate();
      });
      expect(isValid).toBe(true);
    });
  });

  describe('getData Method', () => {
    it('returns empty object when no fields are filled', () => {
      const ref = createRef<AddressInfoRef>();
      renderWithQueryClient(<AddressInfo ref={ref} />);

      const data = ref.current?.getData();
      expect(data).toEqual({});
    });

    it('returns only filled fields', () => {
      const ref = createRef<AddressInfoRef>();
      renderWithQueryClient(<AddressInfo ref={ref} />);

      const cityInput = screen.getByLabelText(/CREATE_PATIENT_CITY/);
      fireEvent.change(cityInput, { target: { value: 'Mumbai' } });

      const data = ref.current?.getData();
      expect(data).toEqual({ cityVillage: 'Mumbai' });
    });

    it('returns all filled fields with correct property names', () => {
      const ref = createRef<AddressInfoRef>();
      renderWithQueryClient(<AddressInfo ref={ref} />);

      fireEvent.change(screen.getByLabelText(/CREATE_PATIENT_HOUSE_NUMBER/), {
        target: { value: '123' },
      });
      fireEvent.change(screen.getByLabelText(/CREATE_PATIENT_LOCALITY/), {
        target: { value: 'Street' },
      });
      fireEvent.change(screen.getByLabelText(/CREATE_PATIENT_DISTRICT/), {
        target: { value: 'District' },
      });
      fireEvent.change(screen.getByLabelText(/CREATE_PATIENT_CITY/), {
        target: { value: 'Mumbai' },
      });
      fireEvent.change(screen.getByLabelText(/CREATE_PATIENT_STATE/), {
        target: { value: 'Maharashtra' },
      });
      fireEvent.change(screen.getByLabelText(/CREATE_PATIENT_PINCODE/), {
        target: { value: '400001' },
      });

      const data = ref.current?.getData();
      expect(data).toEqual({
        address1: '123',
        address2: 'Street',
        countyDistrict: 'District',
        cityVillage: 'Mumbai',
        stateProvince: 'Maharashtra',
        postalCode: '400001',
      });
    });
  });

  describe('Debouncing', () => {
    it('cancels previous debounced search when typing rapidly', async () => {
      mockGetAddressHierarchyEntries.mockResolvedValue([
        {
          uuid: '1',
          name: 'Test',
          userGeneratedId: null,
          parent: undefined,
        },
      ]);

      renderWithQueryClient(<AddressInfo />);

      const districtInput = screen.getByLabelText(/CREATE_PATIENT_DISTRICT/);

      // Type rapidly
      fireEvent.change(districtInput, { target: { value: 'T' } });
      act(() => {
        jest.advanceTimersByTime(100);
      });

      fireEvent.change(districtInput, { target: { value: 'Te' } });
      act(() => {
        jest.advanceTimersByTime(100);
      });

      fireEvent.change(districtInput, { target: { value: 'Test' } });
      act(() => {
        jest.advanceTimersByTime(300);
      });

      // Should only call once with the final value
      await waitFor(() => {
        expect(mockGetAddressHierarchyEntries).toHaveBeenCalledTimes(1);
        expect(mockGetAddressHierarchyEntries).toHaveBeenCalledWith(
          'countyDistrict',
          'Test',
        );
      });
    });
  });

  describe('Field Ordering Configuration', () => {
    it('should render fields in bottom-up order by default', () => {
      const ref = createRef<AddressInfoRef>();
      renderWithQueryClient(<AddressInfo ref={ref} />);

      const allInputs = screen.getAllByRole('textbox');
      const inputIds = allInputs.map((input) => input.getAttribute('id'));

      // Expected bottom-up order: house-number, locality, district, city, state, pincode
      expect(inputIds).toEqual([
        'house-number',
        'locality',
        'district',
        'city',
        'state',
        'pincode',
      ]);
    });

    it('should display all address fields regardless of order', () => {
      const ref = createRef<AddressInfoRef>();
      renderWithQueryClient(<AddressInfo ref={ref} />);

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
      expect(
        screen.getByLabelText('CREATE_PATIENT_STATE'),
      ).toBeInTheDocument();
      expect(
        screen.getByLabelText('CREATE_PATIENT_PINCODE'),
      ).toBeInTheDocument();
    });
  });
});
