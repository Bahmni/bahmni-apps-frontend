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
}));

jest.mock('@bahmni/widgets', () => ({
  ...jest.requireActual('@bahmni/widgets'),
  usePatientUUID: jest.fn().mockReturnValue('mock-patient-uuid'),
  useHasPrivilege: jest.fn(),
  UserPrivilegeProvider: ({ children }: { children: React.ReactNode }) =>
    children,
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

    test('allows adding the same investigation multiple times (duplicates are allowed) - item is not disabled in dropdown', async () => {
      const user = userEvent.setup();
      (useInvestigationsSearch as jest.Mock).mockReturnValue({
        investigations: mockInvestigations,
        isLoading: false,
        error: null,
      });

      // Simulate that CBC is already selected in the store
      const selectedMap = new Map([
        [
          'Lab Order',
          [
            {
              uid: 'uid-cbc-001',
              id: 'cbc-001',
              display: 'Complete Blood Count',
              selectedPriority: 'routine' as const,
            },
          ],
        ],
      ]);

      (useServiceRequestStore as unknown as jest.Mock).mockReturnValue({
        ...mockStore,
        selectedServiceRequests: selectedMap,
      });

      render(<InvestigationsForm />, { wrapper: createWrapper() });
      const combobox = screen.getByRole('combobox');

      // Search for the already-selected investigation
      await user.type(combobox, 'complete');

      await waitFor(() => {
        // Item should NOT be disabled or marked as already selected
        const options = screen.getAllByRole('option');
        const cbcOption = options.find((o) =>
          o.textContent?.includes('Complete Blood Count'),
        );
        expect(cbcOption).toBeInTheDocument();
        expect(cbcOption).not.toHaveAttribute('disabled');
        expect(cbcOption?.textContent).not.toMatch(/already/i);
      });
    });
  });

  describe('Selected Investigations Display', () => {
    test('displays selected investigations grouped by category', () => {
      const selectedMap = new Map([
        [
          'Lab Order',
          [
            {
              uid: 'uid-cbc-001',
              id: 'cbc-001',
              display: 'Complete Blood Count',
              selectedPriority: 'routine',
            },
            {
              uid: 'uid-glucose-001',
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
              uid: 'uid-xray-001',
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

    test('displays duplicate investigations (same concept) in the list', () => {
      const selectedMap = new Map([
        [
          'Lab Order',
          [
            {
              uid: 'uid-cbc-001-a',
              id: 'cbc-001',
              display: 'Complete Blood Count',
              selectedPriority: 'routine',
            },
            {
              uid: 'uid-cbc-001-b',
              id: 'cbc-001',
              display: 'Complete Blood Count',
              selectedPriority: 'stat',
            },
          ],
        ],
      ]);

      (useServiceRequestStore as unknown as jest.Mock).mockReturnValue({
        ...mockStore,
        selectedServiceRequests: selectedMap,
      });

      render(<InvestigationsForm />, { wrapper: createWrapper() });

      expect(screen.getByText('Added Lab Order')).toBeInTheDocument();
      const cbcItems = screen.getAllByText('Complete Blood Count');
      expect(cbcItems).toHaveLength(2);
    });

    test('removes investigation when close button is clicked using uid', async () => {
      const selectedMap = new Map([
        [
          'Lab Order',
          [
            {
              uid: 'uid-cbc-001',
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
        'uid-cbc-001',
      );
    });

    test('updates priority when urgent checkbox is toggled using uid', async () => {
      const selectedMap = new Map([
        [
          'Lab Order',
          [
            {
              uid: 'uid-cbc-001',
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
        'uid-cbc-001',
        'stat',
      );
    });

    test('updates note when note input is changed using uid', async () => {
      const selectedMap = new Map([
        [
          'Lab Order',
          [
            {
              uid: 'uid-cbc-001',
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
        'uid-cbc-001',
        'Patient has low hemoglobin',
      );
    });

    test('updates note for multiple investigations independently using uid', async () => {
      const selectedMap = new Map([
        [
          'Lab Order',
          [
            {
              uid: 'uid-cbc-001',
              id: 'cbc-001',
              display: 'Complete Blood Count',
              selectedPriority: 'routine',
            },
            {
              uid: 'uid-glucose-001',
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
        'uid-cbc-001',
        'Note for CBC',
      );

      await user.type(noteInputs[1], 'Note for Glucose');
      expect(mockStore.updateNote).toHaveBeenCalledWith(
        'Lab Order',
        'uid-glucose-001',
        'Note for Glucose',
      );
    });

    test('updates note for investigations across different categories using uid', async () => {
      const selectedMap = new Map([
        [
          'Lab Order',
          [
            {
              uid: 'uid-cbc-001',
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
              uid: 'uid-xray-001',
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
        'uid-cbc-001',
        'CBC note',
      );

      await user.type(noteInputs[1], 'X-Ray note');
      expect(mockStore.updateNote).toHaveBeenCalledWith(
        'Radiology Order',
        'uid-xray-001',
        'X-Ray note',
      );
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
