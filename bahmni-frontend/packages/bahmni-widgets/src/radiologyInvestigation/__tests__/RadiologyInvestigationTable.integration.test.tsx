import { render, screen, waitFor } from '@testing-library/react';
import React from 'react';
import { I18nextProvider } from 'react-i18next';
import i18n from '@/setupTests.i18n';
import { getPatientRadiologyInvestigations } from '@services/radiologyInvestigationService';
import { RadiologyInvestigation } from '@types/radiologyInvestigation';
import RadiologyInvestigationTable from '../RadiologyInvestigationTable';

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
      mockGetPatientRadiologyInvestigations.mockResolvedValue(
        mockRadiologyInvestigations,
      );

      // Act
      renderWithProviders(<RadiologyInvestigationTable />);

      // Assert - Initial loading state
      expect(screen.getByTestId('sortable-table-skeleton')).toBeInTheDocument();

      // Assert - Service should be called with correct patient UUID
      expect(mockGetPatientRadiologyInvestigations).toHaveBeenCalledWith(
        'test-patient-uuid-123',
      );

      // Assert - After loading, data should be displayed
      await waitFor(() => {
        expect(
          screen.queryByTestId('sortable-table-skeleton'),
        ).not.toBeInTheDocument();
      });

      // Assert - Verify date groups are rendered (component should group the ungrouped data)
      const tableTitles = screen.getAllByTestId('accordian-table-title');
      expect(tableTitles).toHaveLength(2);
      expect(tableTitles[0]).toHaveTextContent('December 01, 2023');
      expect(tableTitles[1]).toHaveTextContent('November 30, 2023');

      // Assert - Verify radiology order data is displayed correctly
      await waitFor(() => {
        const groupedByDateTables = screen.getAllByRole('table');
        // screen.debug();
        expect(groupedByDateTables).toHaveLength(2);
        expect(groupedByDateTables[0]).toHaveTextContent(
          /CT Scan Abdomen|Dr. Johnson/,
        ); //table1 Table row1
        expect(groupedByDateTables[0]).toHaveTextContent(
          /Chest X-Ray|Dr. Smith/,
        ); //table1 row2
        expect(groupedByDateTables[1]).toHaveTextContent(/MRI Brain|Dr. Brown/); //table2 row1

        // First date group, first order (stat priority should come first due to sorting)
        // const firstTestNameCell = screen.getAllByTestId('cell-testName-0')[0];
        // expect(firstTestNameCell).toHaveTextContent('Chest X-Ray');
        // expect(firstTestNameCell).toHaveTextContent('Urgent'); // stat priority displays as "Urgent"

        // // Results column should show "--"
        // const firstResultsCell = screen.getAllByTestId('cell-results-0')[0];
        // expect(firstResultsCell).toHaveTextContent('--');

        // // Ordered by should be displayed
        // const firstOrderedByCell = screen.getAllByTestId('cell-orderedBy-0')[0];
        // expect(firstOrderedByCell).toHaveTextContent('Dr. Smith');
      });
    });
  });
});
