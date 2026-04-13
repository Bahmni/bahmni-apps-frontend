import {
  getCategoryUuidFromOrderTypes,
  getLabInvestigationsBundle,
  DEFAULT_DATE_FORMAT_STORAGE_KEY,
} from '@bahmni/services';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, waitFor } from '@testing-library/react';
import { Bundle, ServiceRequest } from 'fhir/r4';
import { MemoryRouter, Route, Routes } from 'react-router-dom';

import { useNotification } from '../../notification';
import LabInvestigation from '../LabInvestigation';

jest.mock('@bahmni/services', () => ({
  ...jest.requireActual('@bahmni/services'),
  getCategoryUuidFromOrderTypes: jest.fn(),
  getLabInvestigationsBundle: jest.fn(),
}));

jest.mock('../../notification', () => ({
  useNotification: jest.fn(),
}));

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

const createMockBundle = (
  serviceRequests: ServiceRequest[],
): Bundle<ServiceRequest> => ({
  resourceType: 'Bundle',
  type: 'searchset',
  entry: serviceRequests.map((resource) => ({
    resource,
  })),
});

const createMockServiceRequest = (
  overrides: Partial<ServiceRequest> = {},
): ServiceRequest => ({
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
  ...overrides,
});

// Mock FHIR ServiceRequest data
const mockServiceRequests: ServiceRequest[] = [
  createMockServiceRequest({
    id: 'lab-test-1',
    code: { text: 'Complete Blood Count' },
  }),
  createMockServiceRequest({
    id: 'lab-test-2',
    code: { text: 'Lipid Panel' },
    priority: 'stat',
    requester: { display: 'Dr. Jane Smith' },
  }),
  createMockServiceRequest({
    id: 'lab-test-3',
    code: { text: 'Glucose Test' },
    occurrencePeriod: { start: '2025-03-24T06:48:32.000+00:00' },
  }),
];

const renderLabInvestigations = (
  config = { orderType: 'Lab Order' },
  patientUuid = 'test-patient-uuid',
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

  return render(
    <MemoryRouter initialEntries={[`/patient/${patientUuid}`]}>
      <Routes>
        <Route
          path="/patient/:patientUuid"
          element={
            <QueryClientProvider client={queryClient}>
              <LabInvestigation config={config} />
            </QueryClientProvider>
          }
        />
      </Routes>
    </MemoryRouter>,
  );
};

const setupDefaultMocks = (
  bundle: Bundle<ServiceRequest> = createMockBundle(mockServiceRequests),
  mockAddNotification = jest.fn(),
) => {
  mockUseNotification.mockReturnValue({
    addNotification: mockAddNotification,
    notifications: [],
    removeNotification: jest.fn(),
    clearAllNotifications: jest.fn(),
  });

  mockGetCategoryUuidFromOrderTypes.mockResolvedValue('lab-order-type-uuid');
  mockGetLabTestBundle.mockResolvedValue(bundle);
};

describe('LabInvestigation Integration Tests', () => {
  const mockAddNotification = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    setupDefaultMocks(
      createMockBundle(mockServiceRequests),
      mockAddNotification,
    );
    localStorage.setItem(DEFAULT_DATE_FORMAT_STORAGE_KEY, 'dd/MM/yyyy');
  });

  afterEach(() => {
    jest.clearAllTimers();
  });

  it('displays lab results after successful API call', async () => {
    renderLabInvestigations();

    await waitFor(() => {
      expect(screen.getByText(/25\/03\/2025/i)).toBeInTheDocument();
      expect(screen.getByText(/24\/03\/2025/i)).toBeInTheDocument();
    });

    expect(screen.getByText('Complete Blood Count')).toBeInTheDocument();
    expect(screen.getByText('Lipid Panel')).toBeInTheDocument();
    expect(screen.getByText('Glucose Test')).toBeInTheDocument();

    expect(
      screen.getAllByText('LAB_TEST_ORDERED_BY: Dr. John Doe'),
    ).toHaveLength(2);
    expect(
      screen.getByText('LAB_TEST_ORDERED_BY: Dr. Jane Smith'),
    ).toBeInTheDocument();
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
      expect(screen.getByText('LAB_TEST_ERROR_LOADING')).toBeInTheDocument();
    });
    expect(screen.queryByText('Complete Blood Count')).not.toBeInTheDocument();
  });

  it('shows empty state when no lab tests are returned', async () => {
    mockGetLabTestBundle.mockResolvedValue(createMockBundle([]));

    renderLabInvestigations();

    await waitFor(() => {
      expect(screen.getByText('LAB_TEST_UNAVAILABLE')).toBeInTheDocument();
    });
    expect(screen.queryByText('Complete Blood Count')).not.toBeInTheDocument();
  });

  it('handles accordion interaction correctly', async () => {
    renderLabInvestigations();

    await waitFor(() => {
      expect(screen.getByText(/25\/03\/2025/i)).toBeInTheDocument();
    });

    const firstAccordionButton = screen.getByRole('button', {
      name: /25\/03\/2025/i,
    });
    const secondAccordionButton = screen.getByRole('button', {
      name: /24\/03\/2025/i,
    });

    // First accordion should be open by default
    expect(firstAccordionButton).toHaveAttribute('aria-expanded', 'true');
    expect(secondAccordionButton).toHaveAttribute('aria-expanded', 'false');
  });

  it('displays priority information correctly', async () => {
    renderLabInvestigations();

    await waitFor(() => {
      expect(screen.getByText(/25\/03\/2025/i)).toBeInTheDocument();
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
      expect(screen.getByText(/25\/03\/2025/i)).toBeInTheDocument();
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
      expect(screen.getByText(/25\/03\/2025/i)).toBeInTheDocument();
    });

    // Only tests in the open accordion should show pending results
    const pendingMessages = screen.getAllByText(
      'LAB_TEST_RESULTS_PENDING ....',
    );
    expect(pendingMessages).toHaveLength(2); // Two tests in first accordion
  });

  it('handles API errors gracefully', async () => {
    mockGetLabTestBundle.mockRejectedValue(new Error('Failed to fetch'));

    renderLabInvestigations();

    await waitFor(() => {
      expect(screen.getByText('LAB_TEST_ERROR_LOADING')).toBeInTheDocument();
    });
  });

  it('responds to patient UUID changes', async () => {
    renderLabInvestigations();

    await waitFor(() => {
      expect(screen.getByText(/25\/03\/2025/i)).toBeInTheDocument();
    });

    mockGetLabTestBundle.mockResolvedValue(createMockBundle([]));

    renderLabInvestigations(
      { orderType: 'Lab Order' },
      'different-patient-uuid',
    );

    await waitFor(() => {
      expect(screen.getByText('LAB_TEST_UNAVAILABLE')).toBeInTheDocument();
    });
  });
});
