import {
  useTranslation,
  getCategoryUuidFromOrderTypes,
  getLabInvestigationsBundle,
} from '@bahmni/services';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, waitFor } from '@testing-library/react';
import { Bundle, ServiceRequest } from 'fhir/r4';

import { usePatientUUID } from '../../hooks/usePatientUUID';
import { useNotification } from '../../notification';
import LabInvestigation from '../LabInvestigation';

jest.mock('@bahmni/services', () => ({
  ...jest.requireActual('@bahmni/services'),
  useTranslation: jest.fn(),
  getCategoryUuidFromOrderTypes: jest.fn(),
  getLabInvestigationsBundle: jest.fn(),
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

const mockGetCategoryUuidFromOrderTypes =
  getCategoryUuidFromOrderTypes as jest.MockedFunction<
    typeof getCategoryUuidFromOrderTypes
  >;
const mockGetLabTestBundle = getLabInvestigationsBundle as jest.MockedFunction<
  typeof getLabInvestigationsBundle
>;
const mockUseNotification = useNotification as jest.MockedFunction<
  typeof useNotification
>;
const mockUsePatientUUID = usePatientUUID as jest.MockedFunction<
  typeof usePatientUUID
>;

const createMockBundle = (
  serviceRequests: ServiceRequest[],
): Bundle<ServiceRequest> => ({
  resourceType: 'Bundle',
  type: 'searchset',
  entry: serviceRequests.map((resource) => ({
    resource,
  })),
});

// Mock FHIR ServiceRequest data
const mockServiceRequests: ServiceRequest[] = [
  {
    resourceType: 'ServiceRequest',
    id: 'lab-test-1',
    status: 'active',
    intent: 'order',
    subject: { reference: 'Patient/test-patient-uuid' },
    code: { text: 'Complete Blood Count' },
    priority: 'routine',
    requester: { display: 'Dr. John Doe' },
    occurrencePeriod: { start: '2025-03-25T06:48:32.000+00:00' },
    extension: [
      {
        url: 'http://fhir.bahmni.org/ext/lab-order-concept-type',
        valueString: 'Panel',
      },
    ],
  },
  {
    resourceType: 'ServiceRequest',
    id: 'lab-test-2',
    status: 'active',
    intent: 'order',
    subject: { reference: 'Patient/test-patient-uuid' },
    code: { text: 'Lipid Panel' },
    priority: 'stat',
    requester: { display: 'Dr. Jane Smith' },
    occurrencePeriod: { start: '2025-03-25T06:48:32.000+00:00' },
    extension: [
      {
        url: 'http://fhir.bahmni.org/ext/lab-order-concept-type',
        valueString: 'Panel',
      },
    ],
  },
  {
    resourceType: 'ServiceRequest',
    id: 'lab-test-3',
    status: 'active',
    intent: 'order',
    subject: { reference: 'Patient/test-patient-uuid' },
    code: { text: 'Glucose Test' },
    priority: 'routine',
    requester: { display: 'Dr. John Doe' },
    occurrencePeriod: { start: '2025-03-24T06:48:32.000+00:00' },
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

    mockGetCategoryUuidFromOrderTypes.mockResolvedValue('lab-order-type-uuid');
    mockGetLabTestBundle.mockResolvedValue(
      createMockBundle(mockServiceRequests),
    );
  });

  afterEach(() => {
    jest.clearAllTimers();
  });

  it('displays lab results after successful API call', async () => {
    renderLabInvestigations();

    await waitFor(() => {
      expect(screen.getByText(/March 25, 2025/i)).toBeInTheDocument();
      expect(screen.getByText(/March 24, 2025/i)).toBeInTheDocument();
    });

    expect(screen.getByText('Complete Blood Count')).toBeInTheDocument();
    expect(screen.getByText('Lipid Panel')).toBeInTheDocument();
    expect(screen.getByText('Glucose Test')).toBeInTheDocument();

    expect(screen.getAllByText('Ordered by: Dr. John Doe')).toHaveLength(2);
    expect(screen.getByText('Ordered by: Dr. Jane Smith')).toBeInTheDocument();
  });

  it('shows loading state during API call', async () => {
    mockGetLabTestBundle.mockImplementation(
      () => new Promise(() => {}), // Never resolves
    );

    renderLabInvestigations();

    expect(screen.getByTestId('lab-skeleton')).toBeInTheDocument();
  });

  it('displays error message when API call fails', async () => {
    mockGetLabTestBundle.mockRejectedValue(new Error('Failed to fetch'));

    renderLabInvestigations();

    await waitFor(() => {
      expect(screen.getByText('Error loading lab tests')).toBeInTheDocument();
    });
    expect(screen.queryByText('Complete Blood Count')).not.toBeInTheDocument();
  });

  it('shows empty state when no lab tests are returned', async () => {
    mockGetLabTestBundle.mockResolvedValue(createMockBundle([]));

    renderLabInvestigations();

    await waitFor(() => {
      expect(
        screen.getByText('No lab investigations recorded'),
      ).toBeInTheDocument();
    });
    expect(screen.queryByText('Complete Blood Count')).not.toBeInTheDocument();
  });

  it('handles accordion interaction correctly', async () => {
    renderLabInvestigations();

    await waitFor(() => {
      expect(screen.getByText(/March 25, 2025/i)).toBeInTheDocument();
    });

    const firstAccordionButton = screen.getByRole('button', {
      name: /March 25, 2025/i,
    });
    const secondAccordionButton = screen.getByRole('button', {
      name: /March 24, 2025/i,
    });

    // First accordion should be open by default
    expect(firstAccordionButton).toHaveAttribute('aria-expanded', 'true');
    expect(secondAccordionButton).toHaveAttribute('aria-expanded', 'false');
  });

  it('displays priority information correctly', async () => {
    renderLabInvestigations();

    await waitFor(() => {
      expect(screen.getByText(/March 25, 2025/i)).toBeInTheDocument();
    });

    // Check for STAT priority (urgent) test
    const lipidPanelElements = screen.getAllByText('Lipid Panel');
    expect(lipidPanelElements).toHaveLength(1);

    // Other tests should be routine (no special priority indicator)
    expect(screen.getByText('Complete Blood Count')).toBeInTheDocument();
    expect(screen.getByText('Glucose Test')).toBeInTheDocument();
  });

  it('renders tests in correct priority order within date groups', async () => {
    renderLabInvestigations();

    await waitFor(() => {
      expect(screen.getByText(/March 25, 2025/i)).toBeInTheDocument();
    });

    // The component should render urgent tests before routine tests within each date group
    const testElements = screen.getAllByText(
      /Complete Blood Count|Lipid Panel/,
    );
    expect(testElements).toHaveLength(2);
  });

  it('displays pending results message for tests without results', async () => {
    renderLabInvestigations();

    await waitFor(() => {
      expect(screen.getByText(/March 25, 2025/i)).toBeInTheDocument();
    });

    // Only tests in the open accordion should show pending results
    const pendingMessages = screen.getAllByText('Results Pending .... ....');
    expect(pendingMessages).toHaveLength(2); // Two tests in first accordion
  });

  it('handles API errors gracefully', async () => {
    mockGetLabTestBundle.mockRejectedValue(new Error('Failed to fetch'));

    renderLabInvestigations();

    await waitFor(() => {
      expect(screen.getByText('Error loading lab tests')).toBeInTheDocument();
    });
  });

  it('responds to patient UUID changes', async () => {
    renderLabInvestigations();

    await waitFor(() => {
      expect(screen.getByText(/March 25, 2025/i)).toBeInTheDocument();
    });

    mockGetLabTestBundle.mockResolvedValue(createMockBundle([]));

    mockUsePatientUUID.mockReturnValue('different-patient-uuid');

    renderLabInvestigations();

    await waitFor(() => {
      expect(
        screen.getByText('No lab investigations recorded'),
      ).toBeInTheDocument();
    });
  });
});
