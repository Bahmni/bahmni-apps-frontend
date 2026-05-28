import {
  AppointmentService,
  createAppointmentService,
  getAllAppointmentServices,
  getAppointmentLocations,
  getAppointmentSpecialities,
} from '@bahmni/services';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MANAGE_APPOINTMENT_SERVICES_PRIVILEGE } from '../../../../constants/app';
import AddServicePage from '../index';
import { useAddServiceStore } from '../stores';

jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
}));

jest.mock('@bahmni/services', () => ({
  ...jest.requireActual('@bahmni/services'),
  createAppointmentService: jest.fn(),
  getAllAppointmentServices: jest.fn(),
  getAppointmentLocations: jest.fn(),
  getAppointmentSpecialities: jest.fn(),
}));

const mockAddNotification = jest.fn();

jest.mock('@bahmni/widgets', () => ({
  ...jest.requireActual('@bahmni/widgets'),
  useNotification: jest.fn(() => ({ addNotification: mockAddNotification })),
  useUserPrivilege: jest.fn(),
}));

const mockUseUserPrivilege =
  jest.requireMock('@bahmni/widgets').useUserPrivilege;

const mockNavigate = jest.fn();

const fillAvailabilityTimes = (startTime: string, endTime: string) => {
  act(() => {
    const { availabilityRows, updateAvailabilityRow } =
      useAddServiceStore.getState();
    updateAvailabilityRow(availabilityRows[0].id, 'startTime', startTime);
    updateAvailabilityRow(availabilityRows[0].id, 'endTime', endTime);
  });
};

describe('AddServicePage Integration', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false, staleTime: 0 } },
    });
    jest.clearAllMocks();
    useAddServiceStore.getState().reset();
    jest.mocked(getAllAppointmentServices).mockResolvedValue([]);
    jest.mocked(getAppointmentLocations).mockResolvedValue({ results: [] });
    jest.mocked(getAppointmentSpecialities).mockResolvedValue([]);
    mockUseUserPrivilege.mockReturnValue({
      userPrivileges: [{ name: MANAGE_APPOINTMENT_SERVICES_PRIVILEGE }],
    });
  });

  afterEach(() => {
    queryClient.clear();
  });

  const renderPage = () =>
    render(
      <QueryClientProvider client={queryClient}>
        <AddServicePage />
      </QueryClientProvider>,
    );

  it('should show validation errors for all required fields when saving an empty form', async () => {
    renderPage();

    await userEvent.click(screen.getByTestId('save-btn-test-id'));

    expect(screen.getByText('Service name is required')).toBeInTheDocument();
    expect(screen.getByText('Start time is required')).toBeInTheDocument();
    expect(screen.getByText('End time is required')).toBeInTheDocument();
    expect(createAppointmentService).not.toHaveBeenCalled();
  });

  it('should call createAppointmentService with correct payload and show success notification', async () => {
    jest
      .mocked(createAppointmentService)
      .mockResolvedValue({} as AppointmentService);
    renderPage();

    fireEvent.change(
      screen.getByTestId('add-appointment-details-service-name-test-id'),
      { target: { value: 'General Consultation' } },
    );
    fillAvailabilityTimes('09:00', '17:00');

    await userEvent.click(screen.getByTestId('save-btn-test-id'));

    await waitFor(() => {
      expect(mockAddNotification).toHaveBeenCalledWith(
        expect.objectContaining({ type: 'success', title: 'Service Created' }),
      );
    });

    const call = jest.mocked(createAppointmentService).mock.calls[0][0];
    expect(call.name).toBe('General Consultation');
    expect(call.weeklyAvailability).toHaveLength(7);
    expect(call.weeklyAvailability![0].startTime).toBe('09:00:00');
    expect(call.weeklyAvailability![0].endTime).toBe('17:00:00');
  });

  it('should show error notification when createAppointmentService fails', async () => {
    jest
      .mocked(createAppointmentService)
      .mockRejectedValue(new Error('Network error'));
    renderPage();

    fireEvent.change(
      screen.getByTestId('add-appointment-details-service-name-test-id'),
      { target: { value: 'General Consultation' } },
    );
    fillAvailabilityTimes('09:00', '17:00');

    await userEvent.click(screen.getByTestId('save-btn-test-id'));

    await waitFor(() => {
      expect(mockAddNotification).toHaveBeenCalledWith(
        expect.objectContaining({ type: 'error', title: 'Save Failed' }),
      );
    });
  });

  it('should navigate to admin services when Back is clicked', async () => {
    renderPage();

    await userEvent.click(screen.getByTestId('back-btn-test-id'));

    expect(mockNavigate).toHaveBeenCalledWith('/appointments/admin/services');
  });
});
