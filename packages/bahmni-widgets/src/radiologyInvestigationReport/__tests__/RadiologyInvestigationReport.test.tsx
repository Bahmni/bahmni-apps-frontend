import { getDiagnosticReportBundle } from '@bahmni/services';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen } from '@testing-library/react';
import { Observation } from 'fhir/r4';
import { RadiologyInvestigationReport } from '../RadiologyInvestigationReport';

jest.mock('@bahmni/services', () => ({
  ...jest.requireActual('@bahmni/services'),
  getDiagnosticReportBundle: jest.fn(),
}));

describe('RadiologyInvestigationReport', () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });

  const renderWithQueryClient = (component: React.ReactElement) => {
    return render(
      <QueryClientProvider client={queryClient}>
        {component}
      </QueryClientProvider>,
    );
  };

  beforeEach(() => {
    jest.clearAllMocks();
    queryClient.clear();
  });

  describe('Loading and Error States', () => {
    it('should render loading state when data is being fetched', () => {
      (getDiagnosticReportBundle as jest.Mock).mockImplementation(
        () => new Promise(() => {}),
      );

      renderWithQueryClient(
        <RadiologyInvestigationReport reportId="report-1" />,
      );

      expect(
        screen.getByTestId('observations-table-skeleton'),
      ).toBeInTheDocument();
    });

    it('should render error state when API call fails', async () => {
      (getDiagnosticReportBundle as jest.Mock).mockRejectedValue(
        new Error('API Error'),
      );

      renderWithQueryClient(
        <RadiologyInvestigationReport reportId="report-1" />,
      );

      expect(await screen.findByText(/API Error/i)).toBeInTheDocument();
    });

    it('should render empty state when no observations exist', async () => {
      (getDiagnosticReportBundle as jest.Mock).mockResolvedValue({
        resourceType: 'Bundle',
        entry: [],
      });

      renderWithQueryClient(
        <RadiologyInvestigationReport reportId="report-1" />,
      );

      expect(await screen.findByText('NO_REPORT_DATA')).toBeInTheDocument();
    });
  });

  describe('Data Fetching and Passing to ObservationsRenderer', () => {
    it('should fetch diagnostic report bundle with correct reportId', async () => {
      const mockObservation: Observation = {
        resourceType: 'Observation',
        id: 'obs-1',
        status: 'final',
        code: { text: 'Test' },
        valueString: 'Result',
      };

      (getDiagnosticReportBundle as jest.Mock).mockResolvedValue({
        resourceType: 'Bundle',
        entry: [{ resource: mockObservation }],
      });

      renderWithQueryClient(
        <RadiologyInvestigationReport reportId="report-123" />,
      );

      await screen.findByTestId('observations-renderer-test-id');

      expect(getDiagnosticReportBundle).toHaveBeenCalledWith('report-123');
    });

    it('should pass observations to ObservationsRenderer', async () => {
      const mockObservation: Observation = {
        resourceType: 'Observation',
        id: 'obs-1',
        status: 'final',
        code: {
          text: 'Heart Rate',
        },
        valueQuantity: {
          value: 72,
          unit: 'bpm',
        },
      };

      (getDiagnosticReportBundle as jest.Mock).mockResolvedValue({
        resourceType: 'Bundle',
        entry: [{ resource: mockObservation }],
      });

      renderWithQueryClient(
        <RadiologyInvestigationReport reportId="report-1" />,
      );

      // Verify ObservationsRenderer is rendered with data
      expect(
        await screen.findByTestId('observations-renderer-test-id'),
      ).toBeInTheDocument();
      expect(
        screen.getByTestId('observation-item-Heart Rate-0'),
      ).toBeInTheDocument();
    });

    it('should filter and pass only Observation resources from bundle', async () => {
      const mockObservation: Observation = {
        resourceType: 'Observation',
        id: 'obs-1',
        status: 'final',
        code: { text: 'Temperature' },
        valueQuantity: { value: 37, unit: '°C' },
      };

      const mockDiagnosticReport = {
        resourceType: 'DiagnosticReport',
        id: 'report-1',
        status: 'final',
        code: { text: 'Report' },
      };

      (getDiagnosticReportBundle as jest.Mock).mockResolvedValue({
        resourceType: 'Bundle',
        entry: [
          { resource: mockDiagnosticReport },
          { resource: mockObservation },
        ],
      });

      renderWithQueryClient(
        <RadiologyInvestigationReport reportId="report-1" />,
      );

      await screen.findByTestId('observations-renderer-test-id');

      // Should only render the observation, not the diagnostic report
      expect(
        screen.getByTestId('observation-item-Temperature-0'),
      ).toBeInTheDocument();
      expect(screen.queryByText('Report')).not.toBeInTheDocument();
    });

    it('should handle multiple observations', async () => {
      const observation1: Observation = {
        resourceType: 'Observation',
        id: 'obs-1',
        status: 'final',
        code: {
          text: 'Test A',
          coding: [{ code: 'concept-A' }],
        },
        valueString: 'Result A',
      };

      const observation2: Observation = {
        resourceType: 'Observation',
        id: 'obs-2',
        status: 'final',
        code: {
          text: 'Test B',
          coding: [{ code: 'concept-B' }],
        },
        valueString: 'Result B',
      };

      (getDiagnosticReportBundle as jest.Mock).mockResolvedValue({
        resourceType: 'Bundle',
        entry: [{ resource: observation1 }, { resource: observation2 }],
      });

      renderWithQueryClient(
        <RadiologyInvestigationReport reportId="report-1" />,
      );

      await screen.findByTestId('observations-renderer-test-id');

      expect(
        screen.getByTestId('observation-item-Test A-0'),
      ).toBeInTheDocument();
      expect(
        screen.getByTestId('observation-item-Test B-1'),
      ).toBeInTheDocument();
    });
  });

  describe('Query Integration', () => {
    it('should use query key with reportId', async () => {
      const mockObservation: Observation = {
        resourceType: 'Observation',
        id: 'obs-1',
        status: 'final',
        code: { text: 'Test' },
        valueString: 'Result',
      };

      (getDiagnosticReportBundle as jest.Mock).mockResolvedValue({
        resourceType: 'Bundle',
        entry: [{ resource: mockObservation }],
      });

      renderWithQueryClient(
        <RadiologyInvestigationReport reportId="report-1" />,
      );

      await screen.findByTestId('observations-renderer-test-id');

      // The component should only call the API once with the correct report ID
      expect(getDiagnosticReportBundle).toHaveBeenCalledTimes(1);
      expect(getDiagnosticReportBundle).toHaveBeenCalledWith('report-1');
    });

    it('should not fetch when reportId is empty', () => {
      renderWithQueryClient(<RadiologyInvestigationReport reportId="" />);

      expect(getDiagnosticReportBundle).not.toHaveBeenCalled();
    });
  });
});
