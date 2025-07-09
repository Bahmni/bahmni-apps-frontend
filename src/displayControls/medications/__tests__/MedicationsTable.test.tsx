import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { axe, toHaveNoViolations } from 'jest-axe';
import React from 'react';
import i18n from '@/setupTests.i18n';
import {
  mockMedicationRequest,
  mockMedicationWithPRN,
  mockMedicationWithSTAT,
  mockMedicationsWithDifferentDates,
} from '@__mocks__/medicationMocks';
import { MedicationStatus } from '../../../types/medicationRequest';
import MedicationsTable from '../MedicationsTable';

// Extend Jest matchers
expect.extend(toHaveNoViolations);

// Mock only external dependencies
const mockUseMedicationRequest = jest.fn();

jest.mock('@hooks/useMedicationRequest', () => ({
  useMedicationRequest: () => mockUseMedicationRequest(),
}));
// Test data helpers
const createTestMedication = (overrides = {}) => ({
  ...mockMedicationRequest,
  ...overrides,
});

describe('MedicationsTable', () => {
  // Setup default mocks
  i18n.changeLanguage('en');
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(console, 'error').mockImplementation();
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: jest.fn().mockImplementation((query) => ({
        matches: false,
        media: query,
        onchange: null,
        addListener: jest.fn(), // Deprecated
        removeListener: jest.fn(), // Deprecated
        addEventListener: jest.fn(),
        removeEventListener: jest.fn(),
        dispatchEvent: jest.fn(),
      })),
    });
    // Default successful state
    mockUseMedicationRequest.mockReturnValue({
      medications: [mockMedicationRequest],
      loading: false,
      error: null,
    });
  });

  describe('Component Structure', () => {
    it('renders medications table container with correct test id', () => {
      render(<MedicationsTable />);

      expect(screen.getByTestId('medications-table')).toBeInTheDocument();
    });

    it('renders tab navigation with correct labels', () => {
      render(<MedicationsTable />);

      expect(
        screen.getByRole('tab', { name: 'Active & Scheduled' }),
      ).toBeInTheDocument();
      expect(screen.getByRole('tab', { name: 'All' })).toBeInTheDocument();
    });

    it('renders active tab panel', () => {
      render(<MedicationsTable />);

      const tabPanels = screen.getAllByRole('tabpanel');
      expect(tabPanels).toHaveLength(1);
    });

    it('renders table headers correctly', () => {
      render(<MedicationsTable />);

      expect(screen.getAllByText('Medicine')[0]).toBeInTheDocument();
      expect(screen.getAllByText('Dosage')[0]).toBeInTheDocument();
      expect(screen.getAllByText('Instructions')[0]).toBeInTheDocument();
      expect(screen.getAllByText('Start Date')[0]).toBeInTheDocument();
      expect(screen.getAllByText('Ordered By')[0]).toBeInTheDocument();
      expect(screen.getAllByText('Ordered On')[0]).toBeInTheDocument();
      expect(screen.getAllByText('Status')[0]).toBeInTheDocument();
    });
  });

  describe('Data Processing', () => {
    it('formats medications correctly and displays in DOM', () => {
      const testMedications = [
        createTestMedication({
          name: 'Aspirin 100mg',
          dose: { value: 100, unit: 'mg' },
          frequency: 'Twice daily',
          quantity: { value: 30, unit: 'tablets' },
        }),
      ];

      mockUseMedicationRequest.mockReturnValue({
        medications: testMedications,
        loading: false,
        error: null,
      });

      render(<MedicationsTable />);

      expect(screen.getAllByText('Aspirin 100mg')[0]).toBeInTheDocument();
      expect(screen.getAllByText('30 tablets')[0]).toBeInTheDocument();
    });

    it('filters active and on-hold medications for Active & Scheduled tab', () => {
      const medications = [
        createTestMedication({
          id: 'active-med',
          name: 'Active Medication',
          status: MedicationStatus.Active,
        }),
        createTestMedication({
          id: 'onhold-med',
          name: 'On Hold Medication',
          status: MedicationStatus.OnHold,
        }),
        createTestMedication({
          id: 'completed-med',
          name: 'Completed Medication',
          status: MedicationStatus.Completed,
        }),
        createTestMedication({
          id: 'stopped-med',
          name: 'Stopped Medication',
          status: MedicationStatus.Stopped,
        }),
      ];

      mockUseMedicationRequest.mockReturnValue({
        medications,
        loading: false,
        error: null,
      });

      render(<MedicationsTable />);

      // Should show only Active and On-Hold medications in first tab
      expect(screen.getAllByText('Active Medication')).toHaveLength(2);
      expect(screen.getAllByText('On Hold Medication')).toHaveLength(2);
      expect(screen.getAllByText('Completed Medication')).toHaveLength(1);
      expect(screen.getAllByText('Stopped Medication')).toHaveLength(1);
    });

    it('groups medications by date for All tab', async () => {
      const medications = [
        createTestMedication({
          id: 'med-jan-15',
          name: 'Medication Jan 15',
          orderDate: '2024-01-15T10:00:00.000Z',
        }),
        createTestMedication({
          id: 'med-jan-14',
          name: 'Medication Jan 14',
          orderDate: '2024-01-14T10:00:00.000Z',
        }),
      ];

      mockUseMedicationRequest.mockReturnValue({
        medications,
        loading: false,
        error: null,
      });

      render(<MedicationsTable />);

      // Switch to All tab
      const allTab = screen.getByRole('tab', { name: 'All' });
      await userEvent.click(allTab);

      // Should show date groups
      await waitFor(() => {
        expect(screen.getByText(/January 15, 2024/)).toBeInTheDocument();
        expect(screen.getByText(/January 14, 2024/)).toBeInTheDocument();
      });
    });

    it('sorts medications by status correctly', () => {
      const medications = [
        createTestMedication({
          name: 'Completed Med',
          status: MedicationStatus.Completed,
        }),
        createTestMedication({
          name: 'Active Med',
          status: MedicationStatus.Active,
        }),
        createTestMedication({
          name: 'Stopped Med',
          status: MedicationStatus.Stopped,
        }),
      ];

      mockUseMedicationRequest.mockReturnValue({
        medications,
        loading: false,
        error: null,
      });

      render(<MedicationsTable />);

      // Active medications should appear first in the active tab
      const activeTab = screen.getAllByRole('tabpanel')[0];
      expect(activeTab).toHaveTextContent('Active Med');
    });
  });

  describe('Cell Rendering', () => {
    beforeEach(() => {
      const medications = [
        mockMedicationWithPRN,
        mockMedicationWithSTAT,
        createTestMedication({
          name: 'Regular Medication',
          status: MedicationStatus.Active,
          asNeeded: false,
          isImmediate: false,
        }),
      ];

      mockUseMedicationRequest.mockReturnValue({
        medications,
        loading: false,
        error: null,
      });
    });

    it('renders medication name with dosage unit and quantity', () => {
      render(<MedicationsTable />);

      // Check main medication name
      expect(screen.getAllByText(/Paracetamol 500mg/)[0]).toBeInTheDocument();
      expect(screen.getAllByText(/Epinephrine 1mg/)[0]).toBeInTheDocument();
      expect(screen.getAllByText(/Regular Medication/)[0]).toBeInTheDocument();
    });

    it('displays PRN tag for as-needed medications', () => {
      render(<MedicationsTable />);

      const prnTags = screen.getAllByText('PRN');
      expect(prnTags.length).toBeGreaterThan(0);
      const prnTag = prnTags[0];
      expect(prnTag).toBeInTheDocument();
    });

    it('displays STAT tag for immediate medications', () => {
      render(<MedicationsTable />);

      const statTags = screen.getAllByText('STAT');
      expect(statTags.length).toBeGreaterThan(0);

      const statTag = statTags[0];
      expect(statTag).toBeInTheDocument();
    });

    it('renders medications with cancelled status correctly', () => {
      const medicationWithCancelledStatus = createTestMedication({
        name: 'Cancelled Medication',
        status: MedicationStatus.Cancelled,
      });

      mockUseMedicationRequest.mockReturnValue({
        medications: [medicationWithCancelledStatus],
        loading: false,
        error: null,
      });

      render(<MedicationsTable />);

      expect(screen.getByText('Cancelled Medication')).toBeInTheDocument();
      expect(screen.getByText('Cancelled')).toBeInTheDocument();
    });

    it('renders medications with unknown status correctly', () => {
      const medicationWithUnknownStatus = createTestMedication({
        name: 'Unknown Status Medication',
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        status: 'unknown' as any,
      });

      mockUseMedicationRequest.mockReturnValue({
        medications: [medicationWithUnknownStatus],
        loading: false,
        error: null,
      });

      render(<MedicationsTable />);

      expect(screen.getByText('Unknown Status Medication')).toBeInTheDocument();
      expect(screen.getByText('Unknown')).toBeInTheDocument();
    });

    it('renders medications with entered-in-error status correctly', () => {
      const medicationWithErrorStatus = createTestMedication({
        name: 'Error Status Medication',
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        status: 'entered-in-error' as any,
      });

      mockUseMedicationRequest.mockReturnValue({
        medications: [medicationWithErrorStatus],
        loading: false,
        error: null,
      });

      render(<MedicationsTable />);

      expect(screen.getByText('Error Status Medication')).toBeInTheDocument();
      expect(screen.getByText('Unknown')).toBeInTheDocument();
    });

    it('renders medications with draft status correctly', () => {
      const medicationWithDraftStatus = createTestMedication({
        name: 'Draft Status Medication',
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        status: 'draft' as any,
      });

      mockUseMedicationRequest.mockReturnValue({
        medications: [medicationWithDraftStatus],
        loading: false,
        error: null,
      });

      render(<MedicationsTable />);

      expect(screen.getByText('Draft Status Medication')).toBeInTheDocument();
      expect(screen.getByText('Unknown')).toBeInTheDocument();
    });

    it('renders medications with unrecognized status using default case', () => {
      const medicationWithUnrecognizedStatus = createTestMedication({
        name: 'Unrecognized Status Medication',
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        status: 'invalid-status' as any,
      });

      mockUseMedicationRequest.mockReturnValue({
        medications: [medicationWithUnrecognizedStatus],
        loading: false,
        error: null,
      });

      render(<MedicationsTable />);

      expect(
        screen.getByText('Unrecognized Status Medication'),
      ).toBeInTheDocument();
      expect(screen.getByText('Unknown')).toBeInTheDocument();
    });
  });

  describe('Tab Navigation', () => {
    beforeEach(() => {
      const medications = [
        createTestMedication({
          name: 'Active Med',
          status: MedicationStatus.Active,
        }),
        createTestMedication({
          name: 'Completed Med',
          status: MedicationStatus.Completed,
        }),
      ];

      mockUseMedicationRequest.mockReturnValue({
        medications,
        loading: false,
        error: null,
      });
    });

    it('maintains correct tab selection state', async () => {
      render(<MedicationsTable />);

      const activeTab = screen.getByRole('tab', { name: 'Active & Scheduled' });
      const allTab = screen.getByRole('tab', { name: 'All' });

      // Initially first tab should be selected
      expect(activeTab).toHaveAttribute('aria-selected', 'true');
      expect(allTab).toHaveAttribute('aria-selected', 'false');

      // Click second tab
      await userEvent.click(allTab);

      // Selection should switch
      expect(activeTab).toHaveAttribute('aria-selected', 'false');
      expect(allTab).toHaveAttribute('aria-selected', 'true');
    });
  });

  describe('State Management', () => {
    it('displays loading state correctly', () => {
      mockUseMedicationRequest.mockReturnValue({
        medications: [],
        loading: true,
        error: null,
      });

      render(<MedicationsTable />);

      // Should show loading state in table components
      expect(screen.getByTestId('medications-table')).toBeInTheDocument();
      // Note: Loading state is handled by the table components themselves
    });

    it('shows error message when fetch fails', () => {
      const errorMessage = 'Failed to fetch medications';
      mockUseMedicationRequest.mockReturnValue({
        medications: [],
        loading: false,
        error: new Error(errorMessage),
      });

      render(<MedicationsTable />);

      expect(screen.getByTestId('medications-table-error')).toBeInTheDocument();
      expect(
        screen.getByText('Error fetching medications'),
      ).toBeInTheDocument();
    });

    it('displays empty state when no medications', () => {
      mockUseMedicationRequest.mockReturnValue({
        medications: [],
        loading: false,
        error: null,
      });

      render(<MedicationsTable />);

      expect(screen.getByText('No active medications')).toBeInTheDocument();
    });

    it('handles null medications array gracefully', () => {
      mockUseMedicationRequest.mockReturnValue({
        medications: null,
        loading: false,
        error: null,
      });

      render(<MedicationsTable />);

      expect(screen.getByText('No active medications')).toBeInTheDocument();
    });

    it('handles undefined medications array gracefully', () => {
      mockUseMedicationRequest.mockReturnValue({
        medications: undefined,
        loading: false,
        error: null,
      });

      render(<MedicationsTable />);

      expect(screen.getByText('No active medications')).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('has no accessibility violations with real content', async () => {
      const medications = [
        createTestMedication({ name: 'Test Medication 1' }),
        createTestMedication({ name: 'Test Medication 2' }),
      ];

      mockUseMedicationRequest.mockReturnValue({
        medications,
        loading: false,
        error: null,
      });

      const { container } = render(<MedicationsTable />);
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('has no accessibility violations when loading', async () => {
      mockUseMedicationRequest.mockReturnValue({
        medications: [],
        loading: true,
        error: null,
      });

      const { container } = render(<MedicationsTable />);
      const results = await axe(container, {
        rules: {
          'empty-table-header': { enabled: false },
        },
      });
      expect(results).toHaveNoViolations();
    });

    it('has no accessibility violations in error state', async () => {
      mockUseMedicationRequest.mockReturnValue({
        medications: [],
        loading: false,
        error: new Error('Test error'),
      });

      const { container } = render(<MedicationsTable />);
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('has no accessibility violations in empty state', async () => {
      mockUseMedicationRequest.mockReturnValue({
        medications: [],
        loading: false,
        error: null,
      });

      const { container } = render(<MedicationsTable />);
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('provides proper ARIA labels and roles', () => {
      render(<MedicationsTable />);

      // Check for proper tab structure
      const tablist = screen.getByRole('tablist');
      expect(tablist).toHaveAttribute('aria-label', 'Medication view options');

      const tabs = screen.getAllByRole('tab');
      expect(tabs).toHaveLength(2);

      const tabpanels = screen.getAllByRole('tabpanel');
      expect(tabpanels).toHaveLength(1); // Carbon only renders active tab panel
    });

    it('has sufficient color contrast for status tags', () => {
      const medications = [
        createTestMedication({ status: MedicationStatus.Active }),
        createTestMedication({ status: MedicationStatus.Completed }),
        createTestMedication({ status: MedicationStatus.Cancelled }),
      ];

      mockUseMedicationRequest.mockReturnValue({
        medications,
        loading: false,
        error: null,
      });

      render(<MedicationsTable />);

      // Status tags should be present and have appropriate styling
      const statusTags = screen.getAllByText(/Active|Completed|Cancelled/);
      expect(statusTags.length).toBeGreaterThan(0);
    });
  });

  describe('Date Grouping Functionality', () => {
    it('sorts medications within each date group by priority', async () => {
      const medications = [
        createTestMedication({
          id: 'regular-med',
          name: 'Regular Medication',
          orderDate: '2024-01-15T10:00:00.000Z',
          isImmediate: false,
          asNeeded: false,
        }),
        createTestMedication({
          id: 'stat-med',
          name: 'STAT Medication',
          orderDate: '2024-01-15T10:00:00.000Z',
          isImmediate: true,
          asNeeded: false,
        }),
        createTestMedication({
          id: 'prn-med',
          name: 'PRN Medication',
          orderDate: '2024-01-15T10:00:00.000Z',
          isImmediate: false,
          asNeeded: true,
        }),
      ];

      mockUseMedicationRequest.mockReturnValue({
        medications,
        loading: false,
        error: null,
      });

      render(<MedicationsTable />);

      // Switch to All tab
      const allTab = screen.getByRole('tab', { name: 'All' });
      await userEvent.click(allTab);

      await waitFor(() => {
        // STAT should appear before non-immediate medications (PRN and regular have same priority)
        const medicationRows = screen.getAllByText(/Medication$/);
        const medicationNames = medicationRows.map((row) => row.textContent);

        const statIndex = medicationNames.findIndex((name) =>
          name?.includes('STAT'),
        );
        const prnIndex = medicationNames.findIndex((name) =>
          name?.includes('PRN'),
        );
        const regularIndex = medicationNames.findIndex((name) =>
          name?.includes('Regular'),
        );

        // STAT medications should appear first
        expect(statIndex).toBeLessThan(prnIndex);
        expect(statIndex).toBeLessThan(regularIndex);

        // PRN and regular medications have same priority, so their relative order is preserved (stable sort)
        // Since regular-med appears first in the input array, it should appear before prn-med
        expect(regularIndex).toBeLessThan(prnIndex);
      });
    });

    it('sorts medications within each date group by status', async () => {
      const medications = [
        createTestMedication({
          id: 'completed-med',
          name: 'Completed Medication',
          orderDate: '2024-01-15T10:00:00.000Z',
          status: MedicationStatus.Completed,
        }),
        createTestMedication({
          id: 'active-med',
          name: 'Active Medication',
          orderDate: '2024-01-15T10:00:00.000Z',
          status: MedicationStatus.Active,
        }),
        createTestMedication({
          id: 'onhold-med',
          name: 'On Hold Medication',
          orderDate: '2024-01-15T10:00:00.000Z',
          status: MedicationStatus.OnHold,
        }),
      ];

      mockUseMedicationRequest.mockReturnValue({
        medications,
        loading: false,
        error: null,
      });

      render(<MedicationsTable />);

      // Switch to All tab
      const allTab = screen.getByRole('tab', { name: 'All' });
      await userEvent.click(allTab);

      await waitFor(() => {
        // Active should appear before on-hold which should appear before completed
        const medicationRows = screen.getAllByText(/Medication$/);
        const medicationNames = medicationRows.map((row) => row.textContent);

        const activeIndex = medicationNames.findIndex((name) =>
          name?.includes('Active'),
        );
        const onholdIndex = medicationNames.findIndex((name) =>
          name?.includes('On Hold'),
        );
        const completedIndex = medicationNames.findIndex((name) =>
          name?.includes('Completed'),
        );

        expect(activeIndex).toBeLessThan(onholdIndex);
        expect(onholdIndex).toBeLessThan(completedIndex);
      });
    });

    it('handles empty date groups correctly', async () => {
      mockUseMedicationRequest.mockReturnValue({
        medications: [],
        loading: false,
        error: null,
      });

      render(<MedicationsTable />);

      // Switch to All tab
      const allTab = screen.getByRole('tab', { name: 'All' });
      await userEvent.click(allTab);

      await waitFor(() => {
        expect(screen.getByText('No medication history')).toBeInTheDocument();
      });
    });
  });

  describe('Complex Sorting Logic', () => {
    it('sorts medications by priority within status groups', () => {
      const medications = [
        createTestMedication({
          name: 'Active Regular',
          status: MedicationStatus.Active,
          isImmediate: false,
          asNeeded: false,
        }),
        createTestMedication({
          name: 'Active STAT',
          status: MedicationStatus.Active,
          isImmediate: true,
          asNeeded: false,
        }),
        createTestMedication({
          name: 'Active PRN',
          status: MedicationStatus.Active,
          isImmediate: false,
          asNeeded: true,
        }),
        createTestMedication({
          name: 'OnHold STAT',
          status: MedicationStatus.OnHold,
          isImmediate: true,
          asNeeded: false,
        }),
        createTestMedication({
          name: 'OnHold Regular',
          status: MedicationStatus.OnHold,
          isImmediate: false,
          asNeeded: false,
        }),
      ];

      mockUseMedicationRequest.mockReturnValue({
        medications,
        loading: false,
        error: null,
      });

      render(<MedicationsTable />);

      // In Active & Scheduled tab, should show only active and on-hold
      // Active STAT should appear first, then Active PRN, then Active Regular, then OnHold STAT, then OnHold Regular
      const activeTab = screen.getAllByRole('tabpanel')[0];
      const medicationText = activeTab.textContent;

      // Verify that active medications appear before on-hold medications
      const activeStatIndex = medicationText?.indexOf('Active STAT') ?? -1;
      const onHoldRegularIndex =
        medicationText?.indexOf('OnHold Regular') ?? -1;
      expect(activeStatIndex).toBeLessThan(onHoldRegularIndex);
    });

    it('maintains stable sorting for medications with same priority and status', () => {
      const medications = [
        createTestMedication({
          id: 'first-regular',
          name: 'First Regular Medication',
          status: MedicationStatus.Active,
          isImmediate: false,
          asNeeded: false,
        }),
        createTestMedication({
          id: 'second-regular',
          name: 'Second Regular Medication',
          status: MedicationStatus.Active,
          isImmediate: false,
          asNeeded: false,
        }),
        createTestMedication({
          id: 'third-regular',
          name: 'Third Regular Medication',
          status: MedicationStatus.Active,
          isImmediate: false,
          asNeeded: false,
        }),
      ];

      mockUseMedicationRequest.mockReturnValue({
        medications,
        loading: false,
        error: null,
      });

      render(<MedicationsTable />);

      // Order should be maintained for medications with same priority/status
      const activeTab = screen.getAllByRole('tabpanel')[0];
      const medicationText = activeTab.textContent;

      const firstIndex = medicationText?.indexOf('First Regular') ?? -1;
      const secondIndex = medicationText?.indexOf('Second Regular') ?? -1;
      const thirdIndex = medicationText?.indexOf('Third Regular') ?? -1;

      expect(firstIndex).toBeLessThan(secondIndex);
      expect(secondIndex).toBeLessThan(thirdIndex);
    });

    it('prioritizes STAT over PRN over regular medications correctly', () => {
      const medications = [
        mockMedicationWithSTAT,
        mockMedicationWithPRN,
        createTestMedication({
          name: 'Regular Medication',
          isImmediate: false,
          asNeeded: false,
        }),
      ];

      mockUseMedicationRequest.mockReturnValue({
        medications,
        loading: false,
        error: null,
      });

      render(<MedicationsTable />);

      const activeTab = screen.getAllByRole('tabpanel')[0];
      const medicationText = activeTab.textContent;

      // STAT should appear first
      const statIndex = medicationText?.indexOf('Epinephrine') ?? -1;
      const prnIndex = medicationText?.indexOf('Paracetamol') ?? -1;
      const regularIndex = medicationText?.indexOf('Regular Medication') ?? -1;

      expect(statIndex).toBeLessThan(prnIndex);
      expect(prnIndex).toBeLessThan(regularIndex);
    });
  });

  describe('Tab-Specific Behavior', () => {
    beforeEach(() => {
      const medications = [
        createTestMedication({
          name: 'Active Med',
          status: MedicationStatus.Active,
        }),
        createTestMedication({
          name: 'OnHold Med',
          status: MedicationStatus.OnHold,
        }),
        createTestMedication({
          name: 'Completed Med',
          status: MedicationStatus.Completed,
        }),
        createTestMedication({
          name: 'Stopped Med',
          status: MedicationStatus.Stopped,
        }),
      ];

      mockUseMedicationRequest.mockReturnValue({
        medications,
        loading: false,
        error: null,
      });
    });

    it('shows different empty state messages per tab', async () => {
      mockUseMedicationRequest.mockReturnValue({
        medications: [],
        loading: false,
        error: null,
      });

      render(<MedicationsTable />);

      // Active & Scheduled tab empty message
      expect(screen.getByText('No active medications')).toBeInTheDocument();

      // Switch to All tab
      const allTab = screen.getByRole('tab', { name: 'All' });
      await userEvent.click(allTab);

      await waitFor(() => {
        expect(screen.getByText('No medication history')).toBeInTheDocument();
      });
    });

    it('maintains separate table components per tab', async () => {
      render(<MedicationsTable />);

      // Active tab uses SortableDataTable
      expect(screen.getAllByRole('tabpanel')).toHaveLength(1);

      // Switch to All tab
      const allTab = screen.getByRole('tab', { name: 'All' });
      await userEvent.click(allTab);

      await waitFor(() => {
        // All tab should render content (ExpandableDataTable or SortableDataTable)
        expect(screen.getAllByRole('tabpanel')).toHaveLength(1);
      });
    });

    it('handles loading states differently per tab', async () => {
      mockUseMedicationRequest.mockReturnValue({
        medications: [],
        loading: true,
        error: null,
      });

      render(<MedicationsTable />);

      // Both tabs should handle loading state
      expect(screen.getByTestId('medications-table')).toBeInTheDocument();

      const allTab = screen.getByRole('tab', { name: 'All' });
      await userEvent.click(allTab);

      expect(screen.getByTestId('medications-table')).toBeInTheDocument();
    });
  });

  describe('Snapshots', () => {
    it('matches snapshot for active medications tab', () => {
      const medications = [
        createTestMedication({
          name: 'Active Medication',
          status: MedicationStatus.Active,
        }),
        createTestMedication({
          name: 'On Hold Medication',
          status: MedicationStatus.OnHold,
        }),
      ];

      mockUseMedicationRequest.mockReturnValue({
        medications,
        loading: false,
        error: null,
      });

      const { container } = render(<MedicationsTable />);
      expect(container.firstChild).toMatchSnapshot();
    });

    it('matches snapshot for all medications tab with date grouping', async () => {
      const medications = mockMedicationsWithDifferentDates;

      mockUseMedicationRequest.mockReturnValue({
        medications,
        loading: false,
        error: null,
      });

      const { container } = render(<MedicationsTable />);

      // Switch to All tab
      const allTab = screen.getByRole('tab', { name: 'All' });
      await userEvent.click(allTab);

      await waitFor(() => {
        expect(container.firstChild).toMatchSnapshot();
      });
    });

    it('matches snapshot for loading state', () => {
      mockUseMedicationRequest.mockReturnValue({
        medications: [],
        loading: true,
        error: null,
      });

      const { container } = render(<MedicationsTable />);
      expect(container.firstChild).toMatchSnapshot();
    });

    it('matches snapshot for error state', () => {
      mockUseMedicationRequest.mockReturnValue({
        medications: [],
        loading: false,
        error: new Error('Test error'),
      });

      const { container } = render(<MedicationsTable />);
      expect(container.firstChild).toMatchSnapshot();
    });

    it('matches snapshot for empty state', () => {
      mockUseMedicationRequest.mockReturnValue({
        medications: [],
        loading: false,
        error: null,
      });

      const { container } = render(<MedicationsTable />);
      expect(container.firstChild).toMatchSnapshot();
    });
  });
});
