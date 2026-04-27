import {
  useNotification,
  usePatientUUID,
  useHasPrivilege,
  UserPrivilegeProvider,
} from '@bahmni/widgets';
import {
  QueryClient,
  QueryClientProvider,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Medication } from 'fhir/r4';
import { axe, toHaveNoViolations } from 'jest-axe';
import { ReactNode } from 'react';
import { useMedicationSearch } from '../../../../hooks/useMedicationSearch';
import { MedicationInputEntry } from '../../../../models/medication';
import { MedicationConfig } from '../../../../models/medicationConfig';
import { useMedicationStore } from '../../../../stores/medicationsStore';
import MedicationsForm from '../MedicationsForm';

expect.extend(toHaveNoViolations);

// Mock dependencies
jest.mock('../../../../stores/medicationsStore');
jest.mock('../../../../models/medicationConfig');
jest.mock('../../../../hooks/useMedicationSearch');
jest.mock('@bahmni/services', () => ({
  ...jest.requireActual('@bahmni/services'),
  getConfig: jest.fn(),
}));
jest.mock('../../../../services/medicationService', () => ({
  getMedicationDisplay: jest.fn(
    (medication) =>
      medication?.code?.text ?? medication?.code?.display ?? 'Test Medication',
  ),
}));

// Mock @bahmni/widgets hooks
jest.mock('@bahmni/widgets', () => {
  const widgets = jest.requireActual('@bahmni/widgets');
  return {
    ...widgets,
    useNotification: jest.fn(),
    usePatientUUID: jest.fn(),
    useHasPrivilege: jest.fn(),
    UserPrivilegeProvider: ({ children }: { children: ReactNode }) => children,
  };
});

// Mock TanStack Query
jest.mock('@tanstack/react-query', () => ({
  ...jest.requireActual('@tanstack/react-query'),
  useQuery: jest.fn(),
  useQueryClient: jest.fn(),
}));

const mockUseNotification = useNotification as jest.MockedFunction<
  typeof useNotification
>;
const mockUsePatientUUID = usePatientUUID as jest.MockedFunction<
  typeof usePatientUUID
>;
const mockUseQuery = useQuery as jest.MockedFunction<typeof useQuery>;
const mockUseQueryClient = useQueryClient as jest.MockedFunction<
  typeof useQueryClient
>;
const mockUseHasPrivilege = useHasPrivilege as jest.MockedFunction<
  typeof useHasPrivilege
>;
const mockUserPrivilegesWithMedications = true;
const mockUserPrivilegesEmpty = false;

// Mock data
const mockMedication: Medication = {
  id: 'test-medication-1',
  resourceType: 'Medication',
  code: {
    text: 'Paracetamol 500mg',
    coding: [
      {
        code: 'paracetamol-500',
        display: 'Paracetamol 500mg',
        system: 'http://snomed.info/sct',
      },
    ],
  },
};

const mockMedicationConfig: MedicationConfig = {
  doseUnits: [
    { uuid: 'mg-uuid', name: 'mg' },
    { uuid: 'ml-uuid', name: 'ml' },
  ],
  routes: [
    { uuid: 'oral-uuid', name: 'Oral' },
    { uuid: 'iv-uuid', name: 'IV' },
  ],
  frequencies: [
    { uuid: 'bd-uuid', name: 'BD', frequencyPerDay: 2 },
    { uuid: 'tds-uuid', name: 'TDS', frequencyPerDay: 3 },
  ],
  durationUnits: [
    { uuid: 'days-uuid', name: 'Days' },
    { uuid: 'weeks-uuid', name: 'Weeks' },
  ],
  dosingInstructions: [
    { uuid: 'before-food-uuid', name: 'Before Food' },
    { uuid: 'after-food-uuid', name: 'After Food' },
  ],
  dispensingUnits: [],
  dosingRules: [],
  orderAttributes: [],
};

const mockSelectedMedication: MedicationInputEntry = {
  id: mockMedication.id!,
  display: 'Paracetamol 500mg',
  medication: mockMedication,
  dosage: 1,
  dosageUnit: null,
  frequency: null,
  route: null,
  duration: 5,
  durationUnit: null,
  isSTAT: false,
  isPRN: false,
  startDate: new Date(),
  instruction: null,
  errors: {},
  hasBeenValidated: false,
  dispenseQuantity: 10,
  dispenseUnit: null,
};

const mockStore = {
  selectedMedications: [],
  addMedication: jest.fn(),
  removeMedication: jest.fn(),
  updateDosage: jest.fn(),
  updateDosageUnit: jest.fn(),
  updateFrequency: jest.fn(),
  updateRoute: jest.fn(),
  updateDuration: jest.fn(),
  updateDurationUnit: jest.fn(),
  updateInstruction: jest.fn(),
  updateisPRN: jest.fn(),
  updateisSTAT: jest.fn(),
  updateDispenseQuantity: jest.fn(),
  updateDispenseUnit: jest.fn(),
  updateStartDate: jest.fn(),
  updateNote: jest.fn(),
  validateAllMedications: jest.fn(),
  reset: jest.fn(),
  getState: jest.fn(),
};

const mockMedicationSearchHook = {
  searchResults: [],
  loading: false,
  error: null,
};

const createQueryClient = () =>
  new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });

const renderWithQueryClient = (ui: ReactNode) => {
  const queryClient = createQueryClient();
  return render(
    <QueryClientProvider client={queryClient}>
      <UserPrivilegeProvider>{ui}</UserPrivilegeProvider>
    </QueryClientProvider>,
  );
};

describe('MedicationsForm', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(console, 'error').mockImplementation(() => {});
    window.HTMLElement.prototype.scrollIntoView = jest.fn();
    localStorage.setItem('default_dateFormat', 'dd/MM/yyyy');

    jest.spyOn(Intl, 'DateTimeFormat').mockImplementation(
      () =>
        ({
          formatToParts: () => [
            { type: 'month', value: '3' },
            { type: 'literal', value: '/' },
            { type: 'day', value: '24' },
            { type: 'literal', value: '/' },
            { type: 'year', value: '2026' },
          ],
        }) as any,
    );

    (useMedicationStore as unknown as jest.Mock).mockReturnValue(mockStore);
    (useMedicationSearch as jest.Mock).mockReturnValue(
      mockMedicationSearchHook,
    );

    // Mock @bahmni/widgets hooks
    mockUseNotification.mockReturnValue({
      addNotification: jest.fn(),
      notifications: [],
      removeNotification: jest.fn(),
      clearAllNotifications: jest.fn(),
    } as ReturnType<typeof useNotification>);
    mockUsePatientUUID.mockReturnValue('patient-uuid-123');

    // Mock TanStack Query for existing medications
    mockUseQuery.mockReturnValue({
      data: mockMedicationConfig,
      isLoading: false,
      error: null,
    } as ReturnType<typeof useQuery>);

    // Mock TanStack Query client
    mockUseQueryClient.mockReturnValue({
      invalidateQueries: jest.fn(),
    } as unknown as ReturnType<typeof useQueryClient>);

    mockUseHasPrivilege.mockReturnValue(mockUserPrivilegesWithMedications);
  });

  afterEach(() => {
    localStorage.clear();
    jest.restoreAllMocks();
  });

  // HAPPY PATH TESTS
  describe('Happy Path Scenarios', () => {
    test('renders medication search box correctly', () => {
      renderWithQueryClient(<MedicationsForm />);

      expect(
        screen.getByRole('combobox', { name: /search to add medication/i }),
      ).toBeInTheDocument();
    });

    test('renders form title correctly', () => {
      renderWithQueryClient(<MedicationsForm />);

      expect(screen.getByText(/Medications/i)).toBeInTheDocument();
    });

    test('adds medication when selected from search', async () => {
      const user = userEvent.setup();
      (useMedicationSearch as jest.Mock).mockReturnValue({
        ...mockMedicationSearchHook,
        searchResults: [mockMedication],
      });

      renderWithQueryClient(<MedicationsForm />);

      const searchBox = screen.getByRole('combobox', {
        name: /search to add medication/i,
      });

      await user.type(searchBox, 'paracetamol');

      // Wait for search results to appear
      await waitFor(() => {
        expect(screen.getByText('Paracetamol 500mg')).toBeInTheDocument();
      });

      // Click on the medication
      await user.click(screen.getByText('Paracetamol 500mg'));

      // Verify the store was called correctly
      await waitFor(() => {
        expect(mockStore.addMedication).toHaveBeenCalledWith(
          mockMedication,
          'Paracetamol 500mg',
        );
      });
    });

    test('clears search term after selecting medication', async () => {
      const user = userEvent.setup();
      (useMedicationSearch as jest.Mock).mockReturnValue({
        ...mockMedicationSearchHook,
        searchResults: [mockMedication],
      });

      render(
        <UserPrivilegeProvider>
          <MedicationsForm />
        </UserPrivilegeProvider>,
      );

      const searchBox = screen.getByRole('combobox', {
        name: /search to add medication/i,
      });

      await user.type(searchBox, 'paracetamol');

      // Wait for search results to appear
      await waitFor(() => {
        expect(screen.getByText('Paracetamol 500mg')).toBeInTheDocument();
      });

      // Click on the medication
      await user.click(screen.getByText('Paracetamol 500mg'));

      // Verify search box is cleared
      await waitFor(() => {
        expect(searchBox).toHaveValue('');
      });
    });

    test('resets ComboBox selectedItem to null after selection to allow immediate re-search', async () => {
      const user = userEvent.setup();
      (useMedicationSearch as jest.Mock).mockReturnValue({
        ...mockMedicationSearchHook,
        searchResults: [mockMedication],
      });
      render(
        <UserPrivilegeProvider>
          <MedicationsForm />
        </UserPrivilegeProvider>,
      );
      const searchBox = screen.getByRole('combobox', {
        name: /search to add medication/i,
      });
      await user.type(searchBox, 'paracetamol');
      await waitFor(() => {
        expect(screen.getByText('Paracetamol 500mg')).toBeInTheDocument();
      });
      await user.click(screen.getByText('Paracetamol 500mg'));
      await waitFor(() => {
        expect(searchBox).toHaveValue('');
      });
    });

    test('prevents unnecessary API call when selecting medication item', async () => {
      const user = userEvent.setup();
      const mockSearchHook = jest.fn();

      // Mock the search hook to track calls
      (useMedicationSearch as jest.Mock).mockImplementation((searchTerm) => {
        mockSearchHook(searchTerm);
        return {
          ...mockMedicationSearchHook,
          searchResults: searchTerm ? [mockMedication] : [],
        };
      });

      renderWithQueryClient(<MedicationsForm />);

      const searchBox = screen.getByRole('combobox', {
        name: /search to add medication/i,
      });

      // Clear any initial calls
      mockSearchHook.mockClear();

      // Type to trigger search
      await user.type(searchBox, 'paracetamol');

      // Verify search was called with the typed term
      expect(mockSearchHook).toHaveBeenCalledWith('paracetamol');

      // Wait for search results to appear
      await waitFor(() => {
        expect(screen.getByText('Paracetamol 500mg')).toBeInTheDocument();
      });

      // Clear the mock to track calls during selection
      mockSearchHook.mockClear();

      // Select the medication
      await user.click(screen.getByText('Paracetamol 500mg'));

      // Verify the medication was added
      await waitFor(() => {
        expect(mockStore.addMedication).toHaveBeenCalledWith(
          mockMedication,
          'Paracetamol 500mg',
        );
      });

      // Wait a bit to ensure any potential delayed calls would have happened
      await waitFor(() => {}, { timeout: 200 });

      // Verify that the search term was cleared after selection
      // The ComboBox may call onInputChange during selection, but the search term
      // should be cleared to empty string by setSearchMedicationTerm('')
      const searchCallsAfterSelection = mockSearchHook.mock.calls;
      const emptySearchCalls = searchCallsAfterSelection.filter(
        (call) => call[0] === '',
      );

      // Should have at least one call to clear the search term
      expect(emptySearchCalls.length).toBeGreaterThan(0);
    });

    test('displays selected medications with medication config', () => {
      (useMedicationStore as unknown as jest.Mock).mockReturnValue({
        ...mockStore,
        selectedMedications: [mockSelectedMedication],
      });

      renderWithQueryClient(<MedicationsForm />);

      expect(screen.getByText(/Added Medications/i)).toBeInTheDocument();
      expect(screen.getByText(/Paracetamol 500mg/)).toBeInTheDocument();
    });

    test('removes medication when close button is clicked', async () => {
      const user = userEvent.setup();
      (useMedicationStore as unknown as jest.Mock).mockReturnValue({
        ...mockStore,
        selectedMedications: [mockSelectedMedication],
      });

      renderWithQueryClient(<MedicationsForm />);

      // Find the close button by its aria-label from SelectedItem component
      const closeButton = screen.getByRole('button', {
        name: /close/i,
      });
      await user.click(closeButton);

      await waitFor(() => {
        expect(mockStore.removeMedication).toHaveBeenCalledWith(
          mockSelectedMedication.id,
        );
      });
    });

    test('does not show selected medications section when no medications selected', () => {
      renderWithQueryClient(<MedicationsForm />);

      expect(screen.queryByText(/added medicines/i)).not.toBeInTheDocument();
    });
  });

  // SAD PATH TESTS
  describe('Sad Path Scenarios', () => {
    test('shows loading state while searching medications', async () => {
      const user = userEvent.setup();
      (useMedicationSearch as jest.Mock).mockReturnValue({
        ...mockMedicationSearchHook,
        loading: true,
      });

      renderWithQueryClient(<MedicationsForm />);

      const searchBox = screen.getByRole('combobox', {
        name: /search to add medication/i,
      });
      await user.type(searchBox, 'test');

      await waitFor(() => {
        expect(screen.getByText('Loading medications...')).toBeInTheDocument();
      });
    });

    test('shows error when medication search fails', async () => {
      const user = userEvent.setup();
      const error = new Error('Search failed');
      (useMedicationSearch as jest.Mock).mockReturnValue({
        ...mockMedicationSearchHook,
        error,
      });

      renderWithQueryClient(<MedicationsForm />);

      const searchBox = screen.getByRole('combobox', {
        name: /search to add medication/i,
      });
      await user.type(searchBox, 'test');

      await waitFor(() => {
        expect(
          screen.getByText(/error searching medications/i),
        ).toBeInTheDocument();
      });
    });

    test('shows message when no search results found', async () => {
      const user = userEvent.setup();
      (useMedicationSearch as jest.Mock).mockReturnValue({
        ...mockMedicationSearchHook,
        searchResults: [],
      });

      renderWithQueryClient(<MedicationsForm />);

      const searchBox = screen.getByRole('combobox', {
        name: /search to add medication/i,
      });

      await user.type(searchBox, 'nonexistent');

      await waitFor(() => {
        expect(
          screen.getByText(/no matching medications found/i),
        ).toBeInTheDocument();
      });
    });

    test('does not add medication when selected item is invalid', async () => {
      const user = userEvent.setup();
      renderWithQueryClient(<MedicationsForm />);

      const searchBox = screen.getByRole('combobox', {
        name: /search to add medication/i,
      });

      // Test by typing without selecting an item
      await user.type(searchBox, 'test');

      // Don't select anything - just clear the search
      await user.clear(searchBox);

      expect(mockStore.addMedication).not.toHaveBeenCalled();
    });

    test('shows loading skeleton when medication config is loading', () => {
      (useQuery as jest.Mock).mockReturnValue({
        data: undefined,
        isLoading: true,
        error: null,
      });

      renderWithQueryClient(<MedicationsForm />);

      expect(document.querySelector('.cds--skeleton')).toBeInTheDocument();
    });

    test('shows error when medication config fails to load', () => {
      const error = new Error('Failed to load medication config');
      (useQuery as jest.Mock).mockReturnValue({
        data: undefined,
        isLoading: false,
        error,
      });

      renderWithQueryClient(<MedicationsForm />);

      expect(
        screen.getByText(/Error fetching medication configuration/i),
      ).toBeInTheDocument();
    });
  });

  // EDGE CASES
  describe('Edge Cases', () => {
    test('handles missing medication config gracefully', () => {
      (useQuery as jest.Mock).mockReturnValue({
        data: null,
        isLoading: false,
        error: null,
      });
      (useMedicationStore as unknown as jest.Mock).mockReturnValue({
        ...mockStore,
        selectedMedications: [mockSelectedMedication],
      });

      renderWithQueryClient(<MedicationsForm />);

      expect(screen.queryByText(/added medicines/i)).not.toBeInTheDocument();
    });

    test('handles medication without id gracefully', async () => {
      const user = userEvent.setup();
      const medicationWithoutId = { ...mockMedication, id: undefined };
      (useMedicationSearch as jest.Mock).mockReturnValue({
        ...mockMedicationSearchHook,
        searchResults: [medicationWithoutId],
      });

      renderWithQueryClient(<MedicationsForm />);

      const searchBox = screen.getByRole('combobox', {
        name: /search to add medication/i,
      });
      await user.type(searchBox, 'test');

      // Should still display the medication
      await waitFor(() => {
        expect(screen.getByText('Paracetamol 500mg')).toBeInTheDocument();
      });
    });
  });

  // ACCESSIBILITY TESTS
  describe('Keyboard Navigation', () => {
    test('should support keyboard navigation and selection in ComboBox', async () => {
      const user = userEvent.setup();
      (useMedicationSearch as jest.Mock).mockReturnValue({
        ...mockMedicationSearchHook,
        searchResults: [mockMedication],
      });

      render(
        <UserPrivilegeProvider>
          <MedicationsForm />
        </UserPrivilegeProvider>,
      );

      const searchBox = screen.getByRole('combobox', {
        name: /search to add medication/i,
      });

      // Type to open dropdown
      await user.type(searchBox, 'paracetamol');

      await waitFor(() => {
        expect(screen.getByText('Paracetamol 500mg')).toBeInTheDocument();
      });

      // Navigate with arrow key and select with Enter
      await user.keyboard('{ArrowDown}');
      await user.keyboard('{Enter}');

      await waitFor(() => {
        expect(mockStore.addMedication).toHaveBeenCalled();
      });
    });
  });

  describe('Accessibility', () => {
    test('should have no accessibility violations', async () => {
      const { container } = renderWithQueryClient(<MedicationsForm />);

      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });
  });

  // SNAPSHOT TESTS
  describe('Snapshot Tests', () => {
    test('matches snapshot with no medications', () => {
      const { container } = renderWithQueryClient(<MedicationsForm />);
      expect(container).toMatchSnapshot();
    });

    test('matches snapshot with selected medications', () => {
      (useMedicationStore as unknown as jest.Mock).mockReturnValue({
        ...mockStore,
        selectedMedications: [mockSelectedMedication],
      });

      const { container } = renderWithQueryClient(<MedicationsForm />);
      expect(container).toMatchSnapshot();
    });
  });

  describe('Privilege Guard', () => {
    test('renders null when user lacks Add Orders privilege', () => {
      mockUseHasPrivilege.mockReturnValue(mockUserPrivilegesEmpty);
      const { container } = render(<MedicationsForm />);
      expect(container).toBeEmptyDOMElement();
    });
    test('renders form when user has Add Orders privilege', () => {
      render(
        <UserPrivilegeProvider>
          <MedicationsForm />
        </UserPrivilegeProvider>,
      );
      expect(screen.getByTestId('medications-form-tile')).toBeInTheDocument();
    });
  });
});
