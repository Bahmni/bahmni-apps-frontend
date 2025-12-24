import {
  FormattedLabTest,
  LabTestsByDate,
  LabTestPriority,
  groupLabTestsByDate,
  useTranslation,
  getOrderTypes,
  getPatientLabInvestigations,
} from '@bahmni/services';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, waitFor } from '@testing-library/react';
import { usePatientUUID } from '../../hooks/usePatientUUID';
import { useNotification } from '../../notification';
import LabInvestigation from '../LabInvestigation';

jest.mock('@bahmni/services', () => ({
  ...jest.requireActual('@bahmni/services'),
  groupLabTestsByDate: jest.fn(),
  useTranslation: jest.fn(),
  getOrderTypes: jest.fn(),
  getPatientLabInvestigations: jest.fn(),
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
  default: ({ test }: { test: FormattedLabTest }) => (
    <div data-testid="lab-investigation-item">
      <span data-testid="test-name">{test.testName}</span>
      <span data-testid="test-priority">{test.priority}</span>
    </div>
  ),
}));

const mockUseTranslation = useTranslation as jest.MockedFunction<
  typeof useTranslation
>;

const mockGetOrderTypes = getOrderTypes as jest.MockedFunction<
  typeof getOrderTypes
>;
const mockGetPatientLabInvestigations =
  getPatientLabInvestigations as jest.MockedFunction<
    typeof getPatientLabInvestigations
  >;
const mockUseNotification = useNotification as jest.MockedFunction<
  typeof useNotification
>;
const mockUsePatientUUID = usePatientUUID as jest.MockedFunction<
  typeof usePatientUUID
>;

const renderLabInvestigations = (
  config = { orderType: 'Lab Order' },
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

  // eslint-disable-next-line react/display-name
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

  const mockFormattedLabTests: FormattedLabTest[] = [
    {
      id: 'test-1',
      testName: 'Complete Blood Count',
      priority: LabTestPriority.routine,
      orderedBy: 'Dr. Smith',
      orderedDate: '2025-05-08T12:44:24+00:00',
      formattedDate: '05/08/2025',
      result: undefined,
      testType: 'Panel',
    },
    {
      id: 'test-2',
      testName: 'Lipid Panel',
      priority: LabTestPriority.stat,
      orderedBy: 'Dr. Johnson',
      orderedDate: '2025-04-09T13:21:22+00:00',
      formattedDate: '04/09/2025',
      result: undefined,
      testType: 'Panel',
    },
    {
      id: 'test-3',
      testName: 'Liver Function',
      priority: LabTestPriority.routine,
      orderedBy: 'Dr. Williams',
      orderedDate: '2025-04-09T13:21:22+00:00',
      formattedDate: '04/09/2025',
      result: undefined,
      testType: 'Individual',
    },
  ];

  const mockLabTestsByDate: LabTestsByDate[] = [
    {
      date: '05/08/2025',
      rawDate: '2025-05-08T12:44:24+00:00',
      tests: [mockFormattedLabTests[0]],
    },
    {
      date: '04/09/2025',
      rawDate: '2025-04-09T13:21:22+00:00',
      tests: [mockFormattedLabTests[1], mockFormattedLabTests[2]],
    },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    (groupLabTestsByDate as jest.Mock).mockReturnValue(mockLabTestsByDate);

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

    // Mock getOrderTypes to return order types data
    mockGetOrderTypes.mockResolvedValue({
      results: [
        {
          uuid: 'lab-order-type-uuid',
          display: 'Lab Order',
          conceptClasses: [],
        },
      ],
    } as any);
  });

  it('renders loading state with message', async () => {
    mockGetPatientLabInvestigations.mockImplementation(
      () => new Promise(() => {}), // Never resolves
    );

    render(renderLabInvestigations());

    expect(screen.getByText('Loading lab tests...')).toBeInTheDocument();
  });

  it('renders lab tests grouped by date', async () => {
    mockGetPatientLabInvestigations.mockResolvedValue(mockFormattedLabTests);

    render(renderLabInvestigations());

    await waitFor(() => {
      expect(groupLabTestsByDate).toHaveBeenCalledWith(mockFormattedLabTests);
    });

    expect(screen.getByText('05/08/2025')).toBeInTheDocument();
    expect(screen.getByText('04/09/2025')).toBeInTheDocument();

    const labItems = screen.getAllByTestId('lab-investigation-item');
    expect(labItems).toHaveLength(3);
  });

  it('renders empty state message when no lab tests', async () => {
    mockGetPatientLabInvestigations.mockResolvedValue([]);

    render(renderLabInvestigations());

    await waitFor(() => {
      expect(
        screen.getByText('No lab investigations recorded'),
      ).toBeInTheDocument();
    });
  });

  it('renders error message when hasError is true', async () => {
    mockGetPatientLabInvestigations.mockRejectedValue(
      new Error('Failed to fetch'),
    );

    render(renderLabInvestigations());

    await waitFor(() => {
      expect(screen.getByText('Error loading lab tests')).toBeInTheDocument();
    });
  });

  it('renders urgent tests before non-urgent tests within each date group', async () => {
    mockGetPatientLabInvestigations.mockResolvedValue(mockFormattedLabTests);

    render(renderLabInvestigations());

    await waitFor(() => {
      const testNames = screen.getAllByTestId('test-name');
      expect(testNames).toHaveLength(3);
    });

    const testNames = screen.getAllByTestId('test-name');
    const testPriorities = screen.getAllByTestId('test-priority');

    expect(testNames[0]).toHaveTextContent('Complete Blood Count');
    expect(testPriorities[0]).toHaveTextContent(LabTestPriority.routine);

    expect(testNames[1]).toHaveTextContent('Lipid Panel');
    expect(testPriorities[1]).toHaveTextContent(LabTestPriority.stat);

    expect(testNames[2]).toHaveTextContent('Liver Function');
    expect(testPriorities[2]).toHaveTextContent(LabTestPriority.routine);
  });

  it('opens first accordion item by default', async () => {
    mockGetPatientLabInvestigations.mockResolvedValue(mockFormattedLabTests);

    render(renderLabInvestigations());

    await waitFor(() => {
      expect(screen.getByText('05/08/2025')).toBeInTheDocument();
    });

    const firstAccordionButton = screen.getByRole('button', {
      name: /05\/08\/2025/,
    });
    const secondAccordionButton = screen.getByRole('button', {
      name: /04\/09\/2025/,
    });

    expect(firstAccordionButton).toHaveAttribute('aria-expanded', 'true');
    expect(secondAccordionButton).toHaveAttribute('aria-expanded', 'false');
  });

  describe('emptyEncounterFilter condition', () => {
    it('should not fetch lab investigations when emptyEncounterFilter is true (episodeOfCareUuids has values and encounterUuids is empty)', async () => {
      mockGetPatientLabInvestigations.mockResolvedValue(mockFormattedLabTests);

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

      // Verify that getPatientLabInvestigations was NOT called
      expect(mockGetPatientLabInvestigations).not.toHaveBeenCalled();
    });

    it('should fetch lab investigations when emptyEncounterFilter is false (episodeOfCareUuids is empty)', async () => {
      mockGetPatientLabInvestigations.mockResolvedValue(mockFormattedLabTests);

      render(
        renderLabInvestigations(
          { orderType: 'Lab Order' },
          ['encounter-1'], // encounterUuids has values
          [], // empty episodeOfCareUuids
        ),
      );

      await waitFor(() => {
        expect(screen.getByText('05/08/2025')).toBeInTheDocument();
      });

      // Verify that getPatientLabInvestigations WAS called
      expect(mockGetPatientLabInvestigations).toHaveBeenCalled();
    });

    it('should fetch lab investigations when emptyEncounterFilter is false (both have values)', async () => {
      mockGetPatientLabInvestigations.mockResolvedValue(mockFormattedLabTests);

      render(
        renderLabInvestigations(
          { orderType: 'Lab Order' },
          ['encounter-1'], // encounterUuids has values
          ['episode-1'], // episodeOfCareUuids has values
        ),
      );

      await waitFor(() => {
        expect(screen.getByText('05/08/2025')).toBeInTheDocument();
      });

      // Verify that getPatientLabInvestigations WAS called
      expect(mockGetPatientLabInvestigations).toHaveBeenCalled();
    });

    it('should fetch lab investigations when emptyEncounterFilter is false (no episode provided)', async () => {
      mockGetPatientLabInvestigations.mockResolvedValue(mockFormattedLabTests);

      render(renderLabInvestigations({ orderType: 'Lab Order' }));

      await waitFor(() => {
        expect(screen.getByText('05/08/2025')).toBeInTheDocument();
      });

      // Verify that getPatientLabInvestigations WAS called
      expect(mockGetPatientLabInvestigations).toHaveBeenCalled();
    });
  });
});
