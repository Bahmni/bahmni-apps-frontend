import {
  deleteAppointmentService,
  getAllAppointmentServices,
} from '@bahmni/services';
import { useUserPrivilege } from '@bahmni/widgets';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {
  ADMIN_TAB_PRIVILEGE,
  MANAGE_APPOINTMENT_SERVICES_PRIVILEGE,
} from '../../../../constants/app';
import { mockAppointmentServices } from '../__mocks__/mocks';
import AllServicesPage from '../index';

jest.mock('@bahmni/services', () => ({
  ...jest.requireActual('@bahmni/services'),
  getAllAppointmentServices: jest.fn(),
  deleteAppointmentService: jest.fn(),
}));

jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => jest.fn(),
}));

const mockAddNotification = jest.fn();

jest.mock('@bahmni/widgets', () => ({
  ...jest.requireActual('@bahmni/widgets'),
  useUserPrivilege: jest.fn(),
  useNotification: jest.fn(() => ({ addNotification: mockAddNotification })),
}));

jest.mock('../../../../providers/appointmentsConfig', () => ({
  useAppointmentsConfig: jest.fn(() => ({
    appointmentsConfig: {
      serviceTableFields: [
        'name',
        'location',
        'speciality',
        'durationMins',
        'description',
      ],
    },
    isLoading: false,
    error: null,
  })),
}));

describe('AllServicesPage Integration', () => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false, staleTime: 0 } },
  });

  beforeEach(() => {
    jest.clearAllMocks();
    mockAddNotification.mockClear();
    (useUserPrivilege as jest.Mock).mockReturnValue({
      userPrivileges: [
        { name: ADMIN_TAB_PRIVILEGE },
        { name: MANAGE_APPOINTMENT_SERVICES_PRIVILEGE },
      ],
    });
  });

  afterEach(() => {
    queryClient.clear();
  });

  it('should fetch and display all appointment services', async () => {
    (getAllAppointmentServices as jest.Mock).mockResolvedValue(
      mockAppointmentServices,
    );

    render(
      <QueryClientProvider client={queryClient}>
        <AllServicesPage />
      </QueryClientProvider>,
    );

    expect(
      screen.getByTestId('all-services-action-data-table-test-id'),
    ).toBeInTheDocument();
    expect(
      screen.getByTestId('all-services-sortable-data-table-test-id-skeleton'),
    ).toBeInTheDocument();

    await waitFor(() => {
      expect(
        screen.getByText('General Medicine OPD Consultation'),
      ).toBeInTheDocument();
    });

    expect(screen.getByText('ENT OPD Consultation')).toBeInTheDocument();
    expect(screen.getByText('General Medicine')).toBeInTheDocument();
    expect(screen.getByText('ENT Ward')).toBeInTheDocument();
    expect(screen.getByText('15')).toBeInTheDocument();
    expect(
      screen.getByText('Appointment for General Medicine Consultation'),
    ).toBeInTheDocument();
    expect(getAllAppointmentServices).toHaveBeenCalledTimes(1);
  });

  it('should show error state when fetching services fails', async () => {
    (getAllAppointmentServices as jest.Mock).mockRejectedValue(
      new Error('Network error'),
    );

    render(
      <QueryClientProvider client={queryClient}>
        <AllServicesPage />
      </QueryClientProvider>,
    );

    expect(
      screen.getByTestId('all-services-action-data-table-test-id'),
    ).toBeInTheDocument();

    await waitFor(() => {
      expect(
        screen.getByTestId('all-services-sortable-data-table-test-id-error'),
      ).toBeInTheDocument();
    });

    expect(
      screen.getByText('Failed to load services. Please try again.'),
    ).toBeInTheDocument();
    expect(getAllAppointmentServices).toHaveBeenCalledTimes(1);
  });

  it.each([
    {
      scenario:
        'should call deleteAppointmentService and show success notification on successful delete',
      mockDeleteFn: () => Promise.resolve(undefined),
      notificationType: 'success',
      expectedFetchCount: 2,
    },
    {
      scenario:
        'should show an error notification when deleteAppointmentService fails',
      mockDeleteFn: () => Promise.reject(new Error('Network error')),
      notificationType: 'error',
      expectedFetchCount: 1,
    },
  ])(
    '$scenario',
    async ({ mockDeleteFn, notificationType, expectedFetchCount }) => {
      (getAllAppointmentServices as jest.Mock).mockResolvedValue(
        mockAppointmentServices,
      );
      (deleteAppointmentService as jest.Mock).mockImplementation(mockDeleteFn);

      render(
        <QueryClientProvider client={queryClient}>
          <AllServicesPage />
        </QueryClientProvider>,
      );

      await waitFor(() => {
        expect(
          screen.getByText('General Medicine OPD Consultation'),
        ).toBeInTheDocument();
      });

      await userEvent.click(
        screen.getByTestId(
          `delete-service-${mockAppointmentServices[0].uuid}-btn-test-id`,
        ),
      );
      await userEvent.click(screen.getByText('Delete'));

      await waitFor(() => {
        expect(mockAddNotification).toHaveBeenCalledWith(
          expect.objectContaining({ type: notificationType }),
        );
      });

      expect(deleteAppointmentService).toHaveBeenCalledWith(
        mockAppointmentServices[0].uuid,
      );
      expect(getAllAppointmentServices).toHaveBeenCalledTimes(
        expectedFetchCount,
      );
    },
  );

  it('should not fetch services when user lacks ADMIN_TAB_PRIVILEGE', async () => {
    (useUserPrivilege as jest.Mock).mockReturnValue({ userPrivileges: [] });

    render(
      <QueryClientProvider client={queryClient}>
        <AllServicesPage />
      </QueryClientProvider>,
    );

    expect(getAllAppointmentServices).not.toHaveBeenCalled();
  });
});
