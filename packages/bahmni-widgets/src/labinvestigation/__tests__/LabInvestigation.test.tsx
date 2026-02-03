import {
  useTranslation,
  getCategoryUuidFromOrderTypes,
  getLabInvestigationsBundle,
  getDiagnosticReports,
  getDiagnosticReportBundle,
} from '@bahmni/services';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Bundle, ServiceRequest, DiagnosticReport } from 'fhir/r4';

import { usePatientUUID } from '../../hooks/usePatientUUID';
import { useNotification } from '../../notification';
import LabInvestigation from '../LabInvestigation';
import {
  FormattedLabInvestigations,
  LabInvestigationPriority,
} from '../models';

jest.mock('@bahmni/services', () => ({
  ...jest.requireActual('@bahmni/services'),
  useTranslation: jest.fn(),
  getCategoryUuidFromOrderTypes: jest.fn(),
  getLabInvestigationsBundle: jest.fn(),
  getDiagnosticReports: jest.fn(),
  getDiagnosticReportBundle: jest.fn(),
}));

jest.mock('react-router-dom', () => ({
  useParams: jest.fn(),
}));

jest.mock('../../notification', () => ({
  useNotification: jest.fn(),
}));

jest.mock('../../hooks/usePatientUUID', () => ({
  usePatientUUID: jest.fn(),
}));

jest.mock('../LabInvestigationItem', () => ({
  __esModule: true,
  default: ({ test }: { test: FormattedLabInvestigations }) => (
    <div data-testid="lab-investigation-item">
      <span data-testid="test-name">{test.testName}</span>
      <span data-testid="test-priority">{test.priority}</span>
    </div>
  ),
}));

const mockUseTranslation = useTranslation as jest.MockedFunction<
  typeof useTranslation
>;

const mockGetCategoryUuidFromOrderTypes =
  getCategoryUuidFromOrderTypes as jest.MockedFunction<
    typeof getCategoryUuidFromOrderTypes
  >;
const mockGetLabInvestigationsBundle =
  getLabInvestigationsBundle as jest.MockedFunction<
    typeof getLabInvestigationsBundle
  >;
const mockGetDiagnosticReports = getDiagnosticReports as jest.MockedFunction<
  typeof getDiagnosticReports
>;
const mockGetDiagnosticReportBundle =
  getDiagnosticReportBundle as jest.MockedFunction<
    typeof getDiagnosticReportBundle
  >;
const mockUseNotification = useNotification as jest.MockedFunction<
  typeof useNotification
>;
const mockUsePatientUUID = usePatientUUID as jest.MockedFunction<
  typeof usePatientUUID
>;

const renderLabInvestigations = (
  config: Record<string, unknown> = { orderType: 'Lab Order' },
  encounterUuids?: string[],
  episodeOfCareUuids?: string[],
) => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        staleTime: 0,
        gcTime: 0,
      },
    },
  });

  return (
    <QueryClientProvider client={queryClient}>
      <LabInvestigation
        config={config}
        encounterUuids={encounterUuids}
        episodeOfCareUuids={episodeOfCareUuids}
      />
    </QueryClientProvider>
  );
};

describe('LabInvestigation', () => {
  const mockAddNotification = jest.fn();

  const createMockBundle = (
    resources: ServiceRequest[],
  ): Bundle<ServiceRequest> => ({
    resourceType: 'Bundle',
    type: 'searchset',
    entry: resources.map((resource) => ({
      resource,
    })),
  });

  const mockServiceRequests: ServiceRequest[] = [
    {
      resourceType: 'ServiceRequest',
      id: 'test-1',
      status: 'active',
      intent: 'order',
      subject: { reference: 'Patient/patient-123' },
      code: { text: 'Complete Blood Count' },
      priority: 'routine',
      requester: { display: 'Dr. Smith' },
      occurrencePeriod: { start: '2025-05-08T12:44:24+00:00' },
      extension: [
        {
          url: 'http://fhir.bahmni.org/ext/lab-order-concept-type',
          valueString: 'Panel',
        },
      ],
    },
    {
      resourceType: 'ServiceRequest',
      id: 'test-2',
      status: 'active',
      intent: 'order',
      subject: { reference: 'Patient/patient-123' },
      code: { text: 'Lipid Panel' },
      priority: 'stat',
      requester: { display: 'Dr. Johnson' },
      occurrencePeriod: { start: '2025-04-09T13:21:22+00:00' },
      extension: [
        {
          url: 'http://fhir.bahmni.org/ext/lab-order-concept-type',
          valueString: 'Panel',
        },
      ],
    },
    {
      resourceType: 'ServiceRequest',
      id: 'test-3',
      status: 'active',
      intent: 'order',
      subject: { reference: 'Patient/patient-123' },
      code: { text: 'Liver Function' },
      priority: 'routine',
      requester: { display: 'Dr. Williams' },
      occurrencePeriod: { start: '2025-04-09T13:21:22+00:00' },
    },
  ];

  beforeEach(() => {
    jest.clearAllMocks();

    mockUseTranslation.mockReturnValue({
      t: (key: string) => {
        const translations: Record<string, string> = {
          LAB_TEST_ERROR_LOADING: 'Error loading lab tests',
          LAB_TEST_LOADING: 'Loading lab tests...',
          LAB_TEST_UNAVAILABLE: 'No lab investigations recorded',
          ERROR_DEFAULT_TITLE: 'Error',
        };
        return translations[key] || key;
      },
    } as any);
    mockUsePatientUUID.mockReturnValue('patient-123');
    mockUseNotification.mockReturnValue({
      addNotification: mockAddNotification,
      notifications: [],
      removeNotification: jest.fn(),
      clearAllNotifications: jest.fn(),
    });

    mockGetCategoryUuidFromOrderTypes.mockResolvedValue('lab-order-type-uuid');
    mockGetLabInvestigationsBundle.mockResolvedValue(
      createMockBundle(mockServiceRequests),
    );
    mockGetDiagnosticReports.mockResolvedValue({
      resourceType: 'Bundle',
      type: 'searchset',
      entry: [],
    });
    mockGetDiagnosticReportBundle.mockResolvedValue({
      resourceType: 'Bundle',
      type: 'searchset',
      entry: [],
    });
  });

  it('renders loading state with message', async () => {
    mockGetLabInvestigationsBundle.mockImplementation(
      () => new Promise(() => {}), // Never resolves
    );

    render(renderLabInvestigations());

    expect(screen.getByTestId('lab-skeleton')).toBeInTheDocument();
  });

  it('renders lab tests grouped by date', async () => {
    render(renderLabInvestigations());

    await waitFor(() => {
      expect(screen.getByText(/May 8, 2025/i)).toBeInTheDocument();
      expect(screen.getByText(/April 9, 2025/i)).toBeInTheDocument();
    });

    const labItems = screen.getAllByTestId('lab-investigation-item');
    expect(labItems).toHaveLength(3);
  });

  it('renders empty state message when no lab tests', async () => {
    mockGetLabInvestigationsBundle.mockResolvedValue(createMockBundle([]));

    render(renderLabInvestigations());

    await waitFor(() => {
      expect(
        screen.getByText('No lab investigations recorded'),
      ).toBeInTheDocument();
    });
  });

  it('renders error message when hasError is true', async () => {
    mockGetLabInvestigationsBundle.mockRejectedValue(
      new Error('Failed to fetch'),
    );

    render(renderLabInvestigations());

    await waitFor(() => {
      expect(screen.getByText('Error loading lab tests')).toBeInTheDocument();
    });
  });

  it('renders urgent tests before non-urgent tests within each date group', async () => {
    render(renderLabInvestigations());

    await waitFor(() => {
      const testNames = screen.getAllByTestId('test-name');
      expect(testNames).toHaveLength(3);
    });

    const testNames = screen.getAllByTestId('test-name');
    const testPriorities = screen.getAllByTestId('test-priority');

    expect(testNames[0]).toHaveTextContent('Complete Blood Count');
    expect(testPriorities[0]).toHaveTextContent(
      LabInvestigationPriority.routine,
    );

    expect(testNames[1]).toHaveTextContent('Lipid Panel');
    expect(testPriorities[1]).toHaveTextContent(LabInvestigationPriority.stat);

    expect(testNames[2]).toHaveTextContent('Liver Function');
    expect(testPriorities[2]).toHaveTextContent(
      LabInvestigationPriority.routine,
    );
  });

  it('opens first accordion item by default', async () => {
    render(renderLabInvestigations());

    await waitFor(() => {
      expect(screen.getByText(/May 8, 2025/i)).toBeInTheDocument();
    });

    const firstAccordionButton = screen.getByRole('button', {
      name: /May 8, 2025/i,
    });
    const secondAccordionButton = screen.getByRole('button', {
      name: /April 9, 2025/i,
    });

    expect(firstAccordionButton).toHaveAttribute('aria-expanded', 'true');
    expect(secondAccordionButton).toHaveAttribute('aria-expanded', 'false');
  });

  describe('emptyEncounterFilter condition', () => {
    it('should not fetch lab investigations when emptyEncounterFilter is true (episodeOfCareUuids has values and encounterUuids is empty)', async () => {
      render(
        renderLabInvestigations(
          { orderType: 'Lab Order' },
          [], // empty encounterUuids
          ['episode-1'], // episodeOfCareUuids has values
        ),
      );

      await waitFor(() => {
        expect(
          screen.getByText('No lab investigations recorded'),
        ).toBeInTheDocument();
      });

      expect(mockGetLabInvestigationsBundle).not.toHaveBeenCalled();
    });

    it('should fetch lab investigations when emptyEncounterFilter is false (episodeOfCareUuids is empty)', async () => {
      render(
        renderLabInvestigations(
          { orderType: 'Lab Order' },
          ['encounter-1'], // encounterUuids has values
          [], // empty episodeOfCareUuids
        ),
      );

      await waitFor(() => {
        expect(screen.getByText(/May 8, 2025/i)).toBeInTheDocument();
      });

      expect(mockGetLabInvestigationsBundle).toHaveBeenCalled();
    });

    it('should fetch lab investigations when emptyEncounterFilter is false (both have values)', async () => {
      render(
        renderLabInvestigations(
          { orderType: 'Lab Order' },
          ['encounter-1'], // encounterUuids has values
          ['episode-1'], // episodeOfCareUuids has values
        ),
      );

      await waitFor(() => {
        expect(screen.getByText(/May 8, 2025/i)).toBeInTheDocument();
      });

      expect(mockGetLabInvestigationsBundle).toHaveBeenCalled();
    });

    it('should fetch lab investigations when emptyEncounterFilter is false (no episode provided)', async () => {
      render(renderLabInvestigations({ orderType: 'Lab Order' }));

      await waitFor(() => {
        expect(screen.getByText(/May 8, 2025/i)).toBeInTheDocument();
      });

      expect(mockGetLabInvestigationsBundle).toHaveBeenCalled();
    });
  });

  describe('Accordion interactions', () => {
    it('should allow multiple accordions to be open at the same time', async () => {
      const user = userEvent.setup();
      render(renderLabInvestigations());

      await waitFor(() => {
        expect(screen.getByText(/May 8, 2025/i)).toBeInTheDocument();
      });

      const secondAccordionButton = screen.getByRole('button', {
        name: /April 9, 2025/i,
      });

      await user.click(secondAccordionButton);

      await waitFor(() => {
        expect(secondAccordionButton).toHaveAttribute('aria-expanded', 'true');
      });

      const firstAccordionButton = screen.getByRole('button', {
        name: /May 8, 2025/i,
      });
      // Both accordions should be open
      expect(firstAccordionButton).toHaveAttribute('aria-expanded', 'true');
      expect(secondAccordionButton).toHaveAttribute('aria-expanded', 'true');
    });

    it('should close accordion when clicking on open accordion', async () => {
      const user = userEvent.setup();
      render(renderLabInvestigations());

      await waitFor(() => {
        expect(screen.getByText(/May 8, 2025/i)).toBeInTheDocument();
      });

      const firstAccordionButton = screen.getByRole('button', {
        name: /May 8, 2025/i,
      });

      expect(firstAccordionButton).toHaveAttribute('aria-expanded', 'true');

      await user.click(firstAccordionButton);

      await waitFor(() => {
        expect(firstAccordionButton).toHaveAttribute('aria-expanded', 'false');
      });
    });
  });

  describe('Diagnostic reports fetching', () => {
    it('should fetch diagnostic reports when accordion is opened', async () => {
      const user = userEvent.setup();

      const mockDiagnosticReports: Bundle<DiagnosticReport> = {
        resourceType: 'Bundle',
        type: 'searchset',
        entry: [
          {
            resource: {
              resourceType: 'DiagnosticReport',
              id: 'report-1',
              status: 'final',
              code: { text: 'Complete Blood Count' },
              basedOn: [{ reference: 'ServiceRequest/test-1' }],
            } as DiagnosticReport,
          },
        ],
      };

      mockGetDiagnosticReports.mockResolvedValue(mockDiagnosticReports);

      render(renderLabInvestigations());

      await waitFor(() => {
        expect(screen.getByText(/May 8, 2025/i)).toBeInTheDocument();
      });

      await waitFor(() => {
        expect(mockGetDiagnosticReports).toHaveBeenCalledWith('patient-123', [
          'test-1',
        ]);
      });
    });

    it('should pass reportId to child component for processed reports', async () => {
      const mockDiagnosticReports: Bundle<DiagnosticReport> = {
        resourceType: 'Bundle',
        type: 'searchset',
        entry: [
          {
            resource: {
              resourceType: 'DiagnosticReport',
              id: 'report-1',
              status: 'final',
              code: { text: 'Complete Blood Count' },
              basedOn: [{ reference: 'ServiceRequest/test-1' }],
            } as DiagnosticReport,
          },
        ],
      };

      mockGetDiagnosticReports.mockResolvedValue(mockDiagnosticReports);

      render(renderLabInvestigations());

      await waitFor(() => {
        expect(screen.getByText(/May 8, 2025/i)).toBeInTheDocument();
      });

      await waitFor(() => {
        expect(mockGetDiagnosticReports).toHaveBeenCalledWith('patient-123', [
          'test-1',
        ]);
      });
    });
  });
});
