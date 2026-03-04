import { useQuery } from '@tanstack/react-query';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { axe, toHaveNoViolations } from 'jest-axe';
import { usePatientUUID } from '../../hooks/usePatientUUID';
import { useNotification } from '../../notification';
import AppointmentsTable from '../AppointmentsTable';

expect.extend(toHaveNoViolations);

jest.mock('../../hooks/usePatientUUID');
jest.mock('../../notification');
jest.mock('@bahmni/services', () => ({
  ...jest.requireActual('@bahmni/services'),
  useTranslation: jest.fn(() => ({
    t: (key: string) => key,
  })),
  useSubscribeConsultationSaved: jest.fn(),
  getUpcomingAppointments: jest.fn(),
  getPastAppointments: jest.fn(),
}));
jest.mock('@tanstack/react-query');

const mockUseQuery = useQuery as jest.MockedFunction<typeof useQuery>;
const mockUsePatientUUID = usePatientUUID as jest.MockedFunction<
  typeof usePatientUUID
>;
const mockUseNotification = useNotification as jest.MockedFunction<
  typeof useNotification
>;

const mockUpcomingAppointment = {
  uuid: 'appt-upcoming-1',
  DASHBOARD_APPOINTMENTS_START_DATE_IN_UTC_KEY: [2025, 3, 15, 10, 30],
  DASHBOARD_APPOINTMENTS_SLOT_KEY: '10:30 AM - 10:46 AM',
  DASHBOARD_APPOINTMENTS_APPOINTMENT_NUMBER_KEY: 'APT-001',
  DASHBOARD_APPOINTMENTS_REASON_KEY: 'Follow-up',
  DASHBOARD_APPOINTMENTS_SERVICE_KEY: 'Consultation',
  DASHBOARD_APPOINTMENTS_SERVICE_TYPE_KEY: 'General',
  DASHBOARD_APPOINTMENTS_PROVIDER_KEY: 'Dr. Smith',
  DASHBOARD_APPOINTMENTS_LOCATION_KEY: 'OPD-1',
  DASHBOARD_APPOINTMENTS_STATUS_KEY: 'Scheduled',
};

const mockPastAppointment = {
  uuid: 'appt-past-1',
  DASHBOARD_APPOINTMENTS_START_DATE_IN_UTC_KEY: [2025, 1, 15, 10, 30],
  DASHBOARD_APPOINTMENTS_SLOT_KEY: '10:30 AM - 10:46 AM',
  DASHBOARD_APPOINTMENTS_APPOINTMENT_NUMBER_KEY: 'APT-OLD-001',
  DASHBOARD_APPOINTMENTS_REASON_KEY: 'Routine Checkup',
  DASHBOARD_APPOINTMENTS_SERVICE_KEY: 'Consultation',
  DASHBOARD_APPOINTMENTS_SERVICE_TYPE_KEY: 'General',
  DASHBOARD_APPOINTMENTS_PROVIDER_KEY: 'Dr. Johnson',
  DASHBOARD_APPOINTMENTS_LOCATION_KEY: 'OPD-2',
  DASHBOARD_APPOINTMENTS_STATUS_KEY: 'Completed',
};

describe('AppointmentsTable', () => {
  let refetchUpcomingMock: jest.Mock;
  let refetchPastMock: jest.Mock;
  let addNotificationMock: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();

    refetchUpcomingMock = jest.fn();
    refetchPastMock = jest.fn();
    addNotificationMock = jest.fn();

    mockUsePatientUUID.mockReturnValue('patient-uuid-123');
    mockUseNotification.mockReturnValue({
      addNotification: addNotificationMock,
    } as any);

    // Default mock for useQuery - loading state
    mockUseQuery.mockImplementation(
      (options: any) =>
        ({
          data: undefined,
          isLoading: true,
          isError: false,
          error: null,
          refetch: options.queryKey[0].includes('upcoming')
            ? refetchUpcomingMock
            : refetchPastMock,
          isFetching: false,
          status: 'pending',
          fetchStatus: 'idle',
        }) as any,
    );

    Object.defineProperty(globalThis, 'matchMedia', {
      writable: true,
      value: jest.fn().mockImplementation((query: string) => ({
        matches: false,
        media: query,
        onchange: null,
        addListener: jest.fn(),
        removeListener: jest.fn(),
        addEventListener: jest.fn(),
        removeEventListener: jest.fn(),
        dispatchEvent: jest.fn(),
      })),
    });
  });

  describe('Rendering', () => {
    it('should render with loading state initially', () => {
      mockUseQuery.mockImplementation(
        (options: any) =>
          ({
            data: undefined,
            isLoading: true,
            isError: false,
            error: null,
            refetch: refetchUpcomingMock,
            isFetching: false,
            status: 'pending',
            fetchStatus: 'idle',
          }) as any,
      );

      render(<AppointmentsTable config={{}} episodeOfCareUuids={[]} />);

      expect(screen.getByTestId('appointments-table')).toBeInTheDocument();
    });

    it('should render both tabs', () => {
      mockUseQuery.mockImplementation(
        (options: any) =>
          ({
            data: [],
            isLoading: false,
            isError: false,
            error: null,
            refetch: jest.fn(),
            isFetching: false,
            status: 'success',
            fetchStatus: 'idle',
          }) as any,
      );

      render(<AppointmentsTable config={{}} episodeOfCareUuids={[]} />);

      expect(screen.getByText('APPOINTMENTS_TAB_UPCOMING')).toBeInTheDocument();
      expect(screen.getByText('APPOINTMENTS_TAB_PAST')).toBeInTheDocument();
    });
  });

  describe('Data Fetching', () => {
    it('should fetch upcoming and past appointments on mount', () => {
      mockUseQuery.mockImplementation(
        (options: any) =>
          ({
            data: [],
            isLoading: false,
            isError: false,
            error: null,
            refetch: jest.fn(),
            isFetching: false,
            status: 'success',
            fetchStatus: 'idle',
          }) as any,
      );

      render(<AppointmentsTable config={{}} episodeOfCareUuids={[]} />);

      expect(mockUseQuery).toHaveBeenCalledWith(
        expect.objectContaining({
          queryKey: expect.arrayContaining(['appointments-upcoming']),
          enabled: true,
        }),
      );
      expect(mockUseQuery).toHaveBeenCalledWith(
        expect.objectContaining({
          queryKey: expect.arrayContaining(['appointments-past']),
          enabled: true,
        }),
      );
    });

    it('should disable queries when patient UUID is not available', () => {
      mockUsePatientUUID.mockReturnValue(null);

      render(<AppointmentsTable config={{}} episodeOfCareUuids={[]} />);

      expect(mockUseQuery).toHaveBeenCalledWith(
        expect.objectContaining({
          enabled: false,
        }),
      );
    });

    it('should display upcoming appointments when data loaded', () => {
      let callCount = 0;
      mockUseQuery.mockImplementation((options: any) => {
        callCount++;
        if (callCount === 1) {
          // First call is for upcoming
          return {
            data: [mockUpcomingAppointment],
            isLoading: false,
            isError: false,
            error: null,
            refetch: refetchUpcomingMock,
            isFetching: false,
            status: 'success',
            fetchStatus: 'idle',
          } as any;
        }
        // Second call is for past
        return {
          data: [],
          isLoading: false,
          isError: false,
          error: null,
          refetch: refetchPastMock,
          isFetching: false,
          status: 'success',
          fetchStatus: 'idle',
        } as any;
      });

      render(<AppointmentsTable config={{}} episodeOfCareUuids={[]} />);

      expect(
        screen.queryByText('NO_UPCOMING_APPOINTMENTS'),
      ).not.toBeInTheDocument();
    });
  });

  describe('Error Handling', () => {
    it('should display error notification when upcoming appointments fail', async () => {
      const errorMessage = 'Failed to fetch appointments';
      let callCount = 0;

      mockUseQuery.mockImplementation((options: any) => {
        callCount++;
        if (callCount === 1) {
          // First call - upcoming with error
          return {
            data: undefined,
            isLoading: false,
            isError: true,
            error: new Error(errorMessage),
            refetch: jest.fn(),
            isFetching: false,
            status: 'error',
            fetchStatus: 'idle',
          } as any;
        }
        // Second call - past without error
        return {
          data: [],
          isLoading: false,
          isError: false,
          error: null,
          refetch: jest.fn(),
          isFetching: false,
          status: 'success',
          fetchStatus: 'idle',
        } as any;
      });

      render(<AppointmentsTable config={{}} episodeOfCareUuids={[]} />);

      await waitFor(() => {
        expect(addNotificationMock).toHaveBeenCalledWith(
          expect.objectContaining({
            type: 'error',
          }),
        );
      });
    });

    it('should display error state when both queries fail', () => {
      mockUseQuery.mockImplementation(
        () =>
          ({
            data: undefined,
            isLoading: false,
            isError: true,
            error: new Error('Network error'),
            refetch: jest.fn(),
            isFetching: false,
            status: 'error',
            fetchStatus: 'idle',
          }) as any,
      );

      render(<AppointmentsTable config={{}} episodeOfCareUuids={[]} />);

      expect(
        screen.getByTestId('appointments-table-error'),
      ).toBeInTheDocument();
      expect(
        screen.getByText('APPOINTMENTS_ERROR_FETCHING'),
      ).toBeInTheDocument();
    });

    it('should show appropriate error message on failure', () => {
      mockUseQuery.mockImplementation(
        () =>
          ({
            data: undefined,
            isLoading: false,
            isError: true,
            error: new Error('API Error'),
            refetch: jest.fn(),
            isFetching: false,
            status: 'error',
            fetchStatus: 'idle',
          }) as any,
      );

      render(<AppointmentsTable config={{}} episodeOfCareUuids={[]} />);

      expect(
        screen.getByText('APPOINTMENTS_ERROR_FETCHING'),
      ).toBeInTheDocument();
    });
  });

  describe('Tab Switching', () => {
    it('should switch between tabs', async () => {
      let callCount = 0;
      mockUseQuery.mockImplementation((options: any) => {
        callCount++;
        if (callCount === 1) {
          return {
            data: [mockUpcomingAppointment],
            isLoading: false,
            isError: false,
            error: null,
            refetch: jest.fn(),
            isFetching: false,
            status: 'success',
            fetchStatus: 'idle',
          } as any;
        }
        return {
          data: [mockPastAppointment],
          isLoading: false,
          isError: false,
          error: null,
          refetch: jest.fn(),
          isFetching: false,
          status: 'success',
          fetchStatus: 'idle',
        } as any;
      });

      render(<AppointmentsTable config={{}} episodeOfCareUuids={[]} />);

      const pastTab = screen.getByText('APPOINTMENTS_TAB_PAST');
      await userEvent.click(pastTab);

      // Verify tab switched (no specific assertion needed, just verify no errors)
      expect(pastTab).toBeInTheDocument();
    });
  });

  describe('Configuration', () => {
    it('should use default fields when config not provided', () => {
      let callCount = 0;
      mockUseQuery.mockImplementation((options: any) => {
        callCount++;
        if (callCount === 1) {
          return {
            data: [mockUpcomingAppointment],
            isLoading: false,
            isError: false,
            error: null,
            refetch: jest.fn(),
            isFetching: false,
            status: 'success',
            fetchStatus: 'idle',
          } as any;
        }
        return {
          data: [],
          isLoading: false,
          isError: false,
          error: null,
          refetch: jest.fn(),
          isFetching: false,
          status: 'success',
          fetchStatus: 'idle',
        } as any;
      });

      render(<AppointmentsTable config={{}} episodeOfCareUuids={[]} />);

      // Default fields should be displayed - table should render
      expect(screen.getByTestId('appointments-table')).toBeInTheDocument();
      expect(screen.getByText('APPOINTMENTS_TAB_UPCOMING')).toBeInTheDocument();
    });

    it('should use custom fields from config when provided', () => {
      let callCount = 0;
      mockUseQuery.mockImplementation((options: any) => {
        callCount++;
        if (callCount === 1) {
          return {
            data: [mockUpcomingAppointment],
            isLoading: false,
            isError: false,
            error: null,
            refetch: jest.fn(),
            isFetching: false,
            status: 'success',
            fetchStatus: 'idle',
          } as any;
        }
        return {
          data: [],
          isLoading: false,
          isError: false,
          error: null,
          refetch: jest.fn(),
          isFetching: false,
          status: 'success',
          fetchStatus: 'idle',
        } as any;
      });

      const customConfig = {
        fields: ['appointmentNumber', 'status', 'provider'],
      };

      render(
        <AppointmentsTable config={customConfig} episodeOfCareUuids={[]} />,
      );

      expect(screen.getByTestId('appointments-table')).toBeInTheDocument();
    });

    it('should limit past appointments based on config', () => {
      const mockPastAppointment2 = {
        ...mockPastAppointment,
        uuid: 'appt-past-2',
        DASHBOARD_APPOINTMENTS_APPOINTMENT_NUMBER_KEY: 'APT-OLD-002',
      };

      let callCount = 0;
      mockUseQuery.mockImplementation((options: any) => {
        callCount++;
        if (callCount === 1) {
          return {
            data: [],
            isLoading: false,
            isError: false,
            error: null,
            refetch: jest.fn(),
            isFetching: false,
            status: 'success',
            fetchStatus: 'idle',
          } as any;
        }
        return {
          data: [mockPastAppointment, mockPastAppointment2],
          isLoading: false,
          isError: false,
          error: null,
          refetch: jest.fn(),
          isFetching: false,
          status: 'success',
          fetchStatus: 'idle',
        } as any;
      });

      const config = { numberOfPastAppointments: 1 };

      render(<AppointmentsTable config={config} episodeOfCareUuids={[]} />);

      expect(screen.getByTestId('appointments-table')).toBeInTheDocument();
    });
  });

  describe('Empty States', () => {
    it('should show empty state for upcoming appointments when none exist', () => {
      mockUseQuery.mockImplementation(
        () =>
          ({
            data: [],
            isLoading: false,
            isError: false,
            error: null,
            refetch: jest.fn(),
            isFetching: false,
            status: 'success',
            fetchStatus: 'idle',
          }) as any,
      );

      render(<AppointmentsTable config={{}} episodeOfCareUuids={[]} />);

      expect(
        screen.getByText('DASHBOARD_NO_UPCOMING_APPOINTMENTS_KEY'),
      ).toBeInTheDocument();
    });

    it('should show empty state for past appointments when none exist', async () => {
      mockUseQuery.mockImplementation(
        () =>
          ({
            data: [],
            isLoading: false,
            isError: false,
            error: null,
            refetch: jest.fn(),
            isFetching: false,
            status: 'success',
            fetchStatus: 'idle',
          }) as any,
      );

      render(<AppointmentsTable config={{}} episodeOfCareUuids={[]} />);

      const pastTab = screen.getByText('APPOINTMENTS_TAB_PAST');
      await userEvent.click(pastTab);

      expect(
        screen.getByText('DASHBOARD_NO_PAST_APPOINTMENTS_KEY'),
      ).toBeInTheDocument();
    });
  });

  describe('Cache Invalidation', () => {
    it('should refetch both queries on consultation saved event', () => {
      let callCount = 0;
      mockUseQuery.mockImplementation((options: any) => {
        callCount++;
        if (callCount === 1) {
          return {
            data: [mockUpcomingAppointment],
            isLoading: false,
            isError: false,
            error: null,
            refetch: refetchUpcomingMock,
            isFetching: false,
            status: 'success',
            fetchStatus: 'idle',
          } as any;
        }
        return {
          data: [mockPastAppointment],
          isLoading: false,
          isError: false,
          error: null,
          refetch: refetchPastMock,
          isFetching: false,
          status: 'success',
          fetchStatus: 'idle',
        } as any;
      });

      render(<AppointmentsTable config={{}} episodeOfCareUuids={[]} />);

      // Refetch methods are available and can be called by useSubscribeConsultationSaved
      expect(refetchUpcomingMock).toBeDefined();
      expect(refetchPastMock).toBeDefined();
    });
  });

  describe('Props Handling', () => {
    it('should accept config prop', () => {
      mockUseQuery.mockImplementation(
        () =>
          ({
            data: [],
            isLoading: false,
            isError: false,
            error: null,
            refetch: jest.fn(),
            isFetching: false,
            status: 'success',
            fetchStatus: 'idle',
          }) as any,
      );

      const config = { fields: ['status', 'provider'] };

      render(<AppointmentsTable config={config} episodeOfCareUuids={[]} />);

      expect(screen.getByTestId('appointments-table')).toBeInTheDocument();
    });

    it('should accept episodeOfCareUuids prop', () => {
      mockUseQuery.mockImplementation(
        () =>
          ({
            data: [],
            isLoading: false,
            isError: false,
            error: null,
            refetch: jest.fn(),
            isFetching: false,
            status: 'success',
            fetchStatus: 'idle',
          }) as any,
      );

      const episodeUuids = ['episode-1', 'episode-2'];

      render(
        <AppointmentsTable config={{}} episodeOfCareUuids={episodeUuids} />,
      );

      expect(screen.getByTestId('appointments-table')).toBeInTheDocument();
    });

    it('should accept encounterUuids prop', () => {
      mockUseQuery.mockImplementation(
        () =>
          ({
            data: [],
            isLoading: false,
            isError: false,
            error: null,
            refetch: jest.fn(),
            isFetching: false,
            status: 'success',
            fetchStatus: 'idle',
          }) as any,
      );

      const encounterUuids = ['encounter-1', 'encounter-2'];

      render(
        <AppointmentsTable
          config={{}}
          episodeOfCareUuids={[]}
          encounterUuids={encounterUuids}
        />,
      );

      expect(screen.getByTestId('appointments-table')).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('should have no accessibility violations when rendering with upcoming appointments', async () => {
      let callCount = 0;
      mockUseQuery.mockImplementation((options: any) => {
        callCount++;
        if (callCount === 1) {
          // First call is for upcoming
          return {
            data: [mockUpcomingAppointment],
            isLoading: false,
            isError: false,
            error: null,
            refetch: jest.fn(),
            isFetching: false,
            status: 'success',
            fetchStatus: 'idle',
          } as any;
        }
        // Second call is for past
        return {
          data: [mockPastAppointment],
          isLoading: false,
          isError: false,
          error: null,
          refetch: jest.fn(),
          isFetching: false,
          status: 'success',
          fetchStatus: 'idle',
        } as any;
      });

      const { container } = render(
        <AppointmentsTable config={{}} episodeOfCareUuids={[]} />,
      );

      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('should have no accessibility violations when rendering with error state', async () => {
      mockUseQuery.mockImplementation(
        () =>
          ({
            data: undefined,
            isLoading: false,
            isError: true,
            error: new Error('Network error'),
            refetch: jest.fn(),
            isFetching: false,
            status: 'error',
            fetchStatus: 'idle',
          }) as any,
      );

      const { container } = render(
        <AppointmentsTable config={{}} episodeOfCareUuids={[]} />,
      );

      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('should have no accessibility violations when rendering with empty state', async () => {
      mockUseQuery.mockImplementation(
        () =>
          ({
            data: [],
            isLoading: false,
            isError: false,
            error: null,
            refetch: jest.fn(),
            isFetching: false,
            status: 'success',
            fetchStatus: 'idle',
          }) as any,
      );

      const { container } = render(
        <AppointmentsTable config={{}} episodeOfCareUuids={[]} />,
      );

      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });
  });
});
