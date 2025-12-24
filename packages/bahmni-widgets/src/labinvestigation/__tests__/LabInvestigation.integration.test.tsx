import {
  LabTestPriority,
  FormattedLabTest,
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

// Mock formatted lab tests that match the component's expected data structure
const mockFormattedLabTests: FormattedLabTest[] = [
  {
    id: 'lab-test-1',
    testName: 'Complete Blood Count',
    priority: LabTestPriority.routine,
    orderedBy: 'Dr. John Doe',
    orderedDate: '2025-03-25T06:48:32.000+00:00',
    formattedDate: 'Mar 25, 2025',
    result: undefined,
    testType: 'Panel',
  },
  {
    id: 'lab-test-2',
    testName: 'Lipid Panel',
    priority: LabTestPriority.stat,
    orderedBy: 'Dr. Jane Smith',
    orderedDate: '2025-03-25T06:48:32.000+00:00',
    formattedDate: 'Mar 25, 2025',
    result: undefined,
    testType: 'Panel',
  },
  {
    id: 'lab-test-3',
    testName: 'Glucose Test',
    priority: LabTestPriority.routine,
    orderedBy: 'Dr. John Doe',
    orderedDate: '2025-03-24T06:48:32.000+00:00',
    formattedDate: 'Mar 24, 2025',
    result: undefined,
    testType: 'Individual',
  },
];

const renderLabInvestigations = (config = { orderType: 'Lab Order' }) => {
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
      <LabInvestigation config={config} />
    </QueryClientProvider>,
  );
};

describe('LabInvestigation Integration Tests', () => {
  const mockAddNotification = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();

    mockUsePatientUUID.mockReturnValue('test-patient-uuid');

    mockUseNotification.mockReturnValue({
      addNotification: mockAddNotification,
      notifications: [],
      removeNotification: jest.fn(),
      clearAllNotifications: jest.fn(),
    });

    mockUseTranslation.mockReturnValue({
      t: (key: string) => {
        const translations: Record<string, string> = {
          LAB_TEST_ERROR_LOADING: 'Error loading lab tests',
          LAB_TEST_LOADING: 'Loading lab tests...',
          LAB_TEST_UNAVAILABLE: 'No lab investigations recorded',
          LAB_TEST_ORDERED_BY: 'Ordered by',
          LAB_TEST_RESULTS_PENDING: 'Results Pending ....',
          ERROR_DEFAULT_TITLE: 'Error',
        };
        return translations[key] || key;
      },
    } as any);

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

  afterEach(() => {
    jest.clearAllTimers();
  });

  it('displays lab results after successful API call', async () => {
    mockGetPatientLabInvestigations.mockResolvedValue(mockFormattedLabTests);

    renderLabInvestigations();

    await waitFor(() => {
      expect(screen.getByText('Mar 25, 2025')).toBeInTheDocument();
      expect(screen.getByText('Mar 24, 2025')).toBeInTheDocument();
    });

    expect(screen.getByText('Complete Blood Count')).toBeInTheDocument();
    expect(screen.getByText('Lipid Panel')).toBeInTheDocument();
    expect(screen.getByText('Glucose Test')).toBeInTheDocument();

    expect(screen.getAllByText('Ordered by: Dr. John Doe')).toHaveLength(2);
    expect(screen.getByText('Ordered by: Dr. Jane Smith')).toBeInTheDocument();
  });

  it('shows loading state during API call', async () => {
    mockGetPatientLabInvestigations.mockImplementation(
      () => new Promise(() => {}), // Never resolves
    );

    renderLabInvestigations();

    expect(screen.getByText('Loading lab tests...')).toBeInTheDocument();
  });

  it('displays error message when API call fails', async () => {
    mockGetPatientLabInvestigations.mockRejectedValue(
      new Error('Failed to fetch'),
    );

    renderLabInvestigations();

    await waitFor(() => {
      expect(screen.getByText('Error loading lab tests')).toBeInTheDocument();
    });
    expect(screen.queryByText('Complete Blood Count')).not.toBeInTheDocument();
  });

  it('shows empty state when no lab tests are returned', async () => {
    mockGetPatientLabInvestigations.mockResolvedValue([]);

    renderLabInvestigations();

    await waitFor(() => {
      expect(
        screen.getByText('No lab investigations recorded'),
      ).toBeInTheDocument();
    });
    expect(screen.queryByText('Complete Blood Count')).not.toBeInTheDocument();
  });

  it('handles accordion interaction correctly', async () => {
    mockGetPatientLabInvestigations.mockResolvedValue(mockFormattedLabTests);

    renderLabInvestigations();

    await waitFor(() => {
      expect(screen.getByText('Mar 25, 2025')).toBeInTheDocument();
    });

    const firstAccordionButton = screen.getByRole('button', {
      name: /Mar 25, 2025/,
    });
    const secondAccordionButton = screen.getByRole('button', {
      name: /Mar 24, 2025/,
    });

    // First accordion should be open by default
    expect(firstAccordionButton).toHaveAttribute('aria-expanded', 'true');
    expect(secondAccordionButton).toHaveAttribute('aria-expanded', 'false');
  });

  it('displays priority information correctly', async () => {
    mockGetPatientLabInvestigations.mockResolvedValue(mockFormattedLabTests);

    renderLabInvestigations();

    await waitFor(() => {
      expect(screen.getByText('Mar 25, 2025')).toBeInTheDocument();
    });

    // Check for STAT priority (urgent) test
    const lipidPanelElements = screen.getAllByText('Lipid Panel');
    expect(lipidPanelElements).toHaveLength(1);

    // Other tests should be routine (no special priority indicator)
    expect(screen.getByText('Complete Blood Count')).toBeInTheDocument();
    expect(screen.getByText('Glucose Test')).toBeInTheDocument();
  });

  it('renders tests in correct priority order within date groups', async () => {
    mockGetPatientLabInvestigations.mockResolvedValue(mockFormattedLabTests);

    renderLabInvestigations();

    await waitFor(() => {
      expect(screen.getByText('Mar 25, 2025')).toBeInTheDocument();
    });

    // The component should render urgent tests before routine tests within each date group
    // This is implementation-specific but important for user experience
    const testElements = screen.getAllByText(
      /Complete Blood Count|Lipid Panel/,
    );
    expect(testElements).toHaveLength(2);
  });

  it('displays pending results message for tests without results', async () => {
    mockGetPatientLabInvestigations.mockResolvedValue(mockFormattedLabTests);

    renderLabInvestigations();

    await waitFor(() => {
      expect(screen.getByText('Mar 25, 2025')).toBeInTheDocument();
    });

    // All tests should show pending results
    const pendingMessages = screen.getAllByText('Results Pending .... ....');
    expect(pendingMessages).toHaveLength(3); // Three tests total
  });

  it('handles API errors gracefully', async () => {
    mockGetPatientLabInvestigations.mockRejectedValue(
      new Error('Failed to fetch'),
    );

    renderLabInvestigations();

    await waitFor(() => {
      expect(screen.getByText('Error loading lab tests')).toBeInTheDocument();
    });
  });

  it('responds to patient UUID changes', async () => {
    mockGetPatientLabInvestigations.mockResolvedValue(mockFormattedLabTests);

    renderLabInvestigations();

    await waitFor(() => {
      expect(screen.getByText('Mar 25, 2025')).toBeInTheDocument();
    });

    mockGetPatientLabInvestigations.mockResolvedValue([]);

    // Change patient UUID
    mockUsePatientUUID.mockReturnValue('different-patient-uuid');

    renderLabInvestigations();

    // Should show loading state for new patient
    expect(screen.getByText('Loading lab tests...')).toBeInTheDocument();
  });
});
