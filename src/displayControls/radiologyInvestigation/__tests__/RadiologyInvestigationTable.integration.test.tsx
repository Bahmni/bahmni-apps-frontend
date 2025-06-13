import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { I18nextProvider } from 'react-i18next';
import RadiologyInvestigationTable from '../RadiologyInvestigationTable';
import { getPatientRadiologyInvestigations } from '@services/radiologyInvestigationService';
import { RadiologyInvestigation } from '@types/radiologyInvestigation';
import i18n from '@/setupTests.i18n';

// Mock the service layer only (integration test pattern)
jest.mock('@services/radiologyInvestigationService');
const mockGetPatientRadiologyInvestigations =
  getPatientRadiologyInvestigations as jest.MockedFunction<
    typeof getPatientRadiologyInvestigations
  >;

// Mock patient UUID
jest.mock('@hooks/usePatientUUID', () => ({
  usePatientUUID: () => 'test-patient-uuid-123',
}));

// Mock ExpandableDataTable component
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
      className,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    }: any) => (
      <div data-testid="expandable-data-table" className={className}>
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

describe('RadiologyInvestigationTable Integration Tests', () => {
  const mockRadiologyInvestigations: RadiologyInvestigation[] = [
    {
      id: 'order-1',
      testName: 'Chest X-Ray',
      priority: 'stat',
      orderedBy: 'Dr. Smith',
      orderedDate: '2023-12-01T10:00:00Z',
    },
    {
      id: 'order-2',
      testName: 'CT Scan Abdomen',
      priority: 'routine',
      orderedBy: 'Dr. Johnson',
      orderedDate: '2023-12-01T14:30:00Z',
    },
    {
      id: 'order-3',
      testName: 'MRI Brain',
      priority: 'stat',
      orderedBy: 'Dr. Brown',
      orderedDate: '2023-11-30T09:15:00Z',
    },
  ];

  const renderWithProviders = (component: React.ReactElement) => {
    return render(<I18nextProvider i18n={i18n}>{component}</I18nextProvider>);
  };

  beforeEach(() => {
    jest.clearAllMocks();
    i18n.changeLanguage('en');
  });

  describe('Happy Path', () => {
    it('should successfully load and display radiology investigations through complete integration', async () => {
      // Arrange
      mockGetPatientRadiologyInvestigations.mockResolvedValueOnce(
        mockRadiologyInvestigations,
      );

      // Act
      renderWithProviders(<RadiologyInvestigationTable />);

      // Assert - Initial loading state
      expect(screen.getByTestId('data-table-skeleton')).toBeInTheDocument();

      // Assert - Service should be called with correct patient UUID
      expect(mockGetPatientRadiologyInvestigations).toHaveBeenCalledWith(
        'test-patient-uuid-123',
      );

      // Assert - After loading, data should be displayed
      await waitFor(() => {
        expect(
          screen.queryByTestId('data-table-skeleton'),
        ).not.toBeInTheDocument();
      });

      // Assert - Verify date groups are rendered (component should group the ungrouped data)
      const tableTitles = screen.getAllByTestId('table-title');
      expect(tableTitles).toHaveLength(2);
      expect(tableTitles[0]).toHaveTextContent('December 01, 2023');
      expect(tableTitles[1]).toHaveTextContent('November 30, 2023');

      // Assert - Verify first accordion is open by default
      const isOpenElements = screen.getAllByTestId('is-open');
      expect(isOpenElements[0]).toHaveTextContent('true');
      expect(isOpenElements[1]).toHaveTextContent('false');

      // Assert - Verify radiology order data is displayed correctly
      await waitFor(() => {
        // First date group, first order (stat priority should come first due to sorting)
        const firstTestNameCell = screen.getAllByTestId('cell-testName-0')[0];
        expect(firstTestNameCell).toHaveTextContent('Chest X-Ray');
        expect(firstTestNameCell).toHaveTextContent('Urgent'); // stat priority displays as "Urgent"

        // Results column should show "--"
        const firstResultsCell = screen.getAllByTestId('cell-results-0')[0];
        expect(firstResultsCell).toHaveTextContent('--');

        // Ordered by should be displayed
        const firstOrderedByCell = screen.getAllByTestId('cell-orderedBy-0')[0];
        expect(firstOrderedByCell).toHaveTextContent('Dr. Smith');
      });
    });

    it('should handle multiple date groups and display them correctly with priority sorting', async () => {
      // Arrange - Mixed priority orders to test sorting
      const mixedPriorityOrders: RadiologyInvestigation[] = [
        {
          id: 'order-routine',
          testName: 'Routine X-Ray',
          priority: 'routine',
          orderedBy: 'Dr. Routine',
          orderedDate: '2023-12-01T08:00:00Z',
        },
        {
          id: 'order-stat',
          testName: 'Emergency CT',
          priority: 'stat',
          orderedBy: 'Dr. Emergency',
          orderedDate: '2023-12-01T10:00:00Z',
        },
      ];

      mockGetPatientRadiologyInvestigations.mockResolvedValueOnce(
        mixedPriorityOrders,
      );

      // Act
      renderWithProviders(<RadiologyInvestigationTable />);

      // Assert - Wait for loading to complete
      await waitFor(() => {
        expect(
          screen.queryByTestId('data-table-skeleton'),
        ).not.toBeInTheDocument();
      });

      // Assert - Verify priority sorting (stat orders should come first)
      await waitFor(() => {
        const firstRow = screen.getByTestId('cell-testName-0');
        const secondRow = screen.getByTestId('cell-testName-1');

        // Stat priority order should be first
        expect(firstRow).toHaveTextContent('Emergency CT');
        expect(firstRow).toHaveTextContent('Urgent');

        // Routine priority order should be second
        expect(secondRow).toHaveTextContent('Routine X-Ray');
        expect(secondRow).not.toHaveTextContent('routine'); // No tag for routine
      });
    });

    it('should display empty state when no radiology investigations are found', async () => {
      // Arrange
      mockGetPatientRadiologyInvestigations.mockResolvedValueOnce([]);

      // Act
      renderWithProviders(<RadiologyInvestigationTable />);

      // Assert - Wait for loading to complete
      await waitFor(() => {
        expect(
          screen.queryByTestId('data-table-skeleton'),
        ).not.toBeInTheDocument();
      });

      // Assert - Empty state message should be displayed
      expect(
        screen.getByText('No radiology investigations recorded'),
      ).toBeInTheDocument();

      // Assert - No accordion tables should be rendered
      expect(
        screen.queryByTestId('expandable-data-table'),
      ).not.toBeInTheDocument();
    });
  });

  describe('Sad Path', () => {
    it('should handle network errors gracefully and display error message', async () => {
      // Arrange
      const networkError = new Error('Network request failed');
      mockGetPatientRadiologyInvestigations.mockRejectedValueOnce(networkError);

      // Act
      renderWithProviders(<RadiologyInvestigationTable />);

      // Assert - Initial loading state
      expect(screen.getByTestId('data-table-skeleton')).toBeInTheDocument();

      // Assert - Service should be called
      expect(mockGetPatientRadiologyInvestigations).toHaveBeenCalledWith(
        'test-patient-uuid-123',
      );

      // Assert - After error, loading should disappear and error message should show
      await waitFor(() => {
        expect(
          screen.queryByTestId('data-table-skeleton'),
        ).not.toBeInTheDocument();
      });

      await waitFor(() => {
        expect(
          screen.getByText('Error fetching radiology investigations'),
        ).toBeInTheDocument();
      });

      // Assert - No data tables should be rendered
      expect(
        screen.queryByTestId('expandable-data-table'),
      ).not.toBeInTheDocument();
    });

    it('should handle API timeout errors appropriately', async () => {
      // Arrange
      const timeoutError = new Error('Request timeout');
      mockGetPatientRadiologyInvestigations.mockRejectedValueOnce(timeoutError);

      // Act
      renderWithProviders(<RadiologyInvestigationTable />);

      // Assert - Wait for error state
      await waitFor(() => {
        expect(
          screen.queryByTestId('data-table-skeleton'),
        ).not.toBeInTheDocument();
      });

      // Assert - Error message should be displayed
      expect(
        screen.getByText('Error fetching radiology investigations'),
      ).toBeInTheDocument();

      // Assert - Component title should still be present
      expect(screen.getByText('Radiology Investigations')).toBeInTheDocument();
    });
  });

  describe('Edge Cases', () => {
    it('should handle malformed service response gracefully', async () => {
      // Arrange - Simulate malformed data that passes initial type checks but has issues
      const malformedData: RadiologyInvestigation[] = [
        {
          id: 'order-1',
          testName: '', // Empty test name
          priority: 'unknown', // Unknown priority
          orderedBy: '',
          orderedDate: '2023-12-01T10:00:00Z',
        },
      ];

      mockGetPatientRadiologyInvestigations.mockResolvedValueOnce(
        malformedData,
      );

      // Act
      renderWithProviders(<RadiologyInvestigationTable />);

      // Assert - Component should still render without crashing
      await waitFor(() => {
        expect(
          screen.queryByTestId('data-table-skeleton'),
        ).not.toBeInTheDocument();
      });

      // Assert - Should display the table even with empty/malformed data
      expect(screen.getByTestId('expandable-data-table')).toBeInTheDocument();

      // Assert - Should handle empty test name gracefully
      const testNameCell = screen.getByTestId('cell-testName-0');
      expect(testNameCell).toBeInTheDocument(); // Should not crash
    });

    it('should render component structure correctly even when no data', async () => {
      // Arrange
      mockGetPatientRadiologyInvestigations.mockResolvedValueOnce([]);

      // Act
      renderWithProviders(<RadiologyInvestigationTable />);

      // Assert - Wait for loading to complete
      await waitFor(() => {
        expect(
          screen.queryByTestId('data-table-skeleton'),
        ).not.toBeInTheDocument();
      });

      // Assert - Basic component structure should be present
      expect(
        screen.getByTestId('radiology-investigations-table'),
      ).toBeInTheDocument();
      expect(screen.getByText('Radiology Investigations')).toBeInTheDocument();
      expect(
        screen.getByText('No radiology investigations recorded'),
      ).toBeInTheDocument();
    });
  });

  describe('Data Flow Integration', () => {
    it('should complete the full data flow from service through hook to component display', async () => {
      // Arrange
      const realisticData: RadiologyInvestigation[] = [
        {
          id: 'rad-001',
          testName: 'Chest X-Ray PA & Lateral',
          priority: 'stat',
          orderedBy: 'Dr. Sarah Wilson, MD',
          orderedDate: '2023-12-01T08:30:00Z',
        },
        {
          id: 'rad-002',
          testName: 'CT Scan Chest without Contrast',
          priority: 'routine',
          orderedBy: 'Dr. Michael Chen, MD',
          orderedDate: '2023-12-01T14:15:00Z',
        },
      ];

      mockGetPatientRadiologyInvestigations.mockResolvedValueOnce(
        realisticData,
      );

      // Act
      renderWithProviders(<RadiologyInvestigationTable />);

      // Assert - Verify complete integration flow
      // 1. Service call
      expect(mockGetPatientRadiologyInvestigations).toHaveBeenCalledWith(
        'test-patient-uuid-123',
      );

      // 2. Loading state
      expect(screen.getByTestId('data-table-skeleton')).toBeInTheDocument();

      // 3. Data transformation and display
      await waitFor(() => {
        expect(
          screen.queryByTestId('data-table-skeleton'),
        ).not.toBeInTheDocument();
      });

      // 4. Verify hook state management worked
      expect(screen.getByTestId('expandable-data-table')).toBeInTheDocument();

      // 5. Verify data rendering through component (component groups the ungrouped data)
      await waitFor(() => {
        // Stat order should be first due to priority sorting
        const statCell = screen.getByTestId('cell-testName-0');
        expect(statCell).toHaveTextContent('Chest X-Ray PA & Lateral');
        expect(statCell).toHaveTextContent('Urgent');

        // Routine order should be second
        const routineCell = screen.getByTestId('cell-testName-1');
        expect(routineCell).toHaveTextContent('CT Scan Chest without Contrast');
        expect(routineCell).not.toHaveTextContent('routine');

        // Results should show "--" for both
        expect(screen.getByTestId('cell-results-0')).toHaveTextContent('--');
        expect(screen.getByTestId('cell-results-1')).toHaveTextContent('--');

        // Ordered by should be displayed
        expect(screen.getByTestId('cell-orderedBy-0')).toHaveTextContent(
          'Dr. Sarah Wilson, MD',
        );
        expect(screen.getByTestId('cell-orderedBy-1')).toHaveTextContent(
          'Dr. Michael Chen, MD',
        );
      });

      // 6. Verify accordion behavior
      expect(screen.getByTestId('is-open')).toHaveTextContent('true');
    });
  });
});
