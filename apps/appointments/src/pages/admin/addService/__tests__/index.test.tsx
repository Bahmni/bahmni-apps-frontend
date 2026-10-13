import { AppointmentService, createAppointmentService } from '@bahmni/services';
import {
  QueryClient,
  QueryClientProvider,
  useQuery,
} from '@tanstack/react-query';
import { act, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MANAGE_APPOINTMENT_SERVICES_PRIVILEGE } from '../../../../constants/app';
import { useServiceStore } from '../../stores';
import AddServicePage from '../index';
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

jest.mock('../../stores', () => ({
  useServiceStore: Object.assign(jest.fn(), { getState: jest.fn() }),
}));

const mockNavigate = jest.fn();
const mockAddNotification = jest.fn();
const mockValidate = jest.fn();
const mockHasUnsavedChanges = jest.fn();
const mockReset = jest.fn();

const isLeaveModalVisible = () =>
  screen
    .getByTestId('add-service-unsaved-changes-modal')
    .classList.contains('is-visible');

const defaultStoreState = {
  name: 'Test Service',
  nameError: null,
  description: '',
  durationMins: null,
  specialityUuid: null,
  locationUuid: null,
  availabilityRows: [defaultRow],
  validate: mockValidate,
  hasUnsavedChanges: mockHasUnsavedChanges,
  setName: jest.fn(),
  setDescription: jest.fn(),
  setDurationMins: jest.fn(),
  setSpecialityUuid: jest.fn(),
  setLocationUuid: jest.fn(),
  updateAvailabilityRow: jest.fn(),
  toggleDayOfWeek: jest.fn(),
  addAvailabilityRow: jest.fn(),
  removeAvailabilityRow: jest.fn(),
  reset: mockReset,
};

describe('AddServicePage', () => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });

  beforeEach(() => {
    jest.clearAllMocks();
    window.history.replaceState(null, '');
    jest
      .mocked(useServiceStore)
      .mockImplementation(((
        selector?: (state: typeof defaultStoreState) => unknown,
      ) =>
        selector ? selector(defaultStoreState) : defaultStoreState) as never);
    jest.mocked(useServiceStore.getState).mockReturnValue(defaultStoreState);
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

  it('should not render the form when user has only the legacy manage services privilege', () => {
    mockUseUserPrivilege.mockReturnValue({
      userPrivileges: [{ name: 'Manage Appointment Services' }],
    });
    renderPage();

    expect(
      screen.getByTestId('add-appointment-service-no-manage-privilege-test-id'),
    ).toBeInTheDocument();
    expect(
      screen.queryByTestId('add-appointment-service-page-test-id'),
    ).not.toBeInTheDocument();
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

  describe('Leaving the page', () => {
    const ADMIN_SERVICES = '/appointments/admin/services';
    const originalLocation = window.location;
    const mockLocationAssign = jest.fn();
    const mockLocationReplace = jest.fn();

    beforeEach(() => {
      Object.defineProperty(window, 'location', {
        configurable: true,
        value: {
          ...originalLocation,
          assign: mockLocationAssign,
          replace: mockLocationReplace,
        },
      });
    });

    afterEach(() => {
      Object.defineProperty(window, 'location', {
        configurable: true,
        value: originalLocation,
      });
    });

    const clickBack = () =>
      userEvent.click(screen.getByTestId('back-btn-test-id'));
    const clickAdminBreadcrumb = () =>
      userEvent.click(screen.getByRole('link', { name: 'Admin' }));
    const clickHomeBreadcrumb = () =>
      userEvent.click(screen.getByRole('link', { name: 'Home' }));
    const pressBrowserBack = async () =>
      act(async () => {
        window.dispatchEvent(new PopStateEvent('popstate'));
      });

    it('should link the Admin breadcrumb to the app-prefixed All Services path', () => {
      renderPage();

      expect(screen.getByRole('link', { name: 'Admin' })).toHaveAttribute(
        'href',
        '/bahmni-v2/appointments/admin/services',
      );
    });

    it.each([
      { trigger: 'Back button', leave: clickBack },
      { trigger: 'Admin breadcrumb', leave: clickAdminBreadcrumb },
    ])(
      'should navigate to All Services without confirmation from the $trigger when the form is untouched',
      async ({ leave }) => {
        mockHasUnsavedChanges.mockReturnValue(false);
        renderPage();

        await leave();

        expect(isLeaveModalVisible()).toBe(false);
        expect(mockNavigate).toHaveBeenCalledWith(ADMIN_SERVICES, {
          replace: false,
        });
      },
    );

    it('should go Home without confirmation from the Home breadcrumb when the form is untouched', async () => {
      mockHasUnsavedChanges.mockReturnValue(false);
      renderPage();

      await clickHomeBreadcrumb();

      expect(isLeaveModalVisible()).toBe(false);
      expect(mockLocationAssign).toHaveBeenCalledWith('/bahmni-v2/home');
    });

    it.each([
      { trigger: 'Back button', leave: clickBack },
      { trigger: 'Admin breadcrumb', leave: clickAdminBreadcrumb },
      { trigger: 'Home breadcrumb', leave: clickHomeBreadcrumb },
      { trigger: 'browser Back button', leave: pressBrowserBack },
    ])(
      'should ask for confirmation from the $trigger when the form has changes',
      async ({ leave }) => {
        mockHasUnsavedChanges.mockReturnValue(true);
        renderPage();

        await leave();

        expect(isLeaveModalVisible()).toBe(true);
        expect(screen.getByText('Unsaved changes')).toBeInTheDocument();
        expect(
          screen.getByText(
            'You have unsaved changes. Leaving this page now will discard them.',
          ),
        ).toBeInTheDocument();
        expect(mockNavigate).not.toHaveBeenCalled();
        expect(mockLocationAssign).not.toHaveBeenCalled();
        expect(mockLocationReplace).not.toHaveBeenCalled();
        expect(mockReset).not.toHaveBeenCalled();
      },
    );

    it.each([
      {
        trigger: 'Back button',
        leave: clickBack,
        assertLeft: () =>
          expect(mockNavigate).toHaveBeenCalledWith(ADMIN_SERVICES, {
            replace: true,
          }),
      },
      {
        trigger: 'Admin breadcrumb',
        leave: clickAdminBreadcrumb,
        assertLeft: () =>
          expect(mockNavigate).toHaveBeenCalledWith(ADMIN_SERVICES, {
            replace: true,
          }),
      },
      {
        trigger: 'Home breadcrumb',
        leave: clickHomeBreadcrumb,
        assertLeft: () =>
          expect(mockLocationReplace).toHaveBeenCalledWith('/bahmni-v2/home'),
      },
      {
        trigger: 'browser Back button',
        leave: pressBrowserBack,
        assertLeft: () => expect(window.history.go).toHaveBeenCalledWith(-2),
      },
    ])(
      'should clear the form and leave when Leave is clicked after the $trigger',
      async ({ leave, assertLeft }) => {
        const goSpy = jest
          .spyOn(window.history, 'go')
          .mockImplementation(() => {});
        mockHasUnsavedChanges.mockReturnValue(true);
        renderPage();

        await leave();
        await userEvent.click(screen.getByText('Leave'));

        expect(mockReset).toHaveBeenCalledTimes(1);
        assertLeft();
        goSpy.mockRestore();
      },
    );

    it('should keep the form and stay on the page when Stay is clicked', async () => {
      mockHasUnsavedChanges.mockReturnValue(true);
      renderPage();

      await clickBack();
      await userEvent.click(screen.getByText('Stay'));

      expect(isLeaveModalVisible()).toBe(false);
      expect(mockReset).not.toHaveBeenCalled();
      expect(mockNavigate).not.toHaveBeenCalled();
    });

    it('should clear the form when the page unmounts', () => {
      const { unmount } = renderPage();

      unmount();

      expect(mockReset).toHaveBeenCalledTimes(1);
    });
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
    jest.mocked(useServiceStore.getState).mockReturnValue({
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
    jest.mocked(useServiceStore.getState).mockReturnValue({
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
