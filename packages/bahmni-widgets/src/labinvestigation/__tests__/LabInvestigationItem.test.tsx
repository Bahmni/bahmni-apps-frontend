import { useTranslation, getDiagnosticReportBundle } from '@bahmni/services';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, waitFor } from '@testing-library/react';
import { Bundle } from 'fhir/r4';

import LabInvestigationItem from '../LabInvestigationItem';
import {
  FormattedLabInvestigations,
  LabInvestigationPriority,
} from '../models';

jest.mock('@bahmni/services', () => ({
  ...jest.requireActual('@bahmni/services'),
  useTranslation: jest.fn(),
  getDiagnosticReportBundle: jest.fn(),
}));

jest.mock('react-router-dom', () => ({
  useParams: jest.fn(),
}));

const mockUseTranslation = useTranslation as jest.MockedFunction<
  typeof useTranslation
>;
const mockGetDiagnosticReportBundle =
  getDiagnosticReportBundle as jest.MockedFunction<
    typeof getDiagnosticReportBundle
  >;

describe('LabInvestigationItem', () => {
  const baseLabTest: FormattedLabInvestigations = {
    id: 'test-123',
    testName: 'Complete Blood Count',
    priority: LabInvestigationPriority.routine,
    orderedBy: 'Dr. Smith',
    orderedDate: '2025-05-08T12:44:24+00:00',
    formattedDate: '05/08/2025',
    result: undefined,
    testType: 'Individual',
  };

  const renderWithQueryClient = (component: React.ReactElement) => {
    const queryClient = new QueryClient({
      defaultOptions: {
        queries: {
          retry: false,
          staleTime: 0,
          gcTime: 0,
        },
      },
    });

    return render(
      <QueryClientProvider client={queryClient}>
        {component}
      </QueryClientProvider>,
    );
  };

  beforeEach(() => {
    jest.clearAllMocks();

    mockUseTranslation.mockReturnValue({
      t: ((key: string) => {
        const translations: Record<string, string> = {
          LAB_TEST_PANEL: 'Panel',
          LAB_TEST_STAT: 'STAT',
          LAB_TEST_URGENT: 'STAT',
          LAB_TEST_ORDERED_BY: 'Ordered by',
          LAB_TEST_RESULTS_PENDING: 'Results Pending',
          LAB_TEST_NAME: 'Test Name',
          LAB_TEST_RESULT: 'Result',
          LAB_TEST_REFERENCE_RANGE: 'Reference Range',
          LAB_TEST_REPORTED_ON: 'Reported On',
          LAB_TEST_ACTIONS: 'Actions',
          LAB_TEST_VIEW_ATTACHMENT: 'View Attachment',
          LAB_TEST_ERROR_LOADING: 'Error loading results',
        };
        return translations[key] || key;
      }) as any,
    } as any);
  });

  it('renders test name', () => {
    renderWithQueryClient(
      <LabInvestigationItem
        test={baseLabTest}
        isOpen={false}
        hasProcessedReport={false}
      />,
    );

    expect(screen.getByText('Complete Blood Count')).toBeInTheDocument();
  });

  it('renders ordered by information', () => {
    renderWithQueryClient(
      <LabInvestigationItem
        test={baseLabTest}
        isOpen={false}
        hasProcessedReport={false}
      />,
    );

    expect(screen.getByText('Ordered by: Dr. Smith')).toBeInTheDocument();
  });

  it('shows test type info only for Panel tests', () => {
    const panelTest = { ...baseLabTest, testType: 'Panel' };
    renderWithQueryClient(
      <LabInvestigationItem
        test={panelTest}
        isOpen={false}
        hasProcessedReport={false}
      />,
    );

    expect(screen.getByText('Panel')).toBeInTheDocument();
  });

  it('does not show test type info for non-Panel tests', () => {
    renderWithQueryClient(
      <LabInvestigationItem
        test={baseLabTest}
        isOpen={false}
        hasProcessedReport={false}
      />,
    );

    expect(screen.queryByText('Individual')).not.toBeInTheDocument();
  });

  it('shows priority tag for stat priority', () => {
    const statTest = {
      ...baseLabTest,
      priority: LabInvestigationPriority.stat,
    };
    renderWithQueryClient(
      <LabInvestigationItem
        test={statTest}
        isOpen={false}
        hasProcessedReport={false}
      />,
    );

    expect(screen.getByText('STAT')).toBeInTheDocument();
  });

  it('does not show priority tag for routine priority', () => {
    renderWithQueryClient(
      <LabInvestigationItem
        test={baseLabTest}
        isOpen={false}
        hasProcessedReport={false}
      />,
    );

    expect(screen.queryByText('STAT')).not.toBeInTheDocument();
    expect(
      screen.queryByTestId(
        `lab-test-priority-${LabInvestigationPriority.routine}`,
      ),
    ).not.toBeInTheDocument();
  });

  it('renders Panel test with stat priority correctly', () => {
    const panelStatTest = {
      ...baseLabTest,
      testType: 'Panel',
      priority: LabInvestigationPriority.stat,
    };
    renderWithQueryClient(
      <LabInvestigationItem
        test={panelStatTest}
        isOpen={false}
        hasProcessedReport={false}
      />,
    );

    expect(screen.getByText('Complete Blood Count')).toBeInTheDocument();
    expect(screen.getByText('Panel')).toBeInTheDocument();
    expect(screen.getByText('STAT')).toBeInTheDocument();
    expect(screen.getByText('Ordered by: Dr. Smith')).toBeInTheDocument();
  });

  it('renders note tooltip when note is present', () => {
    const testWithNote = {
      ...baseLabTest,
      note: 'Patient fasting required',
    };
    renderWithQueryClient(
      <LabInvestigationItem
        test={testWithNote}
        isOpen={false}
        hasProcessedReport={false}
      />,
    );

    const tooltipButton = screen.getByRole('button', {
      name: 'Show information',
    });
    expect(tooltipButton).toBeInTheDocument();
    expect(screen.getByText('Patient fasting required')).toBeInTheDocument();
  });

  it('does not render note tooltip when note is absent', () => {
    renderWithQueryClient(
      <LabInvestigationItem
        test={baseLabTest}
        isOpen={false}
        hasProcessedReport={false}
      />,
    );

    const tooltipButton = screen.queryByRole('button', {
      name: 'Show information',
    });
    expect(tooltipButton).not.toBeInTheDocument();
  });

  it('does not show results when accordion is closed', () => {
    renderWithQueryClient(
      <LabInvestigationItem
        test={baseLabTest}
        isOpen={false}
        hasProcessedReport={false}
      />,
    );

    expect(screen.queryByText('Results Pending ....')).not.toBeInTheDocument();
  });

  it('shows results pending when accordion is open but no processed report', () => {
    renderWithQueryClient(
      <LabInvestigationItem
        test={baseLabTest}
        isOpen
        hasProcessedReport={false}
      />,
    );

    expect(screen.getByText('Results Pending ....')).toBeInTheDocument();
  });

  it('shows loading skeleton then results when data is fetched', async () => {
    const mockBundle: Bundle = {
      resourceType: 'Bundle',
      type: 'collection',
      entry: [
        {
          resource: {
            resourceType: 'DiagnosticReport',
            id: 'report-1',
            status: 'final',
            code: { text: 'CBC' },
          },
        },
        {
          resource: {
            resourceType: 'Observation',
            id: 'obs-1',
            status: 'final',
            code: { text: 'Hemoglobin' },
            valueQuantity: { value: 14.5, unit: 'g/dL' },
          },
        },
      ],
    };

    mockGetDiagnosticReportBundle.mockResolvedValue(mockBundle);

    renderWithQueryClient(
      <LabInvestigationItem
        test={baseLabTest}
        isOpen
        hasProcessedReport
        reportId="report-1"
      />,
    );

    expect(screen.getByTestId('sortable-table-skeleton')).toBeInTheDocument();

    await waitFor(() => {
      expect(
        screen.queryByTestId('sortable-table-skeleton'),
      ).not.toBeInTheDocument();
      expect(screen.getByText('Hemoglobin')).toBeInTheDocument();
    });
  });
});
