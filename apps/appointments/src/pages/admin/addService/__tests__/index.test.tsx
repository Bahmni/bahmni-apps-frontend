import { AppointmentService, createAppointmentService } from '@bahmni/services';
import {
  QueryClient,
  QueryClientProvider,
  useQuery,
} from '@tanstack/react-query';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MANAGE_APPOINTMENT_SERVICES_PRIVILEGE } from '../../../../constants/app';
import AddServicePage from '../index';
import { useAddServiceStore } from '../stores';
import { defaultRow } from './__mocks__/AddServicePageMocks';

jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
}));

jest.mock('@bahmni/services', () => ({
  ...jest.requireActual('@bahmni/services'),
  createAppointmentService: jest.fn(),
}));

jest.mock('@bahmni/widgets', () => ({
  ...jest.requireActual('@bahmni/widgets'),
  useNotification: jest.fn(() => ({ addNotification: mockAddNotification })),
  useUserPrivilege: jest.fn(),
}));

const mockUseUserPrivilege =
  jest.requireMock('@bahmni/widgets').useUserPrivilege;

jest.mock('@tanstack/react-query', () => ({
  ...jest.requireActual('@tanstack/react-query'),
  useQuery: jest.fn(),
}));

jest.mock('../stores', () => ({
  useAddServiceStore: Object.assign(jest.fn(), { getState: jest.fn() }),
}));

const mockNavigate = jest.fn();
const mockAddNotification = jest.fn();
const mockValidate = jest.fn();

const defaultStoreState = {
  name: 'Test Service',
  nameError: null,
  description: '',
  durationMins: null,
  specialityUuid: null,
  locationUuid: null,
  availabilityRows: [defaultRow],
  validate: mockValidate,
  setName: jest.fn(),
  setDescription: jest.fn(),
  setDurationMins: jest.fn(),
  setSpecialityUuid: jest.fn(),
  setLocationUuid: jest.fn(),
  updateAvailabilityRow: jest.fn(),
  toggleDayOfWeek: jest.fn(),
  addAvailabilityRow: jest.fn(),
  removeAvailabilityRow: jest.fn(),
  reset: jest.fn(),
};

describe('AddServicePage', () => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });

  beforeEach(() => {
    jest.clearAllMocks();
    jest.mocked(useAddServiceStore).mockReturnValue(defaultStoreState);
    jest.mocked(useAddServiceStore.getState).mockReturnValue(defaultStoreState);
    (useQuery as jest.Mock).mockReturnValue({
      data: undefined,
      isLoading: false,
      isError: false,
    });
    mockUseUserPrivilege.mockReturnValue({
      userPrivileges: [{ name: MANAGE_APPOINTMENT_SERVICES_PRIVILEGE }],
    });
  });

  const renderPage = () =>
    render(
      <QueryClientProvider client={queryClient}>
        <AddServicePage />
      </QueryClientProvider>,
    );

  it('should render no-privilege message when user lacks manage services privilege', () => {
    mockUseUserPrivilege.mockReturnValue({ userPrivileges: [] });
    renderPage();

    expect(
      screen.getByTestId('add-appointment-service-no-manage-privilege-test-id'),
    ).toBeInTheDocument();
    expect(
      screen.queryByTestId('add-appointment-service-page-test-id'),
    ).not.toBeInTheDocument();
    expect(screen.queryByTestId('save-btn-test-id')).not.toBeInTheDocument();
  });

  it('should render page with title, service details, availability section, and action buttons', () => {
    renderPage();

    expect(
      screen.getByTestId('add-appointment-service-page-test-id'),
    ).toBeInTheDocument();
    expect(
      screen.getByTestId('add-new-appointment-service-title-test-id'),
    ).toBeInTheDocument();
    expect(
      screen.getByTestId('add-appointment-details-section-test-id'),
    ).toBeInTheDocument();
    expect(
      screen.getByTestId('add-appointment-availability-section-test-id'),
    ).toBeInTheDocument();
    expect(screen.getByTestId('back-btn-test-id')).toBeInTheDocument();
    expect(screen.getByTestId('save-btn-test-id')).toBeInTheDocument();
  });

  it('should navigate to ADMIN_SERVICES when Back is clicked', async () => {
    renderPage();

    await userEvent.click(screen.getByTestId('back-btn-test-id'));

    expect(mockNavigate).toHaveBeenCalledWith('/appointments/admin/services');
  });

  it('should not call createAppointmentService when validation fails', async () => {
    mockValidate.mockReturnValue(false);
    renderPage();

    await userEvent.click(screen.getByTestId('save-btn-test-id'));

    expect(createAppointmentService).not.toHaveBeenCalled();
  });

  it('should call createAppointmentService with correct request on success', async () => {
    mockValidate.mockReturnValue(true);
    jest
      .mocked(createAppointmentService)
      .mockResolvedValue({} as AppointmentService);
    renderPage();

    await userEvent.click(screen.getByTestId('save-btn-test-id'));

    expect(createAppointmentService).toHaveBeenCalledWith({
      name: 'Test Service',
      weeklyAvailability: [
        {
          dayOfWeek: 'MONDAY',
          startTime: '09:00:00',
          endTime: '10:00:00',
          maxAppointmentsLimit: null,
        },
      ],
    });
  });

  it.each([
    {
      scenario: 'success',
      setupMock: () =>
        jest
          .mocked(createAppointmentService)
          .mockResolvedValue({} as AppointmentService),
      expectedNotification: {
        type: 'success',
        title: 'Service Created',
        message: 'Service created successfully.',
      },
    },
    {
      scenario: 'error',
      setupMock: () =>
        jest
          .mocked(createAppointmentService)
          .mockRejectedValue(new Error('Network error')),
      expectedNotification: {
        type: 'error',
        title: 'Save Failed',
        message: 'Failed to create service. Please try again.',
      },
    },
  ])(
    'should show $scenario notification after save',
    async ({ setupMock, expectedNotification }) => {
      mockValidate.mockReturnValue(true);
      setupMock();
      renderPage();

      await userEvent.click(screen.getByTestId('save-btn-test-id'));

      expect(mockAddNotification).toHaveBeenCalledWith(
        expect.objectContaining(expectedNotification),
      );
    },
  );

  it('should include optional fields in request only when provided', async () => {
    mockValidate.mockReturnValue(true);
    jest
      .mocked(createAppointmentService)
      .mockResolvedValue({} as AppointmentService);
    jest.mocked(useAddServiceStore.getState).mockReturnValue({
      ...defaultStoreState,
      description: 'A description',
      durationMins: 30,
      specialityUuid: 'spec-uuid-1',
      locationUuid: 'loc-uuid-1',
    });
    renderPage();

    await userEvent.click(screen.getByTestId('save-btn-test-id'));

    expect(createAppointmentService).toHaveBeenCalledWith(
      expect.objectContaining({
        description: 'A description',
        durationMins: 30,
        specialityUuid: 'spec-uuid-1',
        locationUuid: 'loc-uuid-1',
      }),
    );
  });

  it('should expand each day in availabilityRows into a separate weeklyAvailability entry', async () => {
    mockValidate.mockReturnValue(true);
    jest
      .mocked(createAppointmentService)
      .mockResolvedValue({} as AppointmentService);
    jest.mocked(useAddServiceStore.getState).mockReturnValue({
      ...defaultStoreState,
      availabilityRows: [
        {
          ...defaultRow,
          daysOfWeek: ['TUESDAY', 'WEDNESDAY'],
          startTime: '08:30',
          endTime: '17:00',
          endMeridiem: 'PM' as const,
          maxLoad: 10,
        },
      ],
    });
    renderPage();

    await userEvent.click(screen.getByTestId('save-btn-test-id'));

    const call = jest.mocked(createAppointmentService).mock.calls[0][0];
    expect(call.weeklyAvailability).toEqual([
      {
        dayOfWeek: 'TUESDAY',
        startTime: '08:30:00',
        endTime: '17:00:00',
        maxAppointmentsLimit: 10,
      },
      {
        dayOfWeek: 'WEDNESDAY',
        startTime: '08:30:00',
        endTime: '17:00:00',
        maxAppointmentsLimit: 10,
      },
    ]);
  });
});
