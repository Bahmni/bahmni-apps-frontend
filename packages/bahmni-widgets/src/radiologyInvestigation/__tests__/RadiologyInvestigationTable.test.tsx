import {
  QueryClient,
  QueryClientProvider,
  useQuery,
} from '@tanstack/react-query';
import { render, screen, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { axe, toHaveNoViolations } from 'jest-axe';
import { useNotification } from '../../notification';
import {
  mockRadiologyInvestigations,
  mockCategoryUuid,
  mockRadiologyInvestigationWithAvailableImagingStudies,
} from '../__mocks__/mocks';
import RadiologyInvestigationTable from '../RadiologyInvestigationTable';

expect.extend(toHaveNoViolations);

jest.mock('../../notification');
jest.mock('../../hooks/usePatientUUID', () => ({
  usePatientUUID: jest.fn(() => 'test-patient-uuid'),
}));
jest.mock('@tanstack/react-query', () => ({
  ...jest.requireActual('@tanstack/react-query'),
  useQuery: jest.fn(),
}));
jest.mock('@bahmni/services', () => ({
  ...jest.requireActual('@bahmni/services'),
  getPatientRadiologyInvestigations: jest.fn(),
  dispatchAuditEvent: jest.fn(),
}));

const mockAddNotification = jest.fn();

describe('RadiologyInvestigationTable', () => {
  const queryClient: QueryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });

  beforeEach(() => {
    jest.clearAllMocks();
    (useNotification as jest.Mock).mockReturnValue({
      addNotification: mockAddNotification,
    });
  });

  afterEach(() => {
    queryClient.clear();
  });

  const wrapper = (
    <QueryClientProvider client={queryClient}>
      <RadiologyInvestigationTable />
    </QueryClientProvider>
  );

  it('should show loading state when data is loading', () => {
    (useQuery as jest.Mock).mockReturnValue({
      data: null,
      error: null,
      isError: false,
      isLoading: true,
    });
    render(wrapper);
    expect(
      screen.getByTestId('radiology-investigations-table-test-id'),
    ).toBeInTheDocument();
    expect(screen.getByTestId('sortable-table-skeleton')).toBeInTheDocument();
  });

  it('should show error state when an error occurs', () => {
    (useQuery as jest.Mock).mockReturnValue({
      data: null,
      error: new Error('An unexpected error occurred'),
      isError: true,
      isLoading: false,
    });
    render(wrapper);
    expect(
      screen.getByTestId('radiology-investigations-table-test-id'),
    ).toBeInTheDocument();
    expect(screen.getByTestId('sortable-table-error')).toBeInTheDocument();
    expect(mockAddNotification).toHaveBeenCalledWith({
      type: 'error',
      title: 'ERROR_DEFAULT_TITLE',
      message: 'An unexpected error occurred',
    });
  });

  it('should fetch categoryUuid and resolve when config has orderType', () => {
    (useQuery as jest.Mock)
      .mockReturnValueOnce({
        data: mockCategoryUuid,
        isLoading: false,
        isError: false,
        error: null,
      })
      .mockReturnValueOnce({
        data: [],
        isLoading: false,
        isError: false,
        error: null,
      });

    const wrapperWithConfig = (
      <QueryClientProvider client={queryClient}>
        <RadiologyInvestigationTable
          config={{ orderType: 'Radiology Order' }}
        />
      </QueryClientProvider>
    );

    render(wrapperWithConfig);

    expect(useQuery).toHaveBeenCalledWith(
      expect.objectContaining({
        queryKey: ['categoryUuid', 'Radiology Order'],
        enabled: true,
      }),
    );

    expect(useQuery).toHaveBeenCalledWith(
      expect.objectContaining({
        enabled: true,
      }),
    );
  });

  it('should not fetch radiology investigations when order type is not found', () => {
    (useQuery as jest.Mock)
      .mockReturnValueOnce({
        data: undefined,
        isLoading: false,
        isError: false,
        error: null,
      })
      .mockReturnValueOnce({
        data: null,
        isLoading: false,
        isError: false,
        error: null,
      });

    const wrapperWithConfig = (
      <QueryClientProvider client={queryClient}>
        <RadiologyInvestigationTable
          config={{ orderType: 'Non-existent Order Type' }}
        />
      </QueryClientProvider>
    );

    render(wrapperWithConfig);

    const radiologyQueryCalls = (useQuery as jest.Mock).mock.calls.filter(
      (call) => call[0]?.queryKey?.[0] === 'radiologyInvestigation',
    );
    const lastRadiologyCall =
      radiologyQueryCalls[radiologyQueryCalls.length - 1];

    expect(lastRadiologyCall[0].enabled).toBe(false);
  });

  it('should show error notification when order types query fails', () => {
    (useQuery as jest.Mock)
      .mockReturnValueOnce({
        data: null,
        isLoading: false,
        isError: true,
        error: new Error('Failed to fetch order types'),
      })
      .mockReturnValueOnce({
        data: null,
        isLoading: false,
        isError: false,
        error: null,
      });

    const wrapperWithConfig = (
      <QueryClientProvider client={queryClient}>
        <RadiologyInvestigationTable
          config={{ orderType: 'Radiology Order' }}
        />
      </QueryClientProvider>
    );

    render(wrapperWithConfig);

    expect(mockAddNotification).toHaveBeenCalledWith({
      type: 'error',
      title: 'ERROR_DEFAULT_TITLE',
      message: 'Failed to fetch order types',
    });
  });

  it('should show empty state when there is no data', () => {
    (useQuery as jest.Mock).mockReturnValue({
      data: [],
      error: null,
      isError: false,
      isLoading: false,
    });
    render(wrapper);
    expect(
      screen.getByTestId('radiology-investigations-table-test-id'),
    ).toBeInTheDocument();
    expect(screen.getByTestId('sortable-table-empty')).toBeInTheDocument();
  });

  it('should show radiology investigations table when patient has investigations', () => {
    (useQuery as jest.Mock).mockReturnValue({
      data: mockRadiologyInvestigations,
      error: null,
      isError: false,
      isLoading: false,
    });
    render(wrapper);
    expect(
      screen.getByTestId('radiology-investigations-table-test-id'),
    ).toBeInTheDocument();
    expect(screen.getByText('Chest X-Ray')).toBeInTheDocument();
    expect(screen.getByText('CT Scan')).toBeInTheDocument();
    expect(screen.getByText('RADIOLOGY_PRIORITY_URGENT')).toBeInTheDocument();
    expect(screen.getByText('Dr. Smith')).toBeInTheDocument();
    expect(screen.getByText('Dr. Johnson')).toBeInTheDocument();
  });

  it('should render pacs result link when imaging studies with available status exist and pacsViewerUrl is configured', async () => {
    const { dispatchAuditEvent } = jest.requireMock('@bahmni/services');

    (useQuery as jest.Mock)
      .mockReturnValueOnce({
        data: mockCategoryUuid,
        isLoading: false,
        isError: false,
        error: null,
      })
      .mockReturnValueOnce({
        data: mockRadiologyInvestigationWithAvailableImagingStudies,
        error: null,
        isError: false,
        isLoading: false,
      });

    const wrapperWithPacsUrl = (
      <QueryClientProvider client={queryClient}>
        <RadiologyInvestigationTable
          config={{
            orderType: 'Radiology Order',
            pacsViewerUrl:
              'http://pacs.example.com/viewer?study={{StudyInstanceUIDs}}',
          }}
        />
      </QueryClientProvider>
    );

    render(wrapperWithPacsUrl);

    const firstLink = screen.getByTestId(
      'investigation-1-result-link-0-test-id',
    );
    const secondLink = screen.getByTestId(
      'investigation-1-result-link-1-test-id',
    );

    expect(firstLink).toBeInTheDocument();
    expect(secondLink).toBeInTheDocument();

    await userEvent.click(firstLink);

    expect(dispatchAuditEvent).toHaveBeenCalledWith({
      eventType: 'VIEWED_RADIOLOGY_RESULTS',
      patientUuid: 'test-patient-uuid',
    });
  });

  describe('Accessibility', () => {
    it('passes accessibility tests with data', async () => {
      (useQuery as jest.Mock).mockReturnValue({
        data: mockRadiologyInvestigations,
        error: null,
        isError: false,
        isLoading: false,
      });
      const { container } = render(wrapper);
      await act(async () => {
        const results = await axe(container);
        expect(results).toHaveNoViolations();
      });
    });
  });
});
