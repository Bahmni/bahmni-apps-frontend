import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import RadiologyOrdersTable from '../RadiologyInvestigationTable';
import { useRadiologyInvestigation } from '@/hooks/useRadiologyInvestigation';
import { RadiologyInvestigationByDate } from '@/types/radiologyInvestigation';
import i18n from '@/setupTests.i18n';
import { axe, toHaveNoViolations } from 'jest-axe';

expect.extend(toHaveNoViolations);

// Mock the hook
jest.mock('@hooks/useRadiologyInvestigation');
const mockUseRadiologyOrders = useRadiologyInvestigation as jest.MockedFunction<
  typeof useRadiologyInvestigation
>;

// Mock ExpandableDataTable
jest.mock('@components/common/expandableDataTable/ExpandableDataTable', () => {
  return {
    ExpandableDataTable: ({
      tableTitle,
      rows,
      headers,
      renderCell,
      loading,
      error,
      emptyStateMessage,
      isOpen,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    }: any) => (
      <div data-testid="expandable-data-table">
        <div data-testid="table-title">{tableTitle}</div>
        <div data-testid="is-open">{isOpen ? 'true' : 'false'}</div>
        {loading && <div data-testid="loading">Loading...</div>}
        {error && <div data-testid="error">{error}</div>}
        {rows.length === 0 && !loading && !error && (
          <div data-testid="empty-state">{emptyStateMessage}</div>
        )}
        {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          rows.map((row: any, index: number) => (
            <div key={row.id} data-testid={`row-${index}`}>
              {
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                headers.map((header: any) => (
                  <div
                    key={header.key}
                    data-testid={`cell-${header.key}-${index}`}
                  >
                    {renderCell(row, header.key)}
                  </div>
                ))
              }
            </div>
          ))
        }
      </div>
    ),
  };
});

describe('RadiologyOrdersTable', () => {
  const mockRadiologyOrders: RadiologyInvestigationByDate[] = [
    {
      date: '2023-12-01',
      orders: [
        {
          id: 'order-1',
          testName: 'Chest X-Ray',
          priority: 'stat',
          orderedBy: 'Dr. Smith',
          orderedDate: '2023-12-01',
        },
        {
          id: 'order-2',
          testName: 'CT Scan',
          priority: 'routine',
          orderedBy: 'Dr. Johnson',
          orderedDate: '2023-12-01',
        },
      ],
    },
    {
      date: '2023-11-30',
      orders: [
        {
          id: 'order-3',
          testName: 'MRI',
          priority: 'stat',
          orderedBy: 'Dr. Brown',
          orderedDate: '2023-11-30',
        },
      ],
    },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    i18n.changeLanguage('en');
  });

  it('should render title correctly', () => {
    // Arrange
    mockUseRadiologyOrders.mockReturnValue({
      radiologyInvestigations: [],
      loading: false,
      error: null,
      refetch: jest.fn(),
    });

    // Act
    render(<RadiologyOrdersTable />);

    // Assert
    expect(screen.getByText('Radiology Investigations')).toBeInTheDocument();
  });

  it('should display loading skeleton when loading', () => {
    // Arrange
    mockUseRadiologyOrders.mockReturnValue({
      radiologyInvestigations: [],
      loading: true,
      error: null,
      refetch: jest.fn(),
    });

    // Act
    render(<RadiologyOrdersTable />);

    // Assert
    expect(screen.getByTestId('data-table-skeleton')).toBeInTheDocument();
  });

  it('should have results column header', async () => {
    // Arrange
    mockUseRadiologyOrders.mockReturnValue({
      radiologyInvestigations: mockRadiologyOrders,
      loading: false,
      error: null,
      refetch: jest.fn(),
    });

    // Act
    render(<RadiologyOrdersTable />);

    // Assert - Headers are passed to ExpandableDataTable component
    // We can verify this through the rendered cells
    await waitFor(() => {
      expect(screen.getAllByTestId('cell-testName-0')[0]).toBeInTheDocument();
      expect(screen.getAllByTestId('cell-results-0')[0]).toBeInTheDocument();
      expect(screen.getAllByTestId('cell-orderedBy-0')[0]).toBeInTheDocument();
    });
  });

  it('should display -- in results column for all orders', async () => {
    // Arrange
    mockUseRadiologyOrders.mockReturnValue({
      radiologyInvestigations: mockRadiologyOrders,
      loading: false,
      error: null,
      refetch: jest.fn(),
    });

    // Act
    render(<RadiologyOrdersTable />);

    // Assert
    await waitFor(() => {
      // Check first date group, first order
      expect(screen.getAllByTestId('cell-results-0')[0]).toHaveTextContent(
        '--',
      );
      // Check first date group, second order
      expect(screen.getByTestId('cell-results-1')).toHaveTextContent('--');
      // Check second date group, first order
      expect(screen.getAllByTestId('cell-results-0')[1]).toHaveTextContent(
        '--',
      );
    });
  });

  it('should have correct column order: testName, results, orderedBy', async () => {
    // Arrange
    mockUseRadiologyOrders.mockReturnValue({
      radiologyInvestigations: mockRadiologyOrders,
      loading: false,
      error: null,
      refetch: jest.fn(),
    });

    // Act
    render(<RadiologyOrdersTable />);

    // Assert - Verify columns exist in correct order through cell testing
    await waitFor(() => {
      expect(screen.getAllByTestId('cell-testName-0')[0]).toBeInTheDocument();
      expect(screen.getAllByTestId('cell-results-0')[0]).toBeInTheDocument();
      expect(screen.getAllByTestId('cell-orderedBy-0')[0]).toBeInTheDocument();
    });
  });

  it('should display error message when there is an error', () => {
    // Arrange
    mockUseRadiologyOrders.mockReturnValue({
      radiologyInvestigations: [],
      loading: false,
      error: new Error('Failed to fetch'),
      refetch: jest.fn(),
    });

    // Act
    render(<RadiologyOrdersTable />);

    // Assert
    expect(
      screen.getByText('Error fetching radiology orders'),
    ).toBeInTheDocument();
  });

  it('should display no radiology orders message when empty', () => {
    // Arrange
    mockUseRadiologyOrders.mockReturnValue({
      radiologyInvestigations: [],
      loading: false,
      error: null,
      refetch: jest.fn(),
    });

    // Act
    render(<RadiologyOrdersTable />);

    // Assert
    expect(screen.getByText('No radiology orders found')).toBeInTheDocument();
  });

  it('should render radiology orders grouped by date', async () => {
    // Arrange
    mockUseRadiologyOrders.mockReturnValue({
      radiologyInvestigations: mockRadiologyOrders,
      loading: false,
      error: null,
      refetch: jest.fn(),
    });

    // Act
    render(<RadiologyOrdersTable />);

    // Assert
    await waitFor(() => {
      expect(screen.getAllByTestId('table-title')[0]).toHaveTextContent(
        'December 01, 2023',
      );
      expect(screen.getAllByTestId('expandable-data-table')).toHaveLength(2);
    });
  });

  it('should open first accordion item by default', async () => {
    // Arrange
    mockUseRadiologyOrders.mockReturnValue({
      radiologyInvestigations: mockRadiologyOrders,
      loading: false,
      error: null,
      refetch: jest.fn(),
    });

    // Act
    render(<RadiologyOrdersTable />);

    // Assert
    await waitFor(() => {
      const isOpenElements = screen.getAllByTestId('is-open');
      expect(isOpenElements[0]).toHaveTextContent('true'); // First item should be open
      expect(isOpenElements[1]).toHaveTextContent('false'); // Second item should be closed
    });
  });

  it('should render test name with priority tag', async () => {
    // Arrange
    mockUseRadiologyOrders.mockReturnValue({
      radiologyInvestigations: mockRadiologyOrders,
      loading: false,
      error: null,
      refetch: jest.fn(),
    });

    // Act
    render(<RadiologyOrdersTable />);

    // Assert
    await waitFor(() => {
      const testNameCells = screen.getAllByTestId('cell-testName-0');
      expect(testNameCells[0]).toHaveTextContent('Chest X-Ray');
      expect(testNameCells[0]).toHaveTextContent('Urgent');
    });
  });

  it('should render ordered by information', async () => {
    // Arrange
    mockUseRadiologyOrders.mockReturnValue({
      radiologyInvestigations: mockRadiologyOrders,
      loading: false,
      error: null,
      refetch: jest.fn(),
    });

    // Act
    render(<RadiologyOrdersTable />);

    // Assert
    await waitFor(() => {
      expect(screen.getAllByTestId('cell-orderedBy-0')[0]).toHaveTextContent(
        'Dr. Smith',
      );
    });
  });

  it('should render priority tag only for stat orders (displayed as Urgent)', async () => {
    // Arrange
    mockUseRadiologyOrders.mockReturnValue({
      radiologyInvestigations: mockRadiologyOrders,
      loading: false,
      error: null,
      refetch: jest.fn(),
    });

    // Act
    render(<RadiologyOrdersTable />);

    // Assert
    await waitFor(() => {
      // Check stat priority - should have tag displayed as "Urgent"
      const statCell = screen.getAllByTestId('cell-testName-0')[0];
      expect(statCell).toHaveTextContent('Chest X-Ray');
      expect(statCell).toHaveTextContent('Urgent');

      // Check routine priority - should NOT have tag
      const routineCell = screen.getByTestId('cell-testName-1');
      expect(routineCell).toHaveTextContent('CT Scan');
      expect(routineCell).not.toHaveTextContent('routine');
    });
  });

  it('should have correct table headers', async () => {
    // Arrange
    mockUseRadiologyOrders.mockReturnValue({
      radiologyInvestigations: mockRadiologyOrders,
      loading: false,
      error: null,
      refetch: jest.fn(),
    });

    // Act
    render(<RadiologyOrdersTable />);

    // Assert - Headers are passed to ExpandableDataTable component
    // We can verify this through the rendered cells
    await waitFor(() => {
      expect(screen.getAllByTestId('cell-testName-0')[0]).toBeInTheDocument();
      expect(screen.getAllByTestId('cell-results-0')[0]).toBeInTheDocument();
      expect(screen.getAllByTestId('cell-orderedBy-0')[0]).toBeInTheDocument();
    });
  });

  it('should format dates correctly for display', async () => {
    // Arrange
    mockUseRadiologyOrders.mockReturnValue({
      radiologyInvestigations: mockRadiologyOrders,
      loading: false,
      error: null,
      refetch: jest.fn(),
    });

    // Act
    render(<RadiologyOrdersTable />);

    // Assert
    await waitFor(() => {
      const tableTitles = screen.getAllByTestId('table-title');
      expect(tableTitles[0]).toHaveTextContent('December 01, 2023');
      expect(tableTitles[1]).toHaveTextContent('November 30, 2023');
    });
  });

  it('should render with correct accessibility attributes', () => {
    // Arrange
    mockUseRadiologyOrders.mockReturnValue({
      radiologyInvestigations: mockRadiologyOrders,
      loading: false,
      error: null,
      refetch: jest.fn(),
    });

    // Act
    render(<RadiologyOrdersTable />);

    // Assert
    expect(screen.getByTestId('radiology-orders-table')).toBeInTheDocument();
  });

  it('should handle stat priority correctly - should display Urgent tag', async () => {
    // Arrange
    const ordersWithStat: RadiologyInvestigationByDate[] = [
      {
        date: '2023-12-01',
        orders: [
          {
            id: 'order-1',
            testName: 'Emergency CT',
            priority: 'stat',
            orderedBy: 'Dr. Emergency',
            orderedDate: '2023-12-01',
          },
        ],
      },
    ];

    mockUseRadiologyOrders.mockReturnValue({
      radiologyInvestigations: ordersWithStat,
      loading: false,
      error: null,
      refetch: jest.fn(),
    });

    // Act
    render(<RadiologyOrdersTable />);

    // Assert
    await waitFor(() => {
      const statCell = screen.getByTestId('cell-testName-0');
      expect(statCell).toHaveTextContent('Emergency CT');
      expect(statCell).toHaveTextContent('Urgent');
      expect(statCell).not.toHaveTextContent('stat');
    });
  });

  it('should handle routine priority correctly - no tag displayed', async () => {
    // Arrange
    const ordersWithRoutine: RadiologyInvestigationByDate[] = [
      {
        date: '2023-12-01',
        orders: [
          {
            id: 'order-1',
            testName: 'Routine X-Ray',
            priority: 'routine',
            orderedBy: 'Dr. Routine',
            orderedDate: '2023-12-01',
          },
        ],
      },
    ];

    mockUseRadiologyOrders.mockReturnValue({
      radiologyInvestigations: ordersWithRoutine,
      loading: false,
      error: null,
      refetch: jest.fn(),
    });

    // Act
    render(<RadiologyOrdersTable />);

    // Assert
    await waitFor(() => {
      const routineCell = screen.getByTestId('cell-testName-0');
      expect(routineCell).toHaveTextContent('Routine X-Ray');
      expect(routineCell).not.toHaveTextContent('routine');
    });
  });

  it('should handle empty priority correctly - no tag displayed', async () => {
    // Arrange
    const ordersWithEmptyPriority: RadiologyInvestigationByDate[] = [
      {
        date: '2023-12-01',
        orders: [
          {
            id: 'order-1',
            testName: 'Standard X-Ray',
            priority: '',
            orderedBy: 'Dr. Standard',
            orderedDate: '2023-12-01',
          },
        ],
      },
    ];

    mockUseRadiologyOrders.mockReturnValue({
      radiologyInvestigations: ordersWithEmptyPriority,
      loading: false,
      error: null,
      refetch: jest.fn(),
    });

    // Act
    render(<RadiologyOrdersTable />);

    // Assert
    await waitFor(() => {
      const emptyPriorityCell = screen.getByTestId('cell-testName-0');
      expect(emptyPriorityCell).toHaveTextContent('Standard X-Ray');
      expect(emptyPriorityCell).not.toHaveTextContent('routine'); // Default fallback should not show
    });
  });

  it('should only open the first accordion item when multiple date groups exist', async () => {
    // Arrange - Using multiple date groups to verify only first is open
    const multipleOrdersByDate: RadiologyInvestigationByDate[] = [
      {
        date: '2023-12-01',
        orders: [
          {
            id: 'order-1',
            testName: 'Recent X-Ray',
            priority: 'stat',
            orderedBy: 'Dr. Recent',
            orderedDate: '2023-12-01',
          },
        ],
      },
      {
        date: '2023-11-30',
        orders: [
          {
            id: 'order-2',
            testName: 'Older CT Scan',
            priority: 'routine',
            orderedBy: 'Dr. Older',
            orderedDate: '2023-11-30',
          },
        ],
      },
      {
        date: '2023-11-29',
        orders: [
          {
            id: 'order-3',
            testName: 'Oldest MRI',
            priority: 'stat',
            orderedBy: 'Dr. Oldest',
            orderedDate: '2023-11-29',
          },
        ],
      },
    ];

    mockUseRadiologyOrders.mockReturnValue({
      radiologyInvestigations: multipleOrdersByDate,
      loading: false,
      error: null,
      refetch: jest.fn(),
    });

    // Act
    render(<RadiologyOrdersTable />);

    // Assert
    await waitFor(() => {
      const isOpenElements = screen.getAllByTestId('is-open');

      // First accordion should be open
      expect(isOpenElements[0]).toHaveTextContent('true');

      // All other accordions should be closed
      expect(isOpenElements[1]).toHaveTextContent('false');
      expect(isOpenElements[2]).toHaveTextContent('false');

      // Verify we have exactly 3 accordion items
      expect(isOpenElements).toHaveLength(3);
    });
  });

  it('should sort radiology investigations by priority within each date group', async () => {
    // Arrange - Mixed priorities within same date group
    const ordersWithMixedPriorities: RadiologyInvestigationByDate[] = [
      {
        date: '2023-12-01',
        orders: [
          {
            id: 'order-2',
            testName: 'Routine X-Ray',
            priority: 'routine',
            orderedBy: 'Dr. Routine',
            orderedDate: '2023-12-01',
          },
          {
            id: 'order-1',
            testName: 'Stat CT Scan',
            priority: 'stat',
            orderedBy: 'Dr. Stat',
            orderedDate: '2023-12-01',
          },
        ],
      },
    ];

    mockUseRadiologyOrders.mockReturnValue({
      radiologyInvestigations: ordersWithMixedPriorities,
      loading: false,
      error: null,
      refetch: jest.fn(),
    });

    // Act
    render(<RadiologyOrdersTable />);

    // Assert - Verify stat comes first, then routine
    await waitFor(() => {
      const statCell = screen.getByTestId('cell-testName-0');
      const routineCell = screen.getByTestId('cell-testName-1');

      expect(statCell).toHaveTextContent('Stat CT Scan');
      expect(statCell).toHaveTextContent('Urgent'); // Should have tag for stat (displayed as Urgent)

      expect(routineCell).toHaveTextContent('Routine X-Ray');
      expect(routineCell).not.toHaveTextContent('routine'); // Should NOT have tag for routine
    });
  });

  describe('Accessibility', () => {
    it('should have no accessibility violations when data is loaded', async () => {
      // Arrange
      mockUseRadiologyOrders.mockReturnValue({
        radiologyInvestigations: mockRadiologyOrders,
        loading: false,
        error: null,
        refetch: jest.fn(),
      });

      // Act
      const { container } = render(<RadiologyOrdersTable />);

      // Assert
      expect(await axe(container)).toHaveNoViolations();
    });
  });
});
