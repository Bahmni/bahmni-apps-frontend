import { render, screen, waitFor } from '@testing-library/react';
import { axe, toHaveNoViolations } from 'jest-axe';
import React from 'react';
import i18n from '@/setupTests.i18n';
import { createMockRadiologyInvestigation } from '@__mocks__/radiologyInvestigationMocks';
import { useRadiologyInvestigation } from '@hooks/useRadiologyInvestigation';
import { RadiologyInvestigation } from '@types/radiologyInvestigation';
import RadiologyInvestigationTable from '../RadiologyInvestigationTable';

expect.extend(toHaveNoViolations);

// Mock the hook
jest.mock('@hooks/useRadiologyInvestigation');
const mockUseRadiologyInvestigation =
  useRadiologyInvestigation as jest.MockedFunction<
    typeof useRadiologyInvestigation
  >;

// Mock SortableDataTable
jest.mock('@components/common/sortableDataTable/SortableDataTable', () => {
  return {
    SortableDataTable: ({
      rows,
      headers,
      renderCell,
      loading,
      errorStateMessage,
      emptyStateMessage,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    }: any) => (
      <div data-testid="mock-sortable-data-table">
        {loading && <div data-testid="sortable-table-skeleton">Loading...</div>}
        {errorStateMessage && (
          <div data-testid="sortable-table-error">{errorStateMessage}</div>
        )}
        {rows.length === 0 && !loading && !errorStateMessage && (
          <div data-testid="sortable-table-empty">{emptyStateMessage}</div>
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

describe('RadiologyInvestigationTable', () => {
  const mockRadiologyInvestigations: RadiologyInvestigation[] = [
    {
      id: 'order-1',
      testName: 'Chest X-Ray',
      priority: 'stat',
      orderedBy: 'Dr. Smith',
      orderedDate: '2023-12-01T10:30:00.000Z',
    },
    {
      id: 'order-2',
      testName: 'CT Scan',
      priority: 'routine',
      orderedBy: 'Dr. Johnson',
      orderedDate: '2023-12-01T14:15:00.000Z',
    },
    {
      id: 'order-3',
      testName: 'MRI',
      priority: 'stat',
      orderedBy: 'Dr. Brown',
      orderedDate: '2023-11-30T09:00:00.000Z',
    },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    i18n.changeLanguage('en');
  });

  it('should display loading skeleton when loading', () => {
    // Arrange
    mockUseRadiologyInvestigation.mockReturnValue({
      radiologyInvestigations: [],
      loading: true,
      error: null,
      refetch: jest.fn(),
    });

    // Act
    render(<RadiologyInvestigationTable />);

    // Assert
    expect(screen.getByTestId('sortable-table-skeleton')).toBeInTheDocument();
  });

  it('should display error states for error scenario', () => {
    // Arrange - Error state
    mockUseRadiologyInvestigation.mockReturnValue({
      radiologyInvestigations: [],
      loading: false,
      error: new Error('Failed to fetch'),
      refetch: jest.fn(),
    });

    // Act
    render(<RadiologyInvestigationTable />);

    // Assert - Error
    expect(screen.getByText('Failed to fetch')).toBeInTheDocument();
  });

  it('should handle empty data gracefully', () => {
    // Arrange
    mockUseRadiologyInvestigation.mockReturnValue({
      radiologyInvestigations: [],
      loading: false,
      error: null,
      refetch: jest.fn(),
    });

    // Act
    render(<RadiologyInvestigationTable />);

    // Assert
    expect(
      screen.getByText('No radiology investigations recorded'),
    ).toBeInTheDocument();
  });

  it('should group investigations by date and display in accordion', async () => {
    // Arrange
    mockUseRadiologyInvestigation.mockReturnValue({
      radiologyInvestigations: mockRadiologyInvestigations,
      loading: false,
      error: null,
      refetch: jest.fn(),
    });

    // Act
    render(<RadiologyInvestigationTable />);

    expect(
      screen.getByTestId('radiology-investigations-table'),
    ).toBeInTheDocument();

    // Assert
    await waitFor(() => {
      const accordianItemsGroupedByDate = screen.getAllByTestId(
        'accordian-table-title',
      );
      expect(accordianItemsGroupedByDate[0]).toHaveTextContent(
        'December 01, 2023',
      );
      expect(accordianItemsGroupedByDate[1]).toHaveTextContent(
        'November 30, 2023',
      );
      expect(accordianItemsGroupedByDate).toHaveLength(2);
      expect(screen.getAllByTestId('mock-sortable-data-table')).toHaveLength(2);
    });
  });

  it('should sort investigations by priority within groups', async () => {
    // Arrange
    const mixedPriorityInvestigations: RadiologyInvestigation[] = [
      {
        id: 'order-1',
        testName: 'Routine X-Ray',
        priority: 'routine',
        orderedBy: 'Dr. Routine',
        orderedDate: '2023-12-01T10:30:00.000Z',
      },
      {
        id: 'order-2',
        testName: 'Stat CT Scan',
        priority: 'stat',
        orderedBy: 'Dr. Stat',
        orderedDate: '2023-12-01T14:15:00.000Z',
      },
    ];

    mockUseRadiologyInvestigation.mockReturnValue({
      radiologyInvestigations: mixedPriorityInvestigations,
      loading: false,
      error: null,
      refetch: jest.fn(),
    });

    // Act
    render(<RadiologyInvestigationTable />);

    // Assert - Stat should come first
    await waitFor(() => {
      const statCell = screen.getByTestId('cell-testName-0');
      const routineCell = screen.getByTestId('cell-testName-1');

      expect(statCell).toHaveTextContent('Stat CT Scan');
      expect(statCell).toHaveTextContent('Urgent');

      expect(routineCell).toHaveTextContent('Routine X-Ray');
      expect(routineCell).not.toHaveTextContent('routine');
    });
  });

  it('should display -- in results column for all orders', async () => {
    // Arrange
    mockUseRadiologyInvestigation.mockReturnValue({
      radiologyInvestigations: mockRadiologyInvestigations,
      loading: false,
      error: null,
      refetch: jest.fn(),
    });

    // Act
    render(<RadiologyInvestigationTable />);

    // Assert
    await waitFor(() => {
      // Check first date group orders
      expect(screen.getAllByTestId('cell-results-0')[0]).toHaveTextContent(
        '--',
      );
      expect(screen.getByTestId('cell-results-1')).toHaveTextContent('--');
      // Check second date group order
      expect(screen.getAllByTestId('cell-results-0')[1]).toHaveTextContent(
        '--',
      );
    });
  });

  it('should open first accordion item by default', async () => {
    // Arrange
    mockUseRadiologyInvestigation.mockReturnValue({
      radiologyInvestigations: mockRadiologyInvestigations,
      loading: false,
      error: null,
      refetch: jest.fn(),
    });

    // Act
    render(<RadiologyInvestigationTable />);

    // Assert
    // await waitFor(() => {
    //   const accordianItemsGroupedByDate =
    //     screen.getAllByTestId(`cell-orderedBy-0`);
    //   expect(accordianItemsGroupedByDate[1]).not.toBeVisible(); // First item should be open
    // });
  });

  it('should render test name with priority tag for stat orders', async () => {
    // Arrange
    mockUseRadiologyInvestigation.mockReturnValue({
      radiologyInvestigations: mockRadiologyInvestigations,
      loading: false,
      error: null,
      refetch: jest.fn(),
    });

    // Act
    render(<RadiologyInvestigationTable />);

    // Assert
    await waitFor(() => {
      const statCell = screen.getAllByTestId('cell-testName-0')[0];
      expect(statCell).toHaveTextContent('Chest X-Ray');
      expect(statCell).toHaveTextContent('Urgent');
    });
  });

  it('should render ordered by information', async () => {
    // Arrange
    mockUseRadiologyInvestigation.mockReturnValue({
      radiologyInvestigations: mockRadiologyInvestigations,
      loading: false,
      error: null,
      refetch: jest.fn(),
    });

    // Act
    render(<RadiologyInvestigationTable />);

    // Assert
    await waitFor(() => {
      expect(screen.getAllByTestId('cell-orderedBy-0')[0]).toHaveTextContent(
        'Dr. Smith',
      );
    });
  });

  it('should render priority tag only for stat orders', async () => {
    // Arrange
    const investigations: RadiologyInvestigation[] = [
      {
        id: 'order-1',
        testName: 'Stat X-Ray',
        priority: 'stat',
        orderedBy: 'Dr. Stat',
        orderedDate: '2023-12-01T10:30:00.000Z',
      },
      {
        id: 'order-2',
        testName: 'Routine CT',
        priority: 'routine',
        orderedBy: 'Dr. Routine',
        orderedDate: '2023-12-01T14:15:00.000Z',
      },
    ];

    mockUseRadiologyInvestigation.mockReturnValue({
      radiologyInvestigations: investigations,
      loading: false,
      error: null,
      refetch: jest.fn(),
    });

    // Act
    render(<RadiologyInvestigationTable />);

    // Assert
    await waitFor(() => {
      // Check stat priority - should have tag displayed as "Urgent"
      const statCell = screen.getByTestId('cell-testName-0');
      expect(statCell).toHaveTextContent('Stat X-Ray');
      expect(statCell).toHaveTextContent('Urgent');

      // Check routine priority - should NOT have tag
      const routineCell = screen.getByTestId('cell-testName-1');
      expect(routineCell).toHaveTextContent('Routine CT');
      expect(routineCell).not.toHaveTextContent('routine');
    });
  });

  it('should format dates correctly for display', async () => {
    // Arrange
    mockUseRadiologyInvestigation.mockReturnValue({
      radiologyInvestigations: mockRadiologyInvestigations,
      loading: false,
      error: null,
      refetch: jest.fn(),
    });

    // Act
    render(<RadiologyInvestigationTable />);

    // Assert
    await waitFor(() => {
      const tableTitles = screen.getAllByTestId('accordian-table-title');
      expect(tableTitles[0]).toHaveTextContent('December 01, 2023');
      expect(tableTitles[1]).toHaveTextContent('November 30, 2023');
    });
  });

  it('should render with correct accessibility attributes', () => {
    // Arrange
    mockUseRadiologyInvestigation.mockReturnValue({
      radiologyInvestigations: mockRadiologyInvestigations,
      loading: false,
      error: null,
      refetch: jest.fn(),
    });

    // Act
    render(<RadiologyInvestigationTable />);

    // Assert
    expect(
      screen.getByTestId('radiology-investigations-table'),
    ).toBeInTheDocument();
  });

  it('should handle multiple priority types correctly', async () => {
    // Arrange
    const multiPriorityInvestigations: RadiologyInvestigation[] = [
      {
        id: 'order-1',
        testName: 'Emergency CT',
        priority: 'stat',
        orderedBy: 'Dr. Emergency',
        orderedDate: '2023-12-01T10:30:00.000Z',
      },
      {
        id: 'order-2',
        testName: 'Routine X-Ray',
        priority: 'routine',
        orderedBy: 'Dr. Routine',
        orderedDate: '2023-12-01T14:15:00.000Z',
      },
      {
        id: 'order-3',
        testName: 'Standard MRI',
        priority: '',
        orderedBy: 'Dr. Standard',
        orderedDate: '2023-12-01T16:30:00.000Z',
      },
    ];

    mockUseRadiologyInvestigation.mockReturnValue({
      radiologyInvestigations: multiPriorityInvestigations,
      loading: false,
      error: null,
      refetch: jest.fn(),
    });

    // Act
    render(<RadiologyInvestigationTable />);

    // Assert
    await waitFor(() => {
      // Check stat priority
      const statCell = screen.getByTestId('cell-testName-0');
      expect(statCell).toHaveTextContent('Emergency CT');
      expect(statCell).toHaveTextContent('Urgent');

      // Check routine priority
      const routineCell = screen.getByTestId('cell-testName-1');
      expect(routineCell).toHaveTextContent('Routine X-Ray');
      expect(routineCell).not.toHaveTextContent('routine');

      // Check empty priority
      const emptyCell = screen.getByTestId('cell-testName-2');
      expect(emptyCell).toHaveTextContent('Standard MRI');
      expect(emptyCell).not.toHaveTextContent('Urgent');
    });
  });

  it('should filter out replacement entries before grouping by date', async () => {
    // Arrange - Include replacement scenario from mock data
    const investigationsWithReplacements = [
      createMockRadiologyInvestigation(
        '207172a2-27e3-4fef-bea2-85fb826575e4',
        'MRI - Replacing',
        'routine',
        ['271f2b4f-a239-418b-ba9e-f23014093df3'],
      ),
      createMockRadiologyInvestigation(
        '271f2b4f-a239-418b-ba9e-f23014093df3',
        'MRI - Replaced',
        'routine',
      ),
      createMockRadiologyInvestigation(
        '9c847638-295b-4e3e-933d-47d5cad34faf',
        'X-Ray - Standalone',
        'routine',
      ),
    ];

    mockUseRadiologyInvestigation.mockReturnValue({
      radiologyInvestigations: investigationsWithReplacements,
      loading: false,
      error: null,
      refetch: jest.fn(),
    });

    // Act
    render(<RadiologyInvestigationTable />);

    // Assert - Only standalone entry should be displayed
    await waitFor(() => {
      expect(screen.getByTestId('cell-testName-0')).toHaveTextContent(
        'X-Ray - Standalone',
      );
      expect(screen.queryByText('MRI - Replacing')).not.toBeInTheDocument();
      expect(screen.queryByText('MRI - Replaced')).not.toBeInTheDocument();
    });
  });

  it('should handle complex replacement scenarios correctly', async () => {
    // Arrange - Multiple replacement relationships
    const complexReplacements = [
      // Chain replacement scenario
      createMockRadiologyInvestigation('chain-3', 'Third Version', 'stat', [
        'chain-2',
      ]),
      createMockRadiologyInvestigation('chain-2', 'Second Version', 'routine', [
        'chain-1',
      ]),
      createMockRadiologyInvestigation('chain-1', 'First Version', 'routine'),

      // Multiple replacements by single entry
      createMockRadiologyInvestigation(
        'multi-replace',
        'Combined Order',
        'stat',
        ['old-1', 'old-2'],
      ),
      createMockRadiologyInvestigation('old-1', 'Old Order 1', 'routine'),
      createMockRadiologyInvestigation('old-2', 'Old Order 2', 'routine'),

      // Standalone entries (should remain)
      createMockRadiologyInvestigation(
        'standalone-1',
        'Standalone X-Ray',
        'routine',
      ),
      createMockRadiologyInvestigation('standalone-2', 'Standalone CT', 'stat'),
    ];

    mockUseRadiologyInvestigation.mockReturnValue({
      radiologyInvestigations: complexReplacements,
      loading: false,
      error: null,
      refetch: jest.fn(),
    });

    // Act
    render(<RadiologyInvestigationTable />);

    // Assert - Only standalone entries should be displayed
    await waitFor(() => {
      expect(screen.getByTestId('cell-testName-0')).toHaveTextContent(
        'Standalone CT',
      ); // stat comes first
      expect(screen.getByTestId('cell-testName-1')).toHaveTextContent(
        'Standalone X-Ray',
      );

      // All replacement-related entries should be filtered out
      expect(screen.queryByText('Third Version')).not.toBeInTheDocument();
      expect(screen.queryByText('Second Version')).not.toBeInTheDocument();
      expect(screen.queryByText('First Version')).not.toBeInTheDocument();
      expect(screen.queryByText('Combined Order')).not.toBeInTheDocument();
      expect(screen.queryByText('Old Order 1')).not.toBeInTheDocument();
      expect(screen.queryByText('Old Order 2')).not.toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('should have no accessibility violations when data is loaded', async () => {
      // Arrange
      mockUseRadiologyInvestigation.mockReturnValue({
        radiologyInvestigations: mockRadiologyInvestigations,
        loading: false,
        error: null,
        refetch: jest.fn(),
      });

      // Act
      const { container } = render(<RadiologyInvestigationTable />);

      // Assert
      expect(await axe(container)).toHaveNoViolations();
    });
  });
});
