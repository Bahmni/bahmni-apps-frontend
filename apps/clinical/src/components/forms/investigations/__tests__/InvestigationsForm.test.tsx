import { useHasPrivilege, UserPrivilegeProvider } from '@bahmni/widgets';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { axe, toHaveNoViolations } from 'jest-axe';
import React from 'react';
import useInvestigationsSearch from '../../../../hooks/useInvestigationsSearch';
import type { FlattenedInvestigations } from '../../../../models/investigations';
import useServiceRequestStore from '../../../../stores/serviceRequestStore';
import InvestigationsForm from '../InvestigationsForm';

expect.extend(toHaveNoViolations);

Element.prototype.scrollIntoView = jest.fn();

jest.mock('../styles/InvestigationsForm.module.scss', () => ({
  investigationsFormTile: 'investigationsFormTile',
  investigationsFormTitle: 'investigationsFormTitle',
  addedInvestigationsBox: 'addedInvestigationsBox',
  selectedInvestigationItem: 'selectedInvestigationItem',
  duplicateNotification: 'duplicateNotification',
}));

jest.mock('../../../../hooks/useInvestigationsSearch');
jest.mock('../../../../stores/serviceRequestStore');

jest.mock('@bahmni/services', () => ({
  ...jest.requireActual('@bahmni/services'),
  getOrderTypes: jest.fn().mockResolvedValue({
    results: [
      { uuid: 'lab', display: 'Lab Order', conceptClasses: [] },
      { uuid: 'rad', display: 'Radiology Order', conceptClasses: [] },
      { uuid: 'proc', display: 'Procedure Order', conceptClasses: [] },
    ],
  }),
  getExistingServiceRequestsForAllCategories: jest.fn().mockResolvedValue([]),
}));

jest.mock('@bahmni/widgets', () => ({
  ...jest.requireActual('@bahmni/widgets'),
  usePatientUUID: jest.fn().mockReturnValue('mock-patient-uuid'),
  useActivePractitioner: jest.fn().mockReturnValue({
    practitioner: { uuid: 'mock-practitioner-uuid' },
  }),
  useHasPrivilege: jest.fn(),
  UserPrivilegeProvider: ({ children }: { children: React.ReactNode }) =>
    children,
}));

jest.mock('../../../../hooks/useEncounterSession', () => ({
  useEncounterSession: jest.fn().mockReturnValue({
    activeEncounter: { id: 'mock-encounter-id' },
  }),
}));

jest.mock('../../../../hooks/useClinicalAppData', () => ({
  useClinicalAppData: jest.fn().mockReturnValue({
    episodeOfCare: [],
    visit: [],
    encounter: [],
    isLoading: false,
    error: null,
  }),
}));

jest.mock('@bahmni/design-system', () => ({
  ...jest.requireActual('@bahmni/design-system'),
  BoxHeader: ({ children, title, className }: any) => (
    <div className={className} data-testid="box-header">
      <h3>{title}</h3>
      {children}
    </div>
  ),
  SelectedItem: ({ children, onClose, className }: any) => (
    <div className={className} data-testid="selected-item">
      {children}
      <button onClick={onClose} aria-label="Remove">
        ×
      </button>
    </div>
  ),
}));

jest.mock('../SelectedInvestigationItem', () => ({
  __esModule: true,

  default: ({ investigation, onPriorityChange, onNoteChange }: any) => (
    <div data-testid="selected-investigation-item">
      <span>{investigation.display}</span>
      <input
        type="checkbox"
        onChange={(e) =>
          onPriorityChange(e.target.checked ? 'stat' : 'routine')
        }
        aria-label="Set as urgent"
      />
      <input
        type="text"
        onChange={(e) => onNoteChange(e.target.value)}
        aria-label="Add note"
        placeholder="Add a note"
      />
    </div>
  ),
}));

const mockInvestigations: FlattenedInvestigations[] = [
  {
    code: 'cbc-001',
    display: 'Complete Blood Count',
    category: 'Lab Order',
    categoryCode: 'lab',
  },
  {
    code: 'glucose-001',
    display: 'Blood Glucose Test',
    category: 'Lab Order',
    categoryCode: 'lab',
  },
  {
    code: 'xray-001',
    display: 'Chest X-Ray',
    category: 'Radiology Order',
    categoryCode: 'rad',
  },
];
const mockUseHasPrivilege = useHasPrivilege as jest.MockedFunction<
  typeof useHasPrivilege
>;

const mockUserPrivilegesWithInvestigations = true;

const mockUserPrivilegesEmpty = false;

const mockStore = {
  selectedServiceRequests: new Map(),
  addServiceRequest: jest.fn(),
  removeServiceRequest: jest.fn(),
  updatePriority: jest.fn(),
  updateNote: jest.fn(),
  reset: jest.fn(),
  getState: jest.fn(() => ({
    selectedServiceRequests: new Map(),
  })),
  isSelectedInCategory: jest.fn(() => false),
};

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });
  const Wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      <UserPrivilegeProvider>{children}</UserPrivilegeProvider>
    </QueryClientProvider>
  );
  Wrapper.displayName = 'QueryClientWrapper';
  return Wrapper;
};

describe('InvestigationsForm', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseHasPrivilege.mockReturnValue(mockUserPrivilegesWithInvestigations);
    // Setup default mocks
    (useInvestigationsSearch as jest.Mock).mockReturnValue({
      investigations: [],
      isLoading: false,
      error: null,
    });

    (useServiceRequestStore as unknown as jest.Mock).mockReturnValue(mockStore);
  });

  describe('Component Rendering', () => {
    test('renders form with title and search combobox', () => {
      render(<InvestigationsForm />, { wrapper: createWrapper() });

      expect(
        screen.getByText('Order Investigations/Procedures'),
      ).toBeInTheDocument();
      const combobox = screen.getByRole('combobox');
      expect(combobox).toBeInTheDocument();
      expect(combobox).toHaveAttribute(
        'id',
        'investigations-procedures-search',
      );
      expect(combobox).toHaveAttribute(
        'placeholder',
        'Search to add Investigation/Procedure',
      );
      expect(combobox).toHaveAttribute(
        'aria-label',
        'Search for investigations/prcedures',
      );
    });
  });

  describe('Search Functionality', () => {
    test('updates search term on input change', async () => {
      const user = userEvent.setup();

      render(<InvestigationsForm />, { wrapper: createWrapper() });

      const combobox = screen.getByRole('combobox');
      await user.type(combobox, 'blood');

      expect(combobox).toHaveValue('blood');
    });

    test('displays loading state when searching', async () => {
      (useInvestigationsSearch as jest.Mock).mockReturnValue({
        investigations: [],
        isLoading: true,
        error: null,
      });

      const user = userEvent.setup();

      render(<InvestigationsForm />, { wrapper: createWrapper() });

      const combobox = screen.getByRole('combobox');
      await user.type(combobox, 'test');
      await waitFor(() => {
        expect(screen.getByText(/loading concepts.../i)).toBeInTheDocument();
      });
    });

    test('displays error state when search fails', async () => {
      const mockError = new Error('Failed to fetch investigations');
      (useInvestigationsSearch as jest.Mock).mockReturnValue({
        investigations: [],
        isLoading: false,
        error: mockError,
      });

      const user = userEvent.setup();

      render(<InvestigationsForm />, { wrapper: createWrapper() });

      const combobox = screen.getByRole('combobox');
      await user.type(combobox, 'test');

      await waitFor(() => {
        expect(
          screen.getByText(/error searching investigations/i),
        ).toBeInTheDocument();
      });
    });

    test('displays no results message when search returns empty', async () => {
      (useInvestigationsSearch as jest.Mock).mockReturnValue({
        investigations: [],
        isLoading: false,
        error: null,
      });

      const user = userEvent.setup();

      render(<InvestigationsForm />, { wrapper: createWrapper() });

      const combobox = screen.getByRole('combobox');
      await user.type(combobox, 'nonexistent');
      await waitFor(() => {
        expect(
          screen.getByText(/no matching investigations found/i),
        ).toBeInTheDocument();
      });
    });

    test('displays investigations grouped by category', async () => {
      (useInvestigationsSearch as jest.Mock).mockReturnValue({
        investigations: mockInvestigations,
        isLoading: false,
        error: null,
      });

      const user = userEvent.setup();

      render(<InvestigationsForm />, { wrapper: createWrapper() });

      const combobox = screen.getByRole('combobox');
      await user.type(combobox, 'test');

      // The investigations are filtered and grouped in the component
      expect(combobox).toHaveValue('test');
      await waitFor(() => {
        const options = screen.getAllByRole('option');
        expect(options).toHaveLength(5);
        expect(options[0]).toHaveTextContent('LAB ORDER');
        expect(options[1]).toHaveTextContent('Complete Blood Count');
        expect(options[2]).toHaveTextContent('Blood Glucose Test');
        expect(options[3]).toHaveTextContent('RADIOLOGY ORDER');
        expect(options[4]).toHaveTextContent('Chest X-Ray');
      });
    });

    test('displays investigations grouped by category when search results are mixed by category', async () => {
      const mixedMockInvestigations = [
        {
          code: 'cd8',
          display: 'CD8%',
          category: 'Lab Order',
          categoryCode: 'lab',
        },
        {
          code: 'chest-xray-002',
          display: 'Chest X-Ray AP',
          category: 'Radiology Order',
          categoryCode: 'rad',
        },
        {
          code: 'cd3',
          display: 'CD3%',
          category: 'Lab Order',
          categoryCode: 'lab',
        },
      ];
      (useInvestigationsSearch as jest.Mock).mockReturnValue({
        investigations: mixedMockInvestigations,
        isLoading: false,
        error: null,
      });

      const user = userEvent.setup();

      render(<InvestigationsForm />, { wrapper: createWrapper() });

      const combobox = screen.getByRole('combobox');
      await user.type(combobox, 'test');

      // The investigations are filtered and grouped in the component
      expect(combobox).toHaveValue('test');
      await waitFor(() => {
        const options = screen.getAllByRole('option');
        expect(options).toHaveLength(5);
        expect(options[0]).toHaveTextContent('LAB ORDER');
        expect(options[1]).toHaveTextContent('CD8%');
        expect(options[2]).toHaveTextContent('CD3%');
        expect(options[3]).toHaveTextContent('RADIOLOGY ORDER');
        expect(options[4]).toHaveTextContent('Chest X-Ray AP');
      });
    });
  });

  describe('Investigation Selection', () => {
    test('adds investigation when selected from dropdown', async () => {
      const user = userEvent.setup();
      (useInvestigationsSearch as jest.Mock).mockReturnValue({
        investigations: mockInvestigations,
        isLoading: false,
        error: null,
      });

      render(<InvestigationsForm />, { wrapper: createWrapper() });

      // Simulate selecting an investigation by calling the onChange handler
      const combobox = screen.getByRole('combobox');

      await waitFor(async () => {
        await user.type(combobox, 'complete');
      });

      // Wait for the dropdown item to appear
      await waitFor(() => {
        expect(screen.getByText('Complete Blood Count')).toBeInTheDocument();
      });

      // Click on the dropdown item
      await waitFor(async () => {
        await user.click(screen.getByText('Complete Blood Count'));
      });

      // Verify the store was called correctly
      await waitFor(() => {
        expect(mockStore.addServiceRequest).toHaveBeenCalledWith(
          'Lab Order',
          'cbc-001',
          'Complete Blood Count',
        );
      });
    });

    test('clears search term after selecting investigation', async () => {
      const user = userEvent.setup();
      (useInvestigationsSearch as jest.Mock).mockReturnValue({
        investigations: mockInvestigations,
        isLoading: false,
        error: null,
      });
      render(<InvestigationsForm />, { wrapper: createWrapper() });
      const combobox = screen.getByRole('combobox');
      await user.type(combobox, 'complete');
      await waitFor(() => {
        expect(screen.getByText('Complete Blood Count')).toBeInTheDocument();
      });
      await user.click(screen.getByText('Complete Blood Count'));
      await waitFor(() => {
        expect(combobox).toHaveValue('');
      });
    });

    test('resets ComboBox selectedItem to null after selection to allow immediate re-search', async () => {
      const user = userEvent.setup();
      (useInvestigationsSearch as jest.Mock).mockReturnValue({
        investigations: mockInvestigations,
        isLoading: false,
        error: null,
      });
      render(<InvestigationsForm />, { wrapper: createWrapper() });
      const combobox = screen.getByRole('combobox');

      // First selection
      await user.type(combobox, 'complete');
      await waitFor(() => {
        expect(screen.getByText('Complete Blood Count')).toBeInTheDocument();
      });
      await user.click(screen.getByText('Complete Blood Count'));

      // Verify combobox is reset (selectedItem is null, allowing new searches)
      await waitFor(() => {
        expect(combobox).toHaveValue('');
      });

      // Verify we can immediately search for another item (proves selectedItem was reset to null)
      await user.type(combobox, 'glucose');
      await waitFor(() => {
        expect(screen.getByText('Blood Glucose Test')).toBeInTheDocument();
      });

      // Verify the new search works correctly - this proves selectedItem is null
      // because the ComboBox wouldn't accept new input if selectedItem was still set
      await user.click(screen.getByText('Blood Glucose Test'));
      expect(mockStore.addServiceRequest).toHaveBeenCalledWith(
        'Lab Order',
        'glucose-001',
        'Blood Glucose Test',
      );
    });
  });

  describe('Selected Investigations Display', () => {
    test('displays selected investigations grouped by category', () => {
      const selectedMap = new Map([
        [
          'Lab Order',
          [
            {
              id: 'cbc-001',
              display: 'Complete Blood Count',
              selectedPriority: 'routine',
            },
            {
              id: 'glucose-001',
              display: 'Blood Glucose Test',
              selectedPriority: 'stat',
            },
          ],
        ],
        [
          'Radiology Order',
          [
            {
              id: 'xray-001',
              display: 'Chest X-Ray',
              selectedPriority: 'routine',
            },
          ],
        ],
      ]);

      (useServiceRequestStore as unknown as jest.Mock).mockReturnValue({
        ...mockStore,
        selectedServiceRequests: selectedMap,
      });

      render(<InvestigationsForm />, { wrapper: createWrapper() });

      // Check category headers
      expect(screen.getByText('Added Lab Order')).toBeInTheDocument();
      expect(screen.getByText('Added Radiology Order')).toBeInTheDocument();

      // Check investigations
      expect(screen.getByText('Complete Blood Count')).toBeInTheDocument();
      expect(screen.getByText('Blood Glucose Test')).toBeInTheDocument();
      expect(screen.getByText('Chest X-Ray')).toBeInTheDocument();
    });

    test('removes investigation when close button is clicked', async () => {
      const selectedMap = new Map([
        [
          'Lab Order',
          [
            {
              id: 'cbc-001',
              display: 'Complete Blood Count',
              selectedPriority: 'routine',
            },
          ],
        ],
      ]);

      (useServiceRequestStore as unknown as jest.Mock).mockReturnValue({
        ...mockStore,
        selectedServiceRequests: selectedMap,
      });

      const user = userEvent.setup();

      render(<InvestigationsForm />, { wrapper: createWrapper() });

      const removeButton = screen.getByLabelText('Remove');
      await user.click(removeButton);

      expect(mockStore.removeServiceRequest).toHaveBeenCalledWith(
        'Lab Order',
        'cbc-001',
      );
    });

    test('updates priority when urgent checkbox is toggled', async () => {
      const selectedMap = new Map([
        [
          'Lab Order',
          [
            {
              id: 'cbc-001',
              display: 'Complete Blood Count',
              selectedPriority: 'routine',
            },
          ],
        ],
      ]);

      (useServiceRequestStore as unknown as jest.Mock).mockReturnValue({
        ...mockStore,
        selectedServiceRequests: selectedMap,
      });

      const user = userEvent.setup();

      render(<InvestigationsForm />, { wrapper: createWrapper() });

      const urgentCheckbox = screen.getByLabelText('Set as urgent');
      await user.click(urgentCheckbox);

      expect(mockStore.updatePriority).toHaveBeenCalledWith(
        'Lab Order',
        'cbc-001',
        'stat',
      );
    });

    test('updates note when note input is changed', async () => {
      const selectedMap = new Map([
        [
          'Lab Order',
          [
            {
              id: 'cbc-001',
              display: 'Complete Blood Count',
              selectedPriority: 'routine',
            },
          ],
        ],
      ]);

      (useServiceRequestStore as unknown as jest.Mock).mockReturnValue({
        ...mockStore,
        selectedServiceRequests: selectedMap,
      });

      const user = userEvent.setup();

      render(<InvestigationsForm />, { wrapper: createWrapper() });

      const noteInput = screen.getByLabelText('Add note');
      await user.type(noteInput, 'Patient has low hemoglobin');

      expect(mockStore.updateNote).toHaveBeenCalledWith(
        'Lab Order',
        'cbc-001',
        'Patient has low hemoglobin',
      );
    });

    test('updates note for multiple investigations independently', async () => {
      const selectedMap = new Map([
        [
          'Lab Order',
          [
            {
              id: 'cbc-001',
              display: 'Complete Blood Count',
              selectedPriority: 'routine',
            },
            {
              id: 'glucose-001',
              display: 'Blood Glucose Test',
              selectedPriority: 'stat',
            },
          ],
        ],
      ]);

      (useServiceRequestStore as unknown as jest.Mock).mockReturnValue({
        ...mockStore,
        selectedServiceRequests: selectedMap,
      });

      const user = userEvent.setup();

      render(<InvestigationsForm />, { wrapper: createWrapper() });

      const noteInputs = screen.getAllByLabelText('Add note');
      expect(noteInputs).toHaveLength(2);

      await user.type(noteInputs[0], 'Note for CBC');
      expect(mockStore.updateNote).toHaveBeenCalledWith(
        'Lab Order',
        'cbc-001',
        'Note for CBC',
      );

      await user.type(noteInputs[1], 'Note for Glucose');
      expect(mockStore.updateNote).toHaveBeenCalledWith(
        'Lab Order',
        'glucose-001',
        'Note for Glucose',
      );
    });

    test('updates note for investigations across different categories', async () => {
      const selectedMap = new Map([
        [
          'Lab Order',
          [
            {
              id: 'cbc-001',
              display: 'Complete Blood Count',
              selectedPriority: 'routine',
            },
          ],
        ],
        [
          'Radiology Order',
          [
            {
              id: 'xray-001',
              display: 'Chest X-Ray',
              selectedPriority: 'routine',
            },
          ],
        ],
      ]);

      (useServiceRequestStore as unknown as jest.Mock).mockReturnValue({
        ...mockStore,
        selectedServiceRequests: selectedMap,
      });

      const user = userEvent.setup();

      render(<InvestigationsForm />, { wrapper: createWrapper() });

      const noteInputs = screen.getAllByLabelText('Add note');
      expect(noteInputs).toHaveLength(2);

      await user.type(noteInputs[0], 'CBC note');
      expect(mockStore.updateNote).toHaveBeenCalledWith(
        'Lab Order',
        'cbc-001',
        'CBC note',
      );

      await user.type(noteInputs[1], 'X-Ray note');
      expect(mockStore.updateNote).toHaveBeenCalledWith(
        'Radiology Order',
        'xray-001',
        'X-Ray note',
      );
    });
  });

  describe('Already Selected Items', () => {
    test('displays already selected items as disabled with appropriate text', async () => {
      const selectedMap = new Map([
        [
          'Lab Order',
          [
            {
              id: 'cbc-001',
              display: 'Complete Blood Count',
              selectedPriority: 'routine',
            },
          ],
        ],
      ]);

      (useServiceRequestStore as unknown as jest.Mock).mockReturnValue({
        ...mockStore,
        selectedServiceRequests: selectedMap,
      });

      (useInvestigationsSearch as jest.Mock).mockReturnValue({
        investigations: mockInvestigations,
        isLoading: false,
        error: null,
      });

      const user = userEvent.setup();

      render(<InvestigationsForm />, { wrapper: createWrapper() });

      const combobox = screen.getByRole('combobox');
      await user.type(combobox, 'blood');

      await waitFor(() => {
        const options = screen.getAllByRole('option');
        // Find the Complete Blood Count option
        const cbcOption = options.find((option) =>
          option.textContent?.includes('Complete Blood Count'),
        );
        expect(cbcOption?.textContent).toMatch(
          /Complete Blood Count.*already/i,
        );
        expect(cbcOption).toHaveAttribute('disabled');
      });
    });

    test('prevents selection of already selected items', async () => {
      const selectedMap = new Map([
        [
          'Lab Order',
          [
            {
              id: 'cbc-001',
              display: 'Complete Blood Count',
              selectedPriority: 'routine',
            },
          ],
        ],
      ]);

      (useServiceRequestStore as unknown as jest.Mock).mockReturnValue({
        ...mockStore,
        selectedServiceRequests: selectedMap,
      });

      (useInvestigationsSearch as jest.Mock).mockReturnValue({
        investigations: mockInvestigations,
        isLoading: false,
        error: null,
      });

      const user = userEvent.setup();

      render(<InvestigationsForm />, { wrapper: createWrapper() });

      const combobox = screen.getByRole('combobox');
      await user.type(combobox, 'complete');

      await waitFor(() => {
        const cbcOption = screen.getByText(/Complete Blood Count.*already/i);
        expect(cbcOption).toBeInTheDocument();
      });

      // Try to click the disabled option
      const cbcOption = screen.getByText(/Complete Blood Count.*already/i);
      await user.click(cbcOption);

      // Verify that addServiceRequest was NOT called since the item is disabled
      expect(mockStore.addServiceRequest).not.toHaveBeenCalled();
    });

    test('allows selection of non-selected items when some items are already selected', async () => {
      const selectedMap = new Map([
        [
          'Lab Order',
          [
            {
              id: 'cbc-001',
              display: 'Complete Blood Count',
              selectedPriority: 'routine',
            },
          ],
        ],
      ]);

      (useServiceRequestStore as unknown as jest.Mock).mockReturnValue({
        ...mockStore,
        selectedServiceRequests: selectedMap,
      });

      (useInvestigationsSearch as jest.Mock).mockReturnValue({
        investigations: mockInvestigations,
        isLoading: false,
        error: null,
      });

      const user = userEvent.setup();

      render(<InvestigationsForm />, { wrapper: createWrapper() });

      const combobox = screen.getByRole('combobox');
      await user.type(combobox, 'glucose');

      await waitFor(() => {
        // Verify Blood Glucose Test is not marked as already selected
        const glucoseOption = screen.getByText('Blood Glucose Test');
        expect(glucoseOption).toBeInTheDocument();
        expect(glucoseOption).not.toHaveTextContent('(Already selected)');
      });

      // Click on the non-selected item
      await user.click(screen.getByText('Blood Glucose Test'));

      // Verify the store was called correctly
      await waitFor(() => {
        expect(mockStore.addServiceRequest).toHaveBeenCalledWith(
          'Lab Order',
          'glucose-001',
          'Blood Glucose Test',
        );
      });
    });

    test('handles multiple already selected items across different categories', async () => {
      const selectedMap = new Map([
        [
          'Lab Order',
          [
            {
              id: 'cbc-001',
              display: 'Complete Blood Count',
              selectedPriority: 'routine',
            },
            {
              id: 'glucose-001',
              display: 'Blood Glucose Test',
              selectedPriority: 'stat',
            },
          ],
        ],
        [
          'Radiology Order',
          [
            {
              id: 'xray-001',
              display: 'Chest X-Ray',
              selectedPriority: 'routine',
            },
          ],
        ],
      ]);

      (useServiceRequestStore as unknown as jest.Mock).mockReturnValue({
        ...mockStore,
        selectedServiceRequests: selectedMap,
      });

      (useInvestigationsSearch as jest.Mock).mockReturnValue({
        investigations: mockInvestigations,
        isLoading: false,
        error: null,
      });

      const user = userEvent.setup();

      render(<InvestigationsForm />, { wrapper: createWrapper() });

      const combobox = screen.getByRole('combobox');
      await user.type(combobox, 'test');

      await waitFor(() => {
        const options = screen.getAllByRole('option');

        // Check that all selected items are marked as already selected
        const cbcOption = options.find((option) =>
          option.textContent?.includes('Complete Blood Count'),
        );
        const glucoseOption = options.find((option) =>
          option.textContent?.includes('Blood Glucose Test'),
        );
        const xrayOption = options.find((option) =>
          option.textContent?.includes('Chest X-Ray'),
        );

        expect(cbcOption?.textContent).toMatch(
          /Complete Blood Count.*already/i,
        );
        expect(cbcOption).toHaveAttribute('disabled');

        expect(glucoseOption?.textContent).toMatch(
          /Blood Glucose Test.*already/i,
        );
        expect(glucoseOption).toHaveAttribute('disabled');

        expect(xrayOption?.textContent).toMatch(/Chest X-Ray.*already/i);
        expect(xrayOption).toHaveAttribute('disabled');
      });
    });

    test('updates already selected status when item is removed and search is performed again', async () => {
      let selectedMap = new Map([
        [
          'Lab Order',
          [
            {
              id: 'cbc-001',
              display: 'Complete Blood Count',
              selectedPriority: 'routine',
            },
          ],
        ],
      ]);

      const mockStoreWithDynamicMap = {
        ...mockStore,
        get selectedServiceRequests() {
          return selectedMap;
        },
        removeServiceRequest: jest.fn((category, id) => {
          const currentItems = selectedMap.get(category);
          const updatedItems = currentItems?.filter((item) => item.id !== id);
          if (updatedItems && updatedItems.length > 0) {
            selectedMap.set(category, updatedItems);
          } else {
            selectedMap.delete(category);
          }
        }),
      };

      (useServiceRequestStore as unknown as jest.Mock).mockReturnValue(
        mockStoreWithDynamicMap,
      );

      (useInvestigationsSearch as jest.Mock).mockReturnValue({
        investigations: mockInvestigations,
        isLoading: false,
        error: null,
      });

      const user = userEvent.setup();

      const { rerender } = render(<InvestigationsForm />, {
        wrapper: createWrapper(),
      });

      // First search - CBC should be marked as already selected
      const combobox = screen.getByRole('combobox');
      await user.type(combobox, 'complete');

      await waitFor(() => {
        expect(
          screen.getByText(/Complete Blood Count.*already/i),
        ).toBeInTheDocument();
      });

      await user.clear(combobox);

      // Remove the CBC from selected items
      const removeButton = screen.getByLabelText('Remove');
      await user.click(removeButton);

      // Update the mock to reflect the empty selected items
      selectedMap = new Map();

      // Rerender to reflect the state change
      rerender(<InvestigationsForm />);

      // Search again - CBC should NOT be marked as already selected
      await user.type(combobox, 'complete');

      await waitFor(() => {
        const cbcOption = screen.getByText('Complete Blood Count');
        expect(cbcOption).toBeInTheDocument();
        expect(cbcOption).not.toHaveTextContent('(Already selected)');
        expect(cbcOption.closest('[role="option"]')).not.toHaveAttribute(
          'disabled',
        );
      });
    });
  });

  describe('Backend Duplicate Detection', () => {
    const { getExistingServiceRequestsForAllCategories } =
      jest.requireMock('@bahmni/services');

    beforeEach(() => {
      jest.clearAllMocks();
      (useInvestigationsSearch as jest.Mock).mockReturnValue({
        investigations: mockInvestigations,
        isLoading: false,
        error: null,
      });
      (useServiceRequestStore as unknown as jest.Mock).mockReturnValue(
        mockStore,
      );
    });

    test('blocks duplicate when same provider tries to add same test in same encounter', async () => {
      getExistingServiceRequestsForAllCategories.mockResolvedValue([
        {
          conceptCode: 'cbc-001',
          categoryUuid: 'lab',
          display: 'Complete Blood Count',
          requesterUuid: 'mock-practitioner-uuid',
        },
      ]);

      const user = userEvent.setup();
      render(<InvestigationsForm />, { wrapper: createWrapper() });

      const combobox = screen.getByRole('combobox');
      await user.type(combobox, 'complete');

      await waitFor(() => {
        expect(screen.getByText('Complete Blood Count')).toBeInTheDocument();
      });

      await user.click(screen.getByText('Complete Blood Count'));

      await waitFor(() => {
        expect(
          screen.getByText('Investigation is already ordered'),
        ).toBeInTheDocument();
      });
      expect(mockStore.addServiceRequest).not.toHaveBeenCalled();
    });

    test('allows same test when different provider added it in same encounter', async () => {
      getExistingServiceRequestsForAllCategories.mockResolvedValue([
        {
          conceptCode: 'cbc-001',
          categoryUuid: 'lab',
          display: 'Complete Blood Count',
          requesterUuid: 'different-practitioner-uuid',
        },
      ]);

      const user = userEvent.setup();
      render(<InvestigationsForm />, { wrapper: createWrapper() });

      const combobox = screen.getByRole('combobox');
      await user.type(combobox, 'complete');

      await waitFor(() => {
        expect(screen.getByText('Complete Blood Count')).toBeInTheDocument();
      });

      await user.click(screen.getByText('Complete Blood Count'));

      await waitFor(() => {
        expect(mockStore.addServiceRequest).toHaveBeenCalledWith(
          'Lab Order',
          'cbc-001',
          'Complete Blood Count',
        );
      });
    });

    test('allows same test when it exists in different encounter', async () => {
      getExistingServiceRequestsForAllCategories.mockResolvedValue([]);

      const user = userEvent.setup();
      render(<InvestigationsForm />, { wrapper: createWrapper() });

      const combobox = screen.getByRole('combobox');
      await user.type(combobox, 'complete');

      await waitFor(() => {
        expect(screen.getByText('Complete Blood Count')).toBeInTheDocument();
      });

      await user.click(screen.getByText('Complete Blood Count'));

      await waitFor(() => {
        expect(mockStore.addServiceRequest).toHaveBeenCalledWith(
          'Lab Order',
          'cbc-001',
          'Complete Blood Count',
        );
      });
    });

    test('clears duplicate notification when search is cleared', async () => {
      getExistingServiceRequestsForAllCategories.mockResolvedValue([
        {
          conceptCode: 'cbc-001',
          categoryUuid: 'lab',
          display: 'Complete Blood Count',
          requesterUuid: 'mock-practitioner-uuid',
        },
      ]);

      const user = userEvent.setup();
      render(<InvestigationsForm />, { wrapper: createWrapper() });

      const combobox = screen.getByRole('combobox');
      await user.type(combobox, 'complete');

      await waitFor(() => {
        expect(screen.getByText('Complete Blood Count')).toBeInTheDocument();
      });

      await user.click(screen.getByText('Complete Blood Count'));

      await waitFor(() => {
        expect(
          screen.getByText('Investigation is already ordered'),
        ).toBeInTheDocument();
      });

      await user.clear(combobox);

      await waitFor(() => {
        expect(
          screen.queryByText('Investigation is already ordered'),
        ).not.toBeInTheDocument();
      });
    });

    test('closes duplicate notification when close button is clicked', async () => {
      getExistingServiceRequestsForAllCategories.mockResolvedValue([
        {
          conceptCode: 'cbc-001',
          categoryUuid: 'lab',
          display: 'Complete Blood Count',
          requesterUuid: 'mock-practitioner-uuid',
        },
      ]);

      const user = userEvent.setup();
      render(<InvestigationsForm />, { wrapper: createWrapper() });

      const combobox = screen.getByRole('combobox');
      await user.type(combobox, 'complete');

      await waitFor(() => {
        expect(screen.getByText('Complete Blood Count')).toBeInTheDocument();
      });

      await user.click(screen.getByText('Complete Blood Count'));

      await waitFor(() => {
        expect(
          screen.getByText('Investigation is already ordered'),
        ).toBeInTheDocument();
      });

      const closeButton = screen.getByRole('button', { name: /close/i });
      await user.click(closeButton);

      await waitFor(() => {
        expect(
          screen.queryByText('Investigation is already ordered'),
        ).not.toBeInTheDocument();
      });
    });

    test('does not re-show notification after dismiss when user continues typing', async () => {
      getExistingServiceRequestsForAllCategories.mockResolvedValue([
        {
          conceptCode: 'cbc-001',
          categoryUuid: 'lab',
          display: 'Complete Blood Count',
          requesterUuid: 'mock-practitioner-uuid',
        },
      ]);

      const user = userEvent.setup();
      render(<InvestigationsForm />, { wrapper: createWrapper() });

      const combobox = screen.getByRole('combobox');
      await user.type(combobox, 'complete');

      await waitFor(() => {
        expect(screen.getByText('Complete Blood Count')).toBeInTheDocument();
      });

      await user.click(screen.getByText('Complete Blood Count'));

      await waitFor(() => {
        expect(
          screen.getByText('Investigation is already ordered'),
        ).toBeInTheDocument();
      });

      const closeButton = screen.getByRole('button', { name: /close/i });
      await user.click(closeButton);

      await waitFor(() => {
        expect(
          screen.queryByText('Investigation is already ordered'),
        ).not.toBeInTheDocument();
      });

      // Continue typing — notification should stay dismissed
      await user.type(combobox, 'blood');

      await waitFor(() => {
        expect(
          screen.queryByText('Investigation is already ordered'),
        ).not.toBeInTheDocument();
      });
    });

    test('re-shows notification after dismiss when user clears search and selects a different duplicate', async () => {
      // Both CBC and Blood Glucose are already ordered
      getExistingServiceRequestsForAllCategories.mockResolvedValue([
        {
          conceptCode: 'cbc-001',
          categoryUuid: 'lab',
          display: 'Complete Blood Count',
          requesterUuid: 'mock-practitioner-uuid',
        },
        {
          conceptCode: 'glucose-001',
          categoryUuid: 'lab',
          display: 'Blood Glucose Test',
          requesterUuid: 'mock-practitioner-uuid',
        },
      ]);

      const user = userEvent.setup();
      render(<InvestigationsForm />, { wrapper: createWrapper() });

      const combobox = screen.getByRole('combobox');

      // Select CBC → notification shows
      await user.type(combobox, 'complete');
      await waitFor(() => {
        expect(screen.getByText('Complete Blood Count')).toBeInTheDocument();
      });
      await user.click(screen.getByText('Complete Blood Count'));
      await waitFor(() => {
        expect(
          screen.getByText('Investigation is already ordered'),
        ).toBeInTheDocument();
      });

      // Dismiss the notification
      const closeButton = screen.getByRole('button', { name: /close/i });
      await user.click(closeButton);
      await waitFor(() => {
        expect(
          screen.queryByText('Investigation is already ordered'),
        ).not.toBeInTheDocument();
      });

      // Clear the combobox — resets the dismissal ref
      await user.clear(combobox);
      await waitFor(() => {
        expect(
          screen.queryByText('Investigation is already ordered'),
        ).not.toBeInTheDocument();
      });

      // Select a different duplicate (Blood Glucose) — notification should reappear
      await user.type(combobox, 'glucose');
      await waitFor(() => {
        expect(screen.getByText('Blood Glucose Test')).toBeInTheDocument();
      });
      await user.click(screen.getByText('Blood Glucose Test'));
      await waitFor(() => {
        expect(
          screen.getByText('Investigation is already ordered'),
        ).toBeInTheDocument();
      });
    });

    test('shows procedure-specific message when duplicate procedure is detected', async () => {
      const procedureInvestigations = [
        {
          code: 'proc-001',
          display: 'Blood Transfusion',
          category: 'Procedure Order',
          categoryCode: 'proc',
        },
      ];

      (useInvestigationsSearch as jest.Mock).mockReturnValue({
        investigations: procedureInvestigations,
        isLoading: false,
        error: null,
      });

      getExistingServiceRequestsForAllCategories.mockResolvedValue([
        {
          conceptCode: 'proc-001',
          categoryUuid: 'proc',
          display: 'Blood Transfusion',
          requesterUuid: 'mock-practitioner-uuid',
        },
      ]);

      const user = userEvent.setup();
      render(<InvestigationsForm />, { wrapper: createWrapper() });

      const combobox = screen.getByRole('combobox');
      await user.type(combobox, 'transfusion');

      await waitFor(() => {
        expect(screen.getByText('Blood Transfusion')).toBeInTheDocument();
      });

      await user.click(screen.getByText('Blood Transfusion'));

      await waitFor(() => {
        expect(
          screen.getByText('Procedure is already ordered'),
        ).toBeInTheDocument();
      });
      expect(mockStore.addServiceRequest).not.toHaveBeenCalled();
    });
  });

  describe('Episode Context Fallback', () => {
    const { useClinicalAppData } = jest.requireMock(
      '../../../../hooks/useClinicalAppData',
    );
    const { useEncounterSession } = jest.requireMock(
      '../../../../hooks/useEncounterSession',
    );
    const { getExistingServiceRequestsForAllCategories } =
      jest.requireMock('@bahmni/services');

    beforeEach(() => {
      jest.clearAllMocks();
      (useInvestigationsSearch as jest.Mock).mockReturnValue({
        investigations: mockInvestigations,
        isLoading: false,
        error: null,
      });
      (useServiceRequestStore as unknown as jest.Mock).mockReturnValue(
        mockStore,
      );
    });

    afterEach(() => {
      useClinicalAppData.mockReturnValue({
        episodeOfCare: [],
        visit: [],
        encounter: [],
        isLoading: false,
        error: null,
      });
      useEncounterSession.mockReturnValue({
        activeEncounter: { id: 'mock-encounter-id' },
      });
    });

    test('uses active encounter when available, even with episode context', async () => {
      useClinicalAppData.mockReturnValue({
        episodeOfCare: [{ encounterUuids: ['eoc-enc-1'] }],
        visit: [],
        encounter: [],
        isLoading: false,
        error: null,
      });

      getExistingServiceRequestsForAllCategories.mockResolvedValue([]);

      render(<InvestigationsForm />, { wrapper: createWrapper() });

      await waitFor(() => {
        expect(getExistingServiceRequestsForAllCategories).toHaveBeenCalledWith(
          expect.anything(),
          'mock-patient-uuid',
          ['mock-encounter-id'],
        );
      });
    });

    test('falls back to episode encounter UUIDs when no active encounter', async () => {
      useEncounterSession.mockReturnValue({
        activeEncounter: null,
      });
      useClinicalAppData.mockReturnValue({
        episodeOfCare: [{ encounterUuids: ['eoc-enc-1', 'eoc-enc-2'] }],
        visit: [{ encounterUuids: ['visit-enc-1'] }],
        encounter: [{ uuid: 'direct-enc-1' }],
        isLoading: false,
        error: null,
      });

      getExistingServiceRequestsForAllCategories.mockResolvedValue([]);

      render(<InvestigationsForm />, { wrapper: createWrapper() });

      await waitFor(() => {
        expect(getExistingServiceRequestsForAllCategories).toHaveBeenCalledWith(
          expect.anything(),
          'mock-patient-uuid',
          expect.arrayContaining([
            'eoc-enc-1',
            'eoc-enc-2',
            'visit-enc-1',
            'direct-enc-1',
          ]),
        );
      });
    });

    test('does not fetch existing service requests when no encounter context', async () => {
      useEncounterSession.mockReturnValue({
        activeEncounter: null,
      });
      useClinicalAppData.mockReturnValue({
        episodeOfCare: [],
        visit: [],
        encounter: [],
        isLoading: false,
        error: null,
      });

      getExistingServiceRequestsForAllCategories.mockResolvedValue([]);

      render(<InvestigationsForm />, { wrapper: createWrapper() });

      // Give time for any queries to fire
      await act(async () => {
        await new Promise((r) => setTimeout(r, 50));
      });

      expect(getExistingServiceRequestsForAllCategories).not.toHaveBeenCalled();
    });
  });

  describe('Consultation Saved Event Subscription', () => {
    const { getExistingServiceRequestsForAllCategories } =
      jest.requireMock('@bahmni/services');

    beforeEach(() => {
      jest.clearAllMocks();
      (useInvestigationsSearch as jest.Mock).mockReturnValue({
        investigations: [],
        isLoading: false,
        error: null,
      });
      (useServiceRequestStore as unknown as jest.Mock).mockReturnValue(
        mockStore,
      );
      getExistingServiceRequestsForAllCategories.mockResolvedValue([]);
    });

    test('refetches existing service requests when consultation saved event has service request updates', async () => {
      render(<InvestigationsForm />, { wrapper: createWrapper() });

      // Wait for initial query to settle
      await waitFor(() => {
        expect(
          getExistingServiceRequestsForAllCategories,
        ).toHaveBeenCalledTimes(1);
      });

      getExistingServiceRequestsForAllCategories.mockClear();

      // Dispatch consultation saved event with service request updates
      window.dispatchEvent(
        new CustomEvent('consultation:saved', {
          detail: {
            patientUUID: 'mock-patient-uuid',
            updatedResources: {
              conditions: false,
              allergies: false,
              medications: false,
              serviceRequests: { lab: true },
            },
            updatedConcepts: new Map(),
          },
        }),
      );

      await waitFor(() => {
        expect(getExistingServiceRequestsForAllCategories).toHaveBeenCalled();
      });
    });

    test('does not refetch when consultation saved event has no service request updates', async () => {
      render(<InvestigationsForm />, { wrapper: createWrapper() });

      await waitFor(() => {
        expect(
          getExistingServiceRequestsForAllCategories,
        ).toHaveBeenCalledTimes(1);
      });

      getExistingServiceRequestsForAllCategories.mockClear();

      window.dispatchEvent(
        new CustomEvent('consultation:saved', {
          detail: {
            patientUUID: 'mock-patient-uuid',
            updatedResources: {
              conditions: true,
              allergies: false,
              medications: false,
              serviceRequests: {},
            },
            updatedConcepts: new Map(),
          },
        }),
      );

      // Give time for any async operations
      await act(async () => {
        await new Promise((r) => setTimeout(r, 50));
      });

      expect(getExistingServiceRequestsForAllCategories).not.toHaveBeenCalled();
    });

    test('does not refetch when consultation saved event is for a different patient', async () => {
      render(<InvestigationsForm />, { wrapper: createWrapper() });

      await waitFor(() => {
        expect(
          getExistingServiceRequestsForAllCategories,
        ).toHaveBeenCalledTimes(1);
      });

      getExistingServiceRequestsForAllCategories.mockClear();

      window.dispatchEvent(
        new CustomEvent('consultation:saved', {
          detail: {
            patientUUID: 'different-patient-uuid',
            updatedResources: {
              conditions: false,
              allergies: false,
              medications: false,
              serviceRequests: { lab: true },
            },
            updatedConcepts: new Map(),
          },
        }),
      );

      await act(async () => {
        await new Promise((r) => setTimeout(r, 50));
      });

      expect(getExistingServiceRequestsForAllCategories).not.toHaveBeenCalled();
    });
  });

  describe('Edge Cases', () => {
    test('handles empty search term correctly', () => {
      render(<InvestigationsForm />, { wrapper: createWrapper() });

      const combobox = screen.getByRole('combobox');
      expect(combobox).toHaveValue('');
    });
    test('should handle search result with empty display', async () => {
      (useInvestigationsSearch as jest.Mock).mockReturnValue({
        investigations: [
          {
            code: 'empty-001',
            display: '',
            category: 'Lab Order',
            categoryCode: 'lab',
          },
        ],
        isLoading: false,
        error: null,
      });

      render(<InvestigationsForm />, { wrapper: createWrapper() });

      const combobox = screen.getByRole('combobox');
      const user = userEvent.setup();
      await user.type(combobox, 'test');
      expect(combobox).toHaveValue('test');
      expect(screen.getByRole('option', { name: '' })).toBeInTheDocument();
      expect(
        screen.getByRole('option', { name: 'LAB ORDER' }),
      ).toBeInTheDocument();
    });
  });

  describe('Keyboard Navigation', () => {
    test('should support keyboard navigation and selection in ComboBox', async () => {
      const user = userEvent.setup();
      (useInvestigationsSearch as jest.Mock).mockReturnValue({
        investigations: mockInvestigations,
        isLoading: false,
        error: null,
      });

      render(<InvestigationsForm />, { wrapper: createWrapper() });

      const searchBox = screen.getByRole('combobox', {
        name: /search for investigations/i,
      });

      // Type to open dropdown
      await user.type(searchBox, 'glucose');

      await waitFor(() => {
        expect(screen.getByText('Blood Glucose Test')).toBeInTheDocument();
      });

      // Navigate with arrow key and select with Enter
      await user.keyboard('{ArrowDown}');
      await user.keyboard('{Enter}');

      await waitFor(() => {
        expect(mockStore.addServiceRequest).toHaveBeenCalled();
      });
    });
  });

  describe('Accessibility', () => {
    test('has no accessibility violations', async () => {
      let container: HTMLElement;

      await act(async () => {
        const rendered = render(<InvestigationsForm />, {
          wrapper: createWrapper(),
        });
        container = rendered.container;
      });

      const results = await axe(container!);
      expect(results).toHaveNoViolations();
    });

    test('duplicate notification supports accessibility when visible', async () => {
      const { getExistingServiceRequestsForAllCategories } =
        jest.requireMock('@bahmni/services');

      getExistingServiceRequestsForAllCategories.mockResolvedValue([
        {
          conceptCode: 'cbc-001',
          categoryUuid: 'lab',
          display: 'Complete Blood Count',
          requesterUuid: 'mock-practitioner-uuid',
        },
      ]);

      (useInvestigationsSearch as jest.Mock).mockReturnValue({
        investigations: mockInvestigations,
        isLoading: false,
        error: null,
      });
      (useServiceRequestStore as unknown as jest.Mock).mockReturnValue(
        mockStore,
      );

      let container: HTMLElement;
      const user = userEvent.setup();

      await act(async () => {
        const rendered = render(<InvestigationsForm />, {
          wrapper: createWrapper(),
        });
        container = rendered.container;
      });

      const combobox = screen.getByRole('combobox');
      await user.type(combobox, 'complete');

      await waitFor(() => {
        expect(screen.getByText('Complete Blood Count')).toBeInTheDocument();
      });

      await user.click(screen.getByText('Complete Blood Count'));

      await waitFor(() => {
        expect(
          screen.getByText('Investigation is already ordered'),
        ).toBeInTheDocument();
      });

      // Verify close button is keyboard accessible
      const closeButton = screen.getByRole('button', { name: /close/i });
      expect(closeButton).toBeInTheDocument();

      // Run axe with notification visible
      const results = await axe(container!);
      expect(results).toHaveNoViolations();
    });

    test('form maintains semantic HTML for accessibility', async () => {
      let container: HTMLElement;

      await act(async () => {
        const rendered = render(<InvestigationsForm />, {
          wrapper: createWrapper(),
        });
        container = rendered.container;
      });

      // Verify form has proper structure for accessibility
      const formTile = screen.getByTestId('investigations-form-tile');
      expect(formTile).toBeInTheDocument();

      const title = screen.getByTestId('investigations-form-title');
      expect(title).toBeInTheDocument();

      const combobox = screen.getByTestId('investigations-search-combobox');
      expect(combobox).toHaveAttribute('aria-label');

      // Run axe check - this will check for violations in the basic form structure
      const results = await axe(container!);
      expect(results).toHaveNoViolations();
    });
  });

  describe('Privilege Guard', () => {
    it('renders null when user lacks Add Orders privilege', () => {
      mockUseHasPrivilege.mockReturnValue(mockUserPrivilegesEmpty);
      const { container } = render(<InvestigationsForm />, {
        wrapper: createWrapper(),
      });
      expect(container).toBeEmptyDOMElement();
    });

    it('renders form when user has Add Orders privilege', () => {
      render(<InvestigationsForm />, { wrapper: createWrapper() });
      expect(
        screen.getByTestId('investigations-form-tile'),
      ).toBeInTheDocument();
    });
  });
});
