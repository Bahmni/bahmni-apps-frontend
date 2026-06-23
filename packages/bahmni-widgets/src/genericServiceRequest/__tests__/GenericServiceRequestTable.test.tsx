import {
  groupByDate,
  getFormattedError,
  getCategoryUuidFromOrderTypes,
  getServiceRequests,
  getTasks,
  useSubscribeConsultationSaved,
  formatDateTime,
} from '@bahmni/services';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, waitFor } from '@testing-library/react';
import { axe, toHaveNoViolations } from 'jest-axe';
import { usePatientUUID } from '../../hooks/usePatientUUID';
import { useNotification } from '../../notification';
import {
  mockTasksBundle,
  emptyTasksBundle,
} from '../../tasks/__tests__/__mocks__/taskListMocks';
import GenericServiceRequestTable from '../GenericServiceRequestTable';
import { ServiceRequestViewModel } from '../models';
import {
  filterServiceRequestReplacementEntries,
  mapServiceRequest,
  sortServiceRequestsByPriority,
} from '../utils';
import {
  mockServiceRequestBundle,
  mockServiceRequests,
} from './__mocks__/serviceRequestMocks';

expect.extend(toHaveNoViolations);

jest.mock('@bahmni/services', () => ({
  ...jest.requireActual('@bahmni/services'),
  groupByDate: jest.fn(),
  formatDateTime: jest.fn(() => ({
    formattedResult: '01/12/2023',
    isValid: true,
  })),
  getFormattedError: jest.fn(),
  getCategoryUuidFromOrderTypes: jest.fn(),
  getServiceRequests: jest.fn(),
  getTasks: jest.fn(),
  useSubscribeConsultationSaved: jest.fn(),
}));

jest.mock('../utils', () => ({
  filterServiceRequestReplacementEntries: jest.fn(),
  getStatusDotClassName: jest.fn().mockReturnValue(''),
  mapServiceRequest: jest.fn(),
  sortServiceRequestsByPriority: jest.fn(),
}));

jest.mock('../../hooks/usePatientUUID', () => ({
  usePatientUUID: jest.fn(),
}));

jest.mock('../../notification', () => ({
  useNotification: jest.fn(),
}));

const mockGroupByDate = groupByDate as jest.MockedFunction<typeof groupByDate>;
const mockFormatDate = formatDateTime as jest.MockedFunction<
  typeof formatDateTime
>;
const mockGetFormattedError = getFormattedError as jest.MockedFunction<
  typeof getFormattedError
>;
const mockGetCategoryUuidFromOrderTypes =
  getCategoryUuidFromOrderTypes as jest.MockedFunction<
    typeof getCategoryUuidFromOrderTypes
  >;
const mockGetServiceRequests = getServiceRequests as jest.MockedFunction<
  typeof getServiceRequests
>;
const mockGetTasks = getTasks as jest.MockedFunction<typeof getTasks>;
const mockFilterServiceRequestReplacementEntries =
  filterServiceRequestReplacementEntries as jest.MockedFunction<
    typeof filterServiceRequestReplacementEntries
  >;
const mockMapServiceRequest = mapServiceRequest as jest.MockedFunction<
  typeof mapServiceRequest
>;
const mockSortServiceRequestsByPriority =
  sortServiceRequestsByPriority as jest.MockedFunction<
    typeof sortServiceRequestsByPriority
  >;
const mockUsePatientUUID = usePatientUUID as jest.MockedFunction<
  typeof usePatientUUID
>;
const mockUseNotification = useNotification as jest.MockedFunction<
  typeof useNotification
>;
const mockUseSubscribeConsultationSaved =
  useSubscribeConsultationSaved as jest.MockedFunction<
    typeof useSubscribeConsultationSaved
  >;

const createWrapper = () => {
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
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
};

describe('GenericServiceRequestTable', () => {
  const mockAddNotification = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();

    mockUsePatientUUID.mockReturnValue('patient-123');
    mockUseNotification.mockReturnValue({
      addNotification: mockAddNotification,
      notifications: [],
      removeNotification: jest.fn(),
      clearAllNotifications: jest.fn(),
    });

    mockFormatDate.mockReturnValue({ formattedResult: '01/12/2023' });
    mockGetFormattedError.mockReturnValue({
      message: 'Network error',
      title: '',
    });
    mockFilterServiceRequestReplacementEntries.mockImplementation(
      (data) => data,
    );
    mockSortServiceRequestsByPriority.mockImplementation((data) => data);
    mockGroupByDate.mockReturnValue([]);
    mockGetCategoryUuidFromOrderTypes.mockResolvedValue('lab-uuid');
    mockGetServiceRequests.mockResolvedValue(mockServiceRequestBundle);
    mockMapServiceRequest.mockImplementation(
      (bundle) =>
        bundle.entry?.map((entry) => {
          const resource = entry.resource as any;
          return {
            id: resource.id,
            testName: resource.code?.text ?? '',
            priority: resource.priority,
            orderedBy: resource.requester?.display ?? '',
            orderedDate: resource.occurrencePeriod?.start ?? '',
            status: resource.status,
          };
        }) ?? [],
    );
    mockGetTasks.mockResolvedValue(emptyTasksBundle);
    mockUseSubscribeConsultationSaved.mockImplementation(() => {});
  });

  describe('Loading state', () => {
    it('renders loading state while fetching order types', async () => {
      mockGetCategoryUuidFromOrderTypes.mockImplementation(
        () => new Promise(() => {}), // Never resolves
      );

      render(
        <GenericServiceRequestTable config={{ orderType: 'Lab Order' }} />,
        {
          wrapper: createWrapper(),
        },
      );

      expect(
        screen.getByTestId('generic-service-request-table-skeleton'),
      ).toBeInTheDocument();
    });

    it('renders loading state while fetching service requests', async () => {
      mockGetServiceRequests.mockImplementation(
        () => new Promise(() => {}), // Never resolves
      );

      render(
        <GenericServiceRequestTable config={{ orderType: 'Lab Order' }} />,
        {
          wrapper: createWrapper(),
        },
      );

      await waitFor(() => {
        expect(
          screen.getByTestId('generic-service-request-table-skeleton'),
        ).toBeInTheDocument();
      });
    });
  });

  describe('Error handling', () => {
    it('renders error state when order types fetch fails', async () => {
      mockGetCategoryUuidFromOrderTypes.mockRejectedValue(
        new Error('Order types error'),
      );

      render(
        <GenericServiceRequestTable config={{ orderType: 'Lab Order' }} />,
        {
          wrapper: createWrapper(),
        },
      );

      await waitFor(() => {
        expect(mockAddNotification).toHaveBeenCalledWith({
          title: 'ERROR_DEFAULT_TITLE',
          message: 'Network error',
          type: 'error',
        });
      });
    });

    it('renders error state when service requests fetch fails', async () => {
      mockGetServiceRequests.mockRejectedValue(
        new Error('Service requests error'),
      );

      render(
        <GenericServiceRequestTable config={{ orderType: 'Lab Order' }} />,
        {
          wrapper: createWrapper(),
        },
      );

      await waitFor(() => {
        expect(mockAddNotification).toHaveBeenCalledWith({
          title: 'ERROR_DEFAULT_TITLE',
          message: 'Network error',
          type: 'error',
        });
      });
    });

    it('displays error message in table when there is an error', async () => {
      mockGetCategoryUuidFromOrderTypes.mockRejectedValue(
        new Error('Network error'),
      );

      render(
        <GenericServiceRequestTable config={{ orderType: 'Lab Order' }} />,
        {
          wrapper: createWrapper(),
        },
      );

      await waitFor(() => {
        expect(screen.getByText('Network error')).toBeInTheDocument();
      });
    });
  });

  describe('Empty state', () => {
    it('renders empty state when no service requests', async () => {
      mockMapServiceRequest.mockReturnValue([]);

      render(
        <GenericServiceRequestTable config={{ orderType: 'Lab Order' }} />,
        {
          wrapper: createWrapper(),
        },
      );

      await waitFor(() => {
        expect(screen.getByText('NO_SERVICE_REQUESTS')).toBeInTheDocument();
      });
    });

    it('renders empty state when orderType not found in order types', async () => {
      render(
        <GenericServiceRequestTable
          config={{ orderType: 'Unknown OrderType' }}
        />,
        {
          wrapper: createWrapper(),
        },
      );

      await waitFor(() => {
        expect(screen.getByText('NO_SERVICE_REQUESTS')).toBeInTheDocument();
      });
    });
  });

  describe('Data processing pipeline', () => {
    beforeEach(() => {
      mockGroupByDate.mockImplementation((items, dateExtractor) => {
        const groups: { [key: string]: typeof items } = {};

        items.forEach((item: any) => {
          const date = dateExtractor(item);
          if (!groups[date]) {
            groups[date] = [];
          }
          groups[date].push(item);
        });

        return Object.entries(groups).map(([date, groupedItems]) => ({
          date,
          items: groupedItems,
        }));
      });
    });

    it('filters replacement entries before grouping', async () => {
      const filteredRequests = [mockServiceRequests[0], mockServiceRequests[2]];
      mockFilterServiceRequestReplacementEntries.mockReturnValue(
        filteredRequests,
      );

      render(
        <GenericServiceRequestTable config={{ orderType: 'Lab Order' }} />,
        {
          wrapper: createWrapper(),
        },
      );

      await waitFor(() => {
        expect(mockFilterServiceRequestReplacementEntries).toHaveBeenCalledWith(
          mockServiceRequests,
        );
        expect(mockGroupByDate).toHaveBeenCalledWith(
          filteredRequests,
          expect.any(Function),
        );
      });
    });

    it('processes data through transformation pipeline', async () => {
      render(
        <GenericServiceRequestTable config={{ orderType: 'Lab Order' }} />,
        {
          wrapper: createWrapper(),
        },
      );

      await waitFor(() => {
        expect(mockMapServiceRequest).toHaveBeenCalledWith(
          mockServiceRequestBundle,
        );
        expect(mockGroupByDate).toHaveBeenCalledWith(
          mockServiceRequests,
          expect.any(Function),
        );
        expect(mockSortServiceRequestsByPriority).toHaveBeenCalled();
      });
    });

    it('groups service requests by date', async () => {
      render(
        <GenericServiceRequestTable config={{ orderType: 'Lab Order' }} />,
        {
          wrapper: createWrapper(),
        },
      );

      await waitFor(() => {
        expect(mockGroupByDate).toHaveBeenCalledWith(
          mockServiceRequests,
          expect.any(Function),
        );

        expect(mockFormatDate).toHaveBeenCalledWith(
          mockServiceRequests[0].orderedDate,
          expect.any(Function),
        );
      });
    });

    it('sorts date groups in descending order (latest first)', async () => {
      mockGroupByDate.mockReturnValue([
        { date: '2023-11-30', items: [mockServiceRequests[2]] },
        {
          date: '2023-12-01',
          items: [mockServiceRequests[0], mockServiceRequests[1]],
        },
      ]);

      render(
        <GenericServiceRequestTable config={{ orderType: 'Lab Order' }} />,
        {
          wrapper: createWrapper(),
        },
      );

      await waitFor(() => {
        const accordionItems = screen.getAllByTestId('accordian-table-title');
        expect(accordionItems).toHaveLength(2);
      });
    });

    it('formats dates for accordion titles', async () => {
      render(
        <GenericServiceRequestTable config={{ orderType: 'Lab Order' }} />,
        {
          wrapper: createWrapper(),
        },
      );

      await waitFor(() => {
        expect(mockFormatDate).toHaveBeenCalledWith(
          mockServiceRequests[0].orderedDate,
          expect.any(Function),
        );
      });
    });
  });

  describe('OrderType UUID resolution', () => {
    it('finds orderType UUID by case-insensitive name matching', async () => {
      render(
        <GenericServiceRequestTable config={{ orderType: 'lab order' }} />,
        {
          wrapper: createWrapper(),
        },
      );

      await waitFor(() => {
        expect(mockGetServiceRequests).toHaveBeenCalledWith(
          'lab-uuid',
          'patient-123',
          undefined,
        );
      });
    });

    it('handles orderType name with different casing', async () => {
      mockGetCategoryUuidFromOrderTypes.mockResolvedValue('radiology-uuid');

      render(
        <GenericServiceRequestTable
          config={{ orderType: 'RADIOLOGY ORDER' }}
        />,
        {
          wrapper: createWrapper(),
        },
      );

      await waitFor(() => {
        expect(mockGetServiceRequests).toHaveBeenCalledWith(
          'radiology-uuid',
          'patient-123',
          undefined,
        );
      });
    });
  });

  describe('Accordion rendering', () => {
    beforeEach(() => {
      mockGroupByDate.mockReturnValue([
        {
          date: '2023-12-01',
          items: [mockServiceRequests[0], mockServiceRequests[1]],
        },
        { date: '2023-11-30', items: [mockServiceRequests[2]] },
      ]);
    });

    it('renders accordion with grouped data', async () => {
      render(
        <GenericServiceRequestTable config={{ orderType: 'Lab Order' }} />,
        {
          wrapper: createWrapper(),
        },
      );

      await waitFor(() => {
        expect(screen.getAllByTestId('accordian-table-title')).toHaveLength(2);
        // Each accordion item has a unique table with date suffix
        const tables = document.querySelectorAll(
          '[data-testid^="generic-service-request-table-"]',
        );
        expect(tables).toHaveLength(2);
      });
    });

    it('opens first accordion item by default', async () => {
      render(
        <GenericServiceRequestTable config={{ orderType: 'Lab Order' }} />,
        {
          wrapper: createWrapper(),
        },
      );

      await waitFor(() => {
        const accordionButton = screen.getAllByRole('button')[0];
        expect(accordionButton).toHaveAttribute('aria-expanded', 'true');
      });
    });
  });

  describe('renderCell function', () => {
    const testServiceRequest: ServiceRequestViewModel = {
      id: 'test-1',
      testName: 'Test Service Request',
      priority: 'stat',
      orderedBy: 'Dr. Test',
      orderedDate: '2023-12-01T10:30:00.000Z',
      status: 'active',
    };

    beforeEach(() => {
      mockGroupByDate.mockReturnValue([
        { date: '2023-12-01', items: [testServiceRequest] },
      ]);
    });

    it('renders testName cell with service request name', async () => {
      render(
        <GenericServiceRequestTable config={{ orderType: 'Lab Order' }} />,
        {
          wrapper: createWrapper(),
        },
      );

      await waitFor(() => {
        expect(screen.getByText('Test Service Request')).toBeInTheDocument();
      });
    });

    it('renders testName cell with urgent tag for stat priority', async () => {
      render(
        <GenericServiceRequestTable config={{ orderType: 'Lab Order' }} />,
        {
          wrapper: createWrapper(),
        },
      );

      await waitFor(() => {
        expect(
          screen.getByText('SERVICE_REQUEST_PRIORITY_URGENT'),
        ).toBeInTheDocument();
      });
    });

    it('renders testName cell without tag for routine priority', async () => {
      const routineServiceRequest = {
        ...testServiceRequest,
        priority: 'routine',
      };

      mockGroupByDate.mockReturnValue([
        { date: '2023-12-01', items: [routineServiceRequest] },
      ]);

      render(
        <GenericServiceRequestTable config={{ orderType: 'Lab Order' }} />,
        {
          wrapper: createWrapper(),
        },
      );

      await waitFor(() => {
        expect(screen.getByText('Test Service Request')).toBeInTheDocument();
        expect(screen.queryByText('Urgent')).not.toBeInTheDocument();
      });
    });

    it('renders testName cell without tag for empty priority', async () => {
      const emptyPriorityServiceRequest = {
        ...testServiceRequest,
        priority: '',
      };

      mockGroupByDate.mockReturnValue([
        { date: '2023-12-01', items: [emptyPriorityServiceRequest] },
      ]);

      render(
        <GenericServiceRequestTable config={{ orderType: 'Lab Order' }} />,
        {
          wrapper: createWrapper(),
        },
      );

      await waitFor(() => {
        expect(screen.queryByText('Urgent')).not.toBeInTheDocument();
      });
    });

    it('renders testName cell with note tooltip when note is provided', async () => {
      const serviceRequestWithNote = {
        ...testServiceRequest,
        note: 'This is a test note for the service request',
      };

      mockGroupByDate.mockReturnValue([
        { date: '2023-12-01', items: [serviceRequestWithNote] },
      ]);

      render(
        <GenericServiceRequestTable config={{ orderType: 'Lab Order' }} />,
        {
          wrapper: createWrapper(),
        },
      );

      await waitFor(() => {
        expect(screen.getByText('Test Service Request')).toBeInTheDocument();
        const tooltipIcon = screen.getByLabelText(
          'This is a test note for the service request',
        );
        expect(tooltipIcon).toBeInTheDocument();
      });
    });

    it('renders testName cell without note tooltip when note is not provided', async () => {
      render(
        <GenericServiceRequestTable config={{ orderType: 'Lab Order' }} />,
        {
          wrapper: createWrapper(),
        },
      );

      await waitFor(() => {
        expect(screen.getByText('Test Service Request')).toBeInTheDocument();
        // Verify no tooltip icon is present by checking there's no element with aria-label matching the note pattern
        const tooltipIcons = screen.queryAllByRole('button', {
          name: /show information/i,
        });
        expect(tooltipIcons).toHaveLength(0);
      });
    });

    it('renders orderedBy cell with practitioner name', async () => {
      render(
        <GenericServiceRequestTable config={{ orderType: 'Lab Order' }} />,
        {
          wrapper: createWrapper(),
        },
      );

      await waitFor(() => {
        expect(screen.getByText('Dr. Test')).toBeInTheDocument();
      });
    });

    it('renders orderedBy cell with empty string when not provided', async () => {
      const noOrderedByServiceRequest = {
        ...testServiceRequest,
        orderedBy: '',
      };

      mockGroupByDate.mockReturnValue([
        { date: '2023-12-01', items: [noOrderedByServiceRequest] },
      ]);

      render(
        <GenericServiceRequestTable config={{ orderType: 'Lab Order' }} />,
        {
          wrapper: createWrapper(),
        },
      );

      await waitFor(() => {
        expect(screen.queryByText('Dr. Test')).not.toBeInTheDocument();
      });
    });

    it('renders status cell with "In Progress" tag for active status', async () => {
      render(
        <GenericServiceRequestTable config={{ orderType: 'Lab Order' }} />,
        {
          wrapper: createWrapper(),
        },
      );

      await waitFor(() => {
        expect(screen.getByText('IN_PROGRESS_STATUS')).toBeInTheDocument();
      });
    });

    it('renders status cell with "Completed" tag for completed status', async () => {
      const completedServiceRequest = {
        ...testServiceRequest,
        status: 'completed',
      };

      mockGroupByDate.mockReturnValue([
        { date: '2023-12-01', items: [completedServiceRequest] },
      ]);

      render(
        <GenericServiceRequestTable config={{ orderType: 'Lab Order' }} />,
        {
          wrapper: createWrapper(),
        },
      );

      await waitFor(() => {
        expect(screen.getByText('COMPLETED_STATUS')).toBeInTheDocument();
      });
    });

    it('renders status cell with "Revoked" tag for revoked status', async () => {
      const revokedServiceRequest = {
        ...testServiceRequest,
        status: 'revoked',
      };

      mockGroupByDate.mockReturnValue([
        { date: '2023-12-01', items: [revokedServiceRequest] },
      ]);

      render(
        <GenericServiceRequestTable config={{ orderType: 'Lab Order' }} />,
        {
          wrapper: createWrapper(),
        },
      );

      await waitFor(() => {
        expect(screen.getByText('REVOKED_STATUS')).toBeInTheDocument();
      });
    });

    it('renders status cell with "UNKNOWN_STATUS" tag for unknown status', async () => {
      const unknownServiceRequest = {
        ...testServiceRequest,
        status: 'unknown',
      };

      mockGroupByDate.mockReturnValue([
        { date: '2023-12-01', items: [unknownServiceRequest] },
      ]);

      render(
        <GenericServiceRequestTable config={{ orderType: 'Lab Order' }} />,
        {
          wrapper: createWrapper(),
        },
      );

      await waitFor(() => {
        expect(screen.getByText('UNKNOWN_STATUS')).toBeInTheDocument();
      });
    });
  });

  describe('Edge cases', () => {
    it('handles single date group', async () => {
      const singleDateServiceRequests = [mockServiceRequests[0]];
      mockMapServiceRequest.mockReturnValue(singleDateServiceRequests);
      mockGroupByDate.mockReturnValue([
        { date: '2023-12-01', items: singleDateServiceRequests },
      ]);

      render(
        <GenericServiceRequestTable config={{ orderType: 'Lab Order' }} />,
        {
          wrapper: createWrapper(),
        },
      );

      await waitFor(() => {
        expect(screen.getAllByTestId('accordian-table-title')).toHaveLength(1);
      });
    });

    it('handles mixed priority values correctly', async () => {
      const mixedPriorityServiceRequests: ServiceRequestViewModel[] = [
        {
          id: 'service-1',
          testName: 'Stat Test',
          priority: 'stat',
          orderedBy: 'Dr. Stat',
          orderedDate: '2023-12-01T10:30:00.000Z',
          status: 'active',
        },
        {
          id: 'service-2',
          testName: 'Routine Test',
          priority: 'routine',
          orderedBy: 'Dr. Routine',
          orderedDate: '2023-12-01T10:30:00.000Z',
          status: 'active',
        },
        {
          id: 'service-3',
          testName: 'Empty Priority Test',
          priority: '',
          orderedBy: 'Dr. Empty',
          orderedDate: '2023-12-01T10:30:00.000Z',
          status: 'active',
        },
      ];

      mockMapServiceRequest.mockReturnValue(mixedPriorityServiceRequests);
      mockGroupByDate.mockReturnValue([
        { date: '2023-12-01', items: mixedPriorityServiceRequests },
      ]);

      render(
        <GenericServiceRequestTable config={{ orderType: 'Lab Order' }} />,
        {
          wrapper: createWrapper(),
        },
      );

      await waitFor(() => {
        expect(screen.getByText('Stat Test')).toBeInTheDocument();
        expect(screen.getByText('Routine Test')).toBeInTheDocument();
        expect(screen.getByText('Empty Priority Test')).toBeInTheDocument();
        expect(
          screen.getAllByText('SERVICE_REQUEST_PRIORITY_URGENT'),
        ).toHaveLength(1);
      });
    });

    it('handles missing config gracefully', async () => {
      render(<GenericServiceRequestTable config={{}} />, {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(screen.getByText('NO_SERVICE_REQUESTS')).toBeInTheDocument();
      });
    });

    it('handles missing patient UUID', async () => {
      mockUsePatientUUID.mockReturnValue(null);

      render(
        <GenericServiceRequestTable config={{ orderType: 'Lab Order' }} />,
        {
          wrapper: createWrapper(),
        },
      );

      await waitFor(() => {
        expect(screen.getByText('NO_SERVICE_REQUESTS')).toBeInTheDocument();
      });
    });
  });

  describe('Data sorting', () => {
    it('sorts service requests by priority within each date group', async () => {
      mockGroupByDate.mockReturnValue([
        {
          date: '2023-12-01',
          items: [mockServiceRequests[0], mockServiceRequests[1]],
        },
      ]);

      render(
        <GenericServiceRequestTable config={{ orderType: 'Lab Order' }} />,
        {
          wrapper: createWrapper(),
        },
      );

      await waitFor(() => {
        expect(mockSortServiceRequestsByPriority).toHaveBeenCalledWith([
          mockServiceRequests[0],
          mockServiceRequests[1],
        ]);
      });
    });
  });

  describe('Accessibility', () => {
    beforeEach(() => {
      mockGroupByDate.mockReturnValue([
        {
          date: '2023-12-01',
          items: [mockServiceRequests[0], mockServiceRequests[1]],
        },
        { date: '2023-11-30', items: [mockServiceRequests[2]] },
      ]);
    });

    it('has no accessibility violations with data', async () => {
      const { container } = render(
        <GenericServiceRequestTable config={{ orderType: 'Lab Order' }} />,
        {
          wrapper: createWrapper(),
        },
      );

      await waitFor(() => {
        expect(screen.getAllByTestId('accordian-table-title')).toHaveLength(2);
      });

      expect(await axe(container)).toHaveNoViolations();
    });

    it('has no accessibility violations in empty state', async () => {
      mockMapServiceRequest.mockReturnValue([]);
      mockGroupByDate.mockReturnValue([]);

      const { container } = render(
        <GenericServiceRequestTable config={{ orderType: 'Lab Order' }} />,
        {
          wrapper: createWrapper(),
        },
      );

      await waitFor(() => {
        expect(screen.getByText('NO_SERVICE_REQUESTS')).toBeInTheDocument();
      });

      expect(await axe(container)).toHaveNoViolations();
    });

    it('has proper ARIA labels', async () => {
      render(
        <GenericServiceRequestTable config={{ orderType: 'Lab Order' }} />,
        {
          wrapper: createWrapper(),
        },
      );

      await waitFor(() => {
        const tables = screen.getAllByLabelText('SERVICE_REQUEST_HEADING');
        expect(tables.length).toBeGreaterThan(0);
      });
    });
  });

  describe('EncounterUuids functionality', () => {
    it('passes encounterUuids to service call', async () => {
      render(
        <GenericServiceRequestTable
          config={{ orderType: 'Lab Order' }}
          encounterUuids={['encounter-1', 'encounter-2']}
        />,
        {
          wrapper: createWrapper(),
        },
      );

      await waitFor(() => {
        expect(mockGetServiceRequests).toHaveBeenCalledWith(
          'lab-uuid',
          'patient-123',
          ['encounter-1', 'encounter-2'],
        );
      });
    });

    it('handles empty encounter arrays', async () => {
      render(
        <GenericServiceRequestTable
          config={{ orderType: 'Lab Order' }}
          encounterUuids={[]}
        />,
        {
          wrapper: createWrapper(),
        },
      );

      await waitFor(() => {
        expect(mockGetServiceRequests).toHaveBeenCalledWith(
          'lab-uuid',
          'patient-123',
          [],
        );
      });
    });

    it('works without encounter UUIDs', async () => {
      render(
        <GenericServiceRequestTable config={{ orderType: 'Lab Order' }} />,
        {
          wrapper: createWrapper(),
        },
      );

      await waitFor(() => {
        expect(mockGetServiceRequests).toHaveBeenCalledWith(
          'lab-uuid',
          'patient-123',
          undefined,
        );
      });
    });
  });

  describe('Table headers', () => {
    beforeEach(() => {
      mockGroupByDate.mockReturnValue([
        {
          date: '2023-12-01',
          items: [mockServiceRequests[0]],
        },
      ]);
    });

    it('displays correct table headers', async () => {
      render(
        <GenericServiceRequestTable config={{ orderType: 'Lab Order' }} />,
        {
          wrapper: createWrapper(),
        },
      );

      await waitFor(() => {
        expect(
          screen.getByText('SERVICE_REQUEST_TEST_NAME'),
        ).toBeInTheDocument();
        expect(
          screen.getByText('SERVICE_REQUEST_ORDERED_BY'),
        ).toBeInTheDocument();
        expect(
          screen.getByText('SERVICE_REQUEST_ORDERED_ON'),
        ).toBeInTheDocument();
        expect(
          screen.getByText('SERVICE_REQUEST_ORDERED_STATUS'),
        ).toBeInTheDocument();
      });
    });
  });

  describe('emptyEncounterFilter logic', () => {
    beforeEach(() => {
      mockMapServiceRequest.mockReturnValue(mockServiceRequests);
      mockGroupByDate.mockReturnValue([
        {
          date: '2023-12-01',
          items: [mockServiceRequests[0]],
        },
      ]);
    });

    describe('when episodeOfCareUuids is empty array', () => {
      it('should show data table regardless of encounterUuids (emptyEncounterFilter = false)', async () => {
        render(
          <GenericServiceRequestTable
            config={{ orderType: 'Lab Order' }}
            episodeOfCareUuids={[]}
            encounterUuids={undefined}
          />,
          {
            wrapper: createWrapper(),
          },
        );

        await waitFor(() => {
          expect(screen.getAllByTestId('accordian-table-title')).toHaveLength(
            1,
          );
        });
      });

      it('should show data table when both arrays are empty (emptyEncounterFilter = false)', async () => {
        render(
          <GenericServiceRequestTable
            config={{ orderType: 'Lab Order' }}
            episodeOfCareUuids={[]}
            encounterUuids={[]}
          />,
          {
            wrapper: createWrapper(),
          },
        );

        await waitFor(() => {
          expect(screen.getAllByTestId('accordian-table-title')).toHaveLength(
            1,
          );
        });
      });

      it('should show data table when episodeOfCareUuids empty and encounterUuids has items', async () => {
        render(
          <GenericServiceRequestTable
            config={{ orderType: 'Lab Order' }}
            episodeOfCareUuids={[]}
            encounterUuids={['encounter-1']}
          />,
          {
            wrapper: createWrapper(),
          },
        );

        await waitFor(() => {
          expect(screen.getAllByTestId('accordian-table-title')).toHaveLength(
            1,
          );
        });
      });
    });

    describe('when episodeOfCareUuids is undefined or null', () => {
      it('should show empty state when encounterUuids is empty array (emptyEncounterFilter = true)', async () => {
        render(
          <GenericServiceRequestTable
            config={{ orderType: 'Lab Order' }}
            episodeOfCareUuids={undefined}
            encounterUuids={[]}
          />,
          {
            wrapper: createWrapper(),
          },
        );

        await waitFor(() => {
          expect(screen.getByText('NO_SERVICE_REQUESTS')).toBeInTheDocument();
          expect(
            screen.queryByTestId('accordian-table-title'),
          ).not.toBeInTheDocument();
        });
      });

      it('should show data table when encounterUuids is undefined (emptyEncounterFilter = false)', async () => {
        render(
          <GenericServiceRequestTable
            config={{ orderType: 'Lab Order' }}
            episodeOfCareUuids={undefined}
            encounterUuids={undefined}
          />,
          {
            wrapper: createWrapper(),
          },
        );

        await waitFor(() => {
          expect(screen.getAllByTestId('accordian-table-title')).toHaveLength(
            1,
          );
        });
      });

      it('should show data table when encounterUuids has items (emptyEncounterFilter = false)', async () => {
        render(
          <GenericServiceRequestTable
            config={{ orderType: 'Lab Order' }}
            episodeOfCareUuids={undefined}
            encounterUuids={['encounter-1']}
          />,
          {
            wrapper: createWrapper(),
          },
        );

        await waitFor(() => {
          expect(screen.getAllByTestId('accordian-table-title')).toHaveLength(
            1,
          );
        });
      });
    });

    describe('when episodeOfCareUuids has items', () => {
      it('should show empty state when encounterUuids is empty array (emptyEncounterFilter = true)', async () => {
        render(
          <GenericServiceRequestTable
            config={{ orderType: 'Lab Order' }}
            episodeOfCareUuids={['episode-1']}
            encounterUuids={[]}
          />,
          {
            wrapper: createWrapper(),
          },
        );

        await waitFor(() => {
          expect(screen.getByText('NO_SERVICE_REQUESTS')).toBeInTheDocument();
          expect(
            screen.queryByTestId('accordian-table-title'),
          ).not.toBeInTheDocument();
        });
      });

      it('should show data table when encounterUuids is undefined (emptyEncounterFilter = false)', async () => {
        render(
          <GenericServiceRequestTable
            config={{ orderType: 'Lab Order' }}
            episodeOfCareUuids={['episode-1']}
            encounterUuids={undefined}
          />,
          {
            wrapper: createWrapper(),
          },
        );

        await waitFor(() => {
          expect(screen.getAllByTestId('accordian-table-title')).toHaveLength(
            1,
          );
        });
      });

      it('should show data table when encounterUuids has items (emptyEncounterFilter = false)', async () => {
        render(
          <GenericServiceRequestTable
            config={{ orderType: 'Lab Order' }}
            episodeOfCareUuids={['episode-1']}
            encounterUuids={['encounter-1']}
          />,
          {
            wrapper: createWrapper(),
          },
        );

        await waitFor(() => {
          expect(screen.getAllByTestId('accordian-table-title')).toHaveLength(
            1,
          );
        });
      });
    });

    describe('edge cases for emptyEncounterFilter', () => {
      it('should handle undefined episodeOfCareUuids with empty encounterUuids (emptyEncounterFilter = true)', async () => {
        render(
          <GenericServiceRequestTable
            config={{ orderType: 'Lab Order' }}
            episodeOfCareUuids={undefined}
            encounterUuids={[]}
          />,
          {
            wrapper: createWrapper(),
          },
        );

        await waitFor(() => {
          expect(screen.getByText('NO_SERVICE_REQUESTS')).toBeInTheDocument();
        });
      });

      it('should handle undefined values for both props (emptyEncounterFilter = false)', async () => {
        render(
          <GenericServiceRequestTable
            config={{ orderType: 'Lab Order' }}
            episodeOfCareUuids={undefined}
            encounterUuids={undefined}
          />,
          {
            wrapper: createWrapper(),
          },
        );

        await waitFor(() => {
          expect(screen.getAllByTestId('accordian-table-title')).toHaveLength(
            1,
          );
        });
      });
    });
  });

  describe('consultation saved event subscription', () => {
    it('registers consultation saved event listener', async () => {
      mockGroupByDate.mockReturnValue([
        { date: '2023-12-01', items: [mockServiceRequests[0]] },
      ]);

      render(
        <GenericServiceRequestTable
          config={{ orderType: 'Procedure Order' }}
        />,
        {
          wrapper: createWrapper(),
        },
      );

      await waitFor(() => {
        expect(mockUseSubscribeConsultationSaved).toHaveBeenCalled();
      });
    });

    it('refetches data when consultation saved event is triggered with matching category', async () => {
      let eventCallback: (payload: any) => void = () => {};
      mockUseSubscribeConsultationSaved.mockImplementation((callback) => {
        eventCallback = callback;
      });

      mockGroupByDate.mockReturnValue([
        { date: '2023-12-01', items: [mockServiceRequests[0]] },
      ]);

      render(
        <GenericServiceRequestTable
          config={{ orderType: 'Procedure Order' }}
        />,
        {
          wrapper: createWrapper(),
        },
      );

      await waitFor(() => {
        expect(screen.getAllByTestId('accordian-table-title')).toHaveLength(1);
      });

      // Clear the mock to track new calls
      mockGetServiceRequests.mockClear();

      // Trigger the event with matching category
      eventCallback({
        patientUUID: 'patient-123',
        updatedResources: {
          conditions: false,
          allergies: false,
          medications: false,
          serviceRequests: { 'procedure order': true },
        },
      });

      // Verify refetch was triggered
      await waitFor(() => {
        expect(mockGetServiceRequests).toHaveBeenCalled();
      });
    });

    it('does not refetch when event is for different patient', async () => {
      let eventCallback: (payload: any) => void = () => {};
      mockUseSubscribeConsultationSaved.mockImplementation((callback) => {
        eventCallback = callback;
      });

      mockGroupByDate.mockReturnValue([
        { date: '2023-12-01', items: [mockServiceRequests[0]] },
      ]);

      render(
        <GenericServiceRequestTable
          config={{ orderType: 'Procedure Order' }}
        />,
        {
          wrapper: createWrapper(),
        },
      );

      await waitFor(() => {
        expect(screen.getAllByTestId('accordian-table-title')).toHaveLength(1);
      });

      // Clear the mock to track new calls
      mockGetServiceRequests.mockClear();

      // Trigger event for different patient
      eventCallback({
        patientUUID: 'different-patient',
        updatedResources: {
          conditions: false,
          allergies: false,
          medications: false,
          serviceRequests: { 'procedure order': true },
        },
      });

      // Give some time to ensure no refetch happens
      await new Promise((resolve) => setTimeout(resolve, 100));

      // Verify refetch was NOT triggered
      expect(mockGetServiceRequests).not.toHaveBeenCalled();
    });

    it('does not refetch when different category was updated', async () => {
      let eventCallback: (payload: any) => void = () => {};
      mockUseSubscribeConsultationSaved.mockImplementation((callback) => {
        eventCallback = callback;
      });

      mockGroupByDate.mockReturnValue([
        { date: '2023-12-01', items: [mockServiceRequests[0]] },
      ]);

      render(
        <GenericServiceRequestTable
          config={{ orderType: 'Procedure Order' }}
        />,
        {
          wrapper: createWrapper(),
        },
      );

      await waitFor(() => {
        expect(screen.getAllByTestId('accordian-table-title')).toHaveLength(1);
      });

      // Clear the mock to track new calls
      mockGetServiceRequests.mockClear();

      // Trigger event with different category
      eventCallback({
        patientUUID: 'patient-123',
        updatedResources: {
          conditions: false,
          allergies: false,
          medications: false,
          serviceRequests: { 'lab order': true },
        },
      });

      // Give some time to ensure no refetch happens
      await new Promise((resolve) => setTimeout(resolve, 100));

      // Verify refetch was NOT triggered
      expect(mockGetServiceRequests).not.toHaveBeenCalled();
    });

    it('does not refetch when serviceRequests is empty', async () => {
      let eventCallback: (payload: any) => void = () => {};
      mockUseSubscribeConsultationSaved.mockImplementation((callback) => {
        eventCallback = callback;
      });

      mockGroupByDate.mockReturnValue([
        { date: '2023-12-01', items: [mockServiceRequests[0]] },
      ]);

      render(
        <GenericServiceRequestTable
          config={{ orderType: 'Procedure Order' }}
        />,
        {
          wrapper: createWrapper(),
        },
      );

      await waitFor(() => {
        expect(screen.getAllByTestId('accordian-table-title')).toHaveLength(1);
      });

      // Clear the mock to track new calls
      mockGetServiceRequests.mockClear();

      // Trigger event with empty serviceRequests
      eventCallback({
        patientUUID: 'patient-123',
        updatedResources: {
          conditions: true,
          allergies: false,
          medications: false,
          serviceRequests: {},
        },
      });

      // Give some time to ensure no refetch happens
      await new Promise((resolve) => setTimeout(resolve, 100));

      // Verify refetch was NOT triggered
      expect(mockGetServiceRequests).not.toHaveBeenCalled();
    });
  });

  describe('Task Integration', () => {
    beforeEach(() => {
      mockGroupByDate.mockImplementation((data) => {
        if (!data || data.length === 0) return [];
        return [{ date: '2023-12-01', items: data }];
      });
    });

    describe('When showTasks is false or not configured', () => {
      it('should not render TaskList when showTasks is false', async () => {
        mockGetServiceRequests.mockResolvedValue(mockServiceRequestBundle);

        render(
          <GenericServiceRequestTable
            config={{ orderType: 'Lab Order', showTasks: false }}
          />,
          { wrapper: createWrapper() },
        );

        await waitFor(() => {
          expect(
            screen.getByTestId('accordian-table-title'),
          ).toBeInTheDocument();
        });

        expect(screen.queryByTestId('tasks-table')).not.toBeInTheDocument();
        expect(mockGetTasks).not.toHaveBeenCalled();
      });

      it('should not render TaskList when showTasks is not configured', async () => {
        mockGetServiceRequests.mockResolvedValue(mockServiceRequestBundle);

        render(
          <GenericServiceRequestTable config={{ orderType: 'Lab Order' }} />,
          { wrapper: createWrapper() },
        );

        await waitFor(() => {
          expect(
            screen.getByTestId('accordian-table-title'),
          ).toBeInTheDocument();
        });

        expect(screen.queryByTestId('tasks-table')).not.toBeInTheDocument();
      });
    });

    describe('When showTasks is true', () => {
      const tasksConfig = {
        showOnlyLeafTasks: true,
        taskTypes: ['6501d0f9-98da-44be-afc9-e2319453f0d6'],
      };

      it('should render rows as expandable and expand all rows by default when showTasks is true', async () => {
        mockGetServiceRequests.mockResolvedValue(mockServiceRequestBundle);
        mockGetTasks.mockResolvedValue(mockTasksBundle);

        render(
          <GenericServiceRequestTable
            config={{
              orderType: 'Lab Order',
              showTasks: true,
              tasksControlConfig: tasksConfig,
            }}
          />,
          { wrapper: createWrapper() },
        );

        await waitFor(() => {
          const table = screen.getByTestId(
            'generic-service-request-table-2023-12-01',
          );
          expect(table).toBeInTheDocument();
        });

        // All rows should be expanded by default
        const collapseButtons = screen.queryAllByRole('button', {
          name: /collapse/i,
        });
        expect(collapseButtons.length).toBeGreaterThan(0);
      });

      it('should pass tasksControlConfig to TaskList component', async () => {
        mockGetServiceRequests.mockResolvedValue(mockServiceRequestBundle);
        mockGetTasks.mockResolvedValue(mockTasksBundle);

        render(
          <GenericServiceRequestTable
            config={{
              orderType: 'Lab Order',
              showTasks: true,
              tasksControlConfig: tasksConfig,
            }}
          />,
          { wrapper: createWrapper() },
        );

        await waitFor(() => {
          expect(mockGetTasks).toHaveBeenCalled();
        });
      });

      it('should pass orderReference to TaskList for each service request', async () => {
        mockGetServiceRequests.mockResolvedValue(mockServiceRequestBundle);
        mockGetTasks.mockResolvedValue(mockTasksBundle);

        render(
          <GenericServiceRequestTable
            config={{
              orderType: 'Lab Order',
              showTasks: true,
              tasksControlConfig: tasksConfig,
            }}
          />,
          { wrapper: createWrapper() },
        );

        await waitFor(() => {
          expect(mockGetTasks).toHaveBeenCalledWith('patient-123', 'service-1');
        });
      });

      it('should render TaskList in expanded row content', async () => {
        mockGetServiceRequests.mockResolvedValue(mockServiceRequestBundle);
        mockGetTasks.mockResolvedValue(mockTasksBundle);

        render(
          <GenericServiceRequestTable
            config={{
              orderType: 'Lab Order',
              showTasks: true,
              tasksControlConfig: tasksConfig,
            }}
          />,
          { wrapper: createWrapper() },
        );

        await waitFor(() => {
          expect(screen.getByTestId('tasks-table')).toBeInTheDocument();
        });
      });

      it('should show task data when tasks are available', async () => {
        mockGetServiceRequests.mockResolvedValue(mockServiceRequestBundle);
        mockGetTasks.mockResolvedValue(mockTasksBundle);

        render(
          <GenericServiceRequestTable
            config={{
              orderType: 'Lab Order',
              showTasks: true,
              tasksControlConfig: tasksConfig,
            }}
          />,
          { wrapper: createWrapper() },
        );

        await waitFor(() => {
          expect(screen.getByText('Vitals Form')).toBeInTheDocument();
        });
      });

      it('should render tasks even though tasksControlConfig is not provided', async () => {
        mockGetServiceRequests.mockResolvedValue(mockServiceRequestBundle);
        mockGetTasks.mockResolvedValue(mockTasksBundle);

        render(
          <GenericServiceRequestTable
            config={{
              orderType: 'Lab Order',
              showTasks: true,
            }}
          />,
          { wrapper: createWrapper() },
        );

        await waitFor(() => {
          expect(screen.getByTestId('tasks-table')).toBeInTheDocument();
        });
      });
    });
  });
});
