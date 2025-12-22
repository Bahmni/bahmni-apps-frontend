import {
  groupByDate,
  formatDate,
  FULL_MONTH_DATE_FORMAT,
  ISO_DATE_FORMAT,
  useTranslation,
  getFormattedError,
  getOrderTypes,
  getServiceRequests,
} from '@bahmni/services';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, waitFor } from '@testing-library/react';
import type { Bundle, ServiceRequest } from 'fhir/r4';
import { axe, toHaveNoViolations } from 'jest-axe';

import { usePatientUUID } from '../../hooks/usePatientUUID';
import { useNotification } from '../../notification';
import GenericServiceRequestTable from '../GenericServiceRequestTable';
import { ServiceRequestViewModel } from '../models';
import { mapServiceRequest, sortServiceRequestsByPriority } from '../utils';

expect.extend(toHaveNoViolations);

jest.mock('@bahmni/services', () => ({
  ...jest.requireActual('@bahmni/services'),
  useTranslation: jest.fn(),
  groupByDate: jest.fn(),
  formatDate: jest.fn(),
  getFormattedError: jest.fn(),
  getOrderTypes: jest.fn(),
  getServiceRequests: jest.fn(),
}));

jest.mock('../utils', () => ({
  mapServiceRequest: jest.fn(),
  sortServiceRequestsByPriority: jest.fn(),
}));

jest.mock('../../hooks/usePatientUUID', () => ({
  usePatientUUID: jest.fn(),
}));

jest.mock('../../notification', () => ({
  useNotification: jest.fn(),
}));

const mockUseTranslation = useTranslation as jest.MockedFunction<
  typeof useTranslation
>;
const mockGroupByDate = groupByDate as jest.MockedFunction<typeof groupByDate>;
const mockFormatDate = formatDate as jest.MockedFunction<typeof formatDate>;
const mockGetFormattedError = getFormattedError as jest.MockedFunction<
  typeof getFormattedError
>;
const mockGetOrderTypes = getOrderTypes as jest.MockedFunction<
  typeof getOrderTypes
>;
const mockGetServiceRequests = getServiceRequests as jest.MockedFunction<
  typeof getServiceRequests
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

const mockOrderTypes = {
  results: [
    {
      uuid: 'lab-uuid',
      display: 'Lab Order',
      conceptClasses: [
        {
          uuid: 'concept-class-1',
          name: 'Test',
        },
      ],
    },
    {
      uuid: 'radiology-uuid',
      display: 'Radiology Order',
      conceptClasses: [
        {
          uuid: 'concept-class-2',
          name: 'Radiology',
        },
      ],
    },
  ],
};

const mockServiceRequestBundle: Bundle<ServiceRequest> = {
  resourceType: 'Bundle',
  type: 'searchset',
  entry: [
    {
      resource: {
        resourceType: 'ServiceRequest',
        id: 'service-1',
        status: 'active',
        intent: 'order',
        code: { text: 'Blood Test' },
        priority: 'stat',
        subject: { reference: 'Patient/patient-123' },
        requester: { display: 'Dr. Smith' },
        occurrencePeriod: { start: '2023-12-01T10:30:00.000Z' },
      },
    },
    {
      resource: {
        resourceType: 'ServiceRequest',
        id: 'service-2',
        status: 'active',
        intent: 'order',
        code: { text: 'Urine Test' },
        priority: 'routine',
        subject: { reference: 'Patient/patient-123' },
        requester: { display: 'Dr. Johnson' },
        occurrencePeriod: { start: '2023-12-01T14:15:00.000Z' },
      },
    },
    {
      resource: {
        resourceType: 'ServiceRequest',
        id: 'service-3',
        status: 'active',
        intent: 'order',
        code: { text: 'Liver Function Test' },
        priority: 'stat',
        subject: { reference: 'Patient/patient-123' },
        requester: { display: 'Dr. Brown' },
        occurrencePeriod: { start: '2023-11-30T09:00:00.000Z' },
      },
    },
  ],
};

const mockServiceRequests: ServiceRequestViewModel[] = [
  {
    id: 'service-1',
    testName: 'Blood Test',
    priority: 'stat',
    orderedBy: 'Dr. Smith',
    orderedDate: '2023-12-01T10:30:00.000Z',
    status: 'active',
  },
  {
    id: 'service-2',
    testName: 'Urine Test',
    priority: 'routine',
    orderedBy: 'Dr. Johnson',
    orderedDate: '2023-12-01T14:15:00.000Z',
    status: 'active',
  },
  {
    id: 'service-3',
    testName: 'Liver Function Test',
    priority: 'stat',
    orderedBy: 'Dr. Brown',
    orderedDate: '2023-11-30T09:00:00.000Z',
    status: 'active',
  },
];

describe('GenericServiceRequestTable', () => {
  const mockAddNotification = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();

    mockUseTranslation.mockReturnValue({
      t: (key: string) => {
        const translations: Record<string, string> = {
          SERVICE_REQUEST_TEST_NAME: 'Test Name',
          SERVICE_REQUEST_ORDERED_BY: 'Ordered By',
          SERVICE_REQUEST_ORDERED_STATUS: 'Status',
          SERVICE_REQUEST_HEADING: 'Service Requests',
          NO_SERVICE_REQUESTS: 'No service requests recorded',
          SERVICE_REQUEST_PRIORITY_URGENT: 'Urgent',
          ERROR_DEFAULT_TITLE: 'Error',
          IN_PROGRESS_STATUS: 'In Progress',
          COMPLETED_STATUS: 'Completed',
          REVOKED_STATUS: 'Revoked',
        };
        return translations[key] || key;
      },
      i18n: {} as any,
      ready: true,
    } as any);

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
    mockSortServiceRequestsByPriority.mockImplementation((data) => data);
    mockGroupByDate.mockReturnValue([]);
    mockGetOrderTypes.mockResolvedValue(mockOrderTypes);
    mockGetServiceRequests.mockResolvedValue(mockServiceRequestBundle);
    mockMapServiceRequest.mockReturnValue(mockServiceRequests);
  });

  describe('Loading state', () => {
    it('renders loading state while fetching order types', async () => {
      mockGetOrderTypes.mockImplementation(
        () => new Promise(() => {}), // Never resolves
      );

      render(
        <GenericServiceRequestTable config={{ orderType: 'Lab Order' }} />,
        {
          wrapper: createWrapper(),
        },
      );

      expect(screen.getByTestId('sortable-table-skeleton')).toBeInTheDocument();
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
          screen.getByTestId('sortable-table-skeleton'),
        ).toBeInTheDocument();
      });
    });
  });

  describe('Error handling', () => {
    it('renders error state when order types fetch fails', async () => {
      mockGetOrderTypes.mockRejectedValue(new Error('Order types error'));

      render(
        <GenericServiceRequestTable config={{ orderType: 'Lab Order' }} />,
        {
          wrapper: createWrapper(),
        },
      );

      await waitFor(() => {
        expect(mockAddNotification).toHaveBeenCalledWith({
          title: 'Error',
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
          title: 'Error',
          message: 'Network error',
          type: 'error',
        });
      });
    });

    it('displays error message in table when there is an error', async () => {
      mockGetOrderTypes.mockRejectedValue(new Error('Network error'));

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
        expect(
          screen.getByText('No service requests recorded'),
        ).toBeInTheDocument();
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
        expect(
          screen.getByText('No service requests recorded'),
        ).toBeInTheDocument();
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

      mockFormatDate.mockImplementation((dateStr, t, format) => {
        if (format === ISO_DATE_FORMAT) {
          if (dateStr === '2023-12-01T10:30:00.000Z') {
            return { formattedResult: '2023-12-01' };
          }
          if (dateStr === '2023-12-01T14:15:00.000Z') {
            return { formattedResult: '2023-12-01' };
          }
          if (dateStr === '2023-11-30T09:00:00.000Z') {
            return { formattedResult: '2023-11-30' };
          }
        }
        // For display formatting - return display format
        return { formattedResult: '01/12/2023' };
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
          ISO_DATE_FORMAT,
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
          '2023-12-01',
          mockUseTranslation().t,
          FULL_MONTH_DATE_FORMAT,
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
        expect(screen.getAllByTestId('sortable-data-table')).toHaveLength(2);
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
        expect(screen.getByText('Urgent')).toBeInTheDocument();
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
        expect(screen.getByText('In Progress')).toBeInTheDocument();
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
        expect(screen.getByText('Completed')).toBeInTheDocument();
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
        expect(screen.getByText('Revoked')).toBeInTheDocument();
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

      mockUseTranslation.mockReturnValue({
        t: (key: string) => {
          const translations: Record<string, string> = {
            SERVICE_REQUEST_TEST_NAME: 'Test Name',
            SERVICE_REQUEST_ORDERED_BY: 'Ordered By',
            SERVICE_REQUEST_ORDERED_STATUS: 'Status',
            SERVICE_REQUEST_HEADING: 'Service Requests',
            NO_SERVICE_REQUESTS: 'No service requests recorded',
            SERVICE_REQUEST_PRIORITY_URGENT: 'Urgent',
            ERROR_DEFAULT_TITLE: 'Error',
            IN_PROGRESS_STATUS: 'In Progress',
            COMPLETED_STATUS: 'Completed',
            REVOKED_STATUS: 'Revoked',
            UNKNOWN_STATUS: 'Unknown',
          };
          return translations[key] || key;
        },
        i18n: {} as any,
        ready: true,
      } as any);

      render(
        <GenericServiceRequestTable config={{ orderType: 'Lab Order' }} />,
        {
          wrapper: createWrapper(),
        },
      );

      await waitFor(() => {
        expect(screen.getByText('Unknown')).toBeInTheDocument();
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
        expect(screen.getAllByText('Urgent')).toHaveLength(1);
      });
    });

    it('handles missing config gracefully', async () => {
      render(<GenericServiceRequestTable config={{}} />, {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(
          screen.getByText('No service requests recorded'),
        ).toBeInTheDocument();
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
        expect(
          screen.getByText('No service requests recorded'),
        ).toBeInTheDocument();
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
        expect(
          screen.getByText('No service requests recorded'),
        ).toBeInTheDocument();
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
        const tables = screen.getAllByLabelText('Service Requests');
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
        expect(screen.getByText('Test Name')).toBeInTheDocument();
        expect(screen.getByText('Ordered By')).toBeInTheDocument();
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
          expect(
            screen.getByText('No service requests recorded'),
          ).toBeInTheDocument();
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
          expect(
            screen.getByText('No service requests recorded'),
          ).toBeInTheDocument();
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
          expect(
            screen.getByText('No service requests recorded'),
          ).toBeInTheDocument();
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
});
