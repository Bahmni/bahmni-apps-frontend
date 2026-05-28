import {
  QueryClient,
  QueryClientProvider,
  useQuery,
} from '@tanstack/react-query';
import { render, screen, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { axe, toHaveNoViolations } from 'jest-axe';
import {
  ADMIN_TAB_PRIVILEGE,
  MANAGE_APPOINTMENT_SERVICES_PRIVILEGE,
  PATHS,
} from '../../../../constants/app';
import { useAppointmentsConfig } from '../../../../providers/appointmentsConfig';
import { mockAppointmentServices } from '../__mocks__/mocks';
import AllServicesPage from '../index';

expect.extend(toHaveNoViolations);

jest.mock('@tanstack/react-query', () => ({
  ...jest.requireActual('@tanstack/react-query'),
  useQuery: jest.fn(),
}));

const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
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

jest.mock('@bahmni/widgets', () => ({
  ...jest.requireActual('@bahmni/widgets'),
  useNotification: jest.fn(() => ({ addNotification: jest.fn() })),
  useUserPrivilege: jest.fn(),
}));

const mockUseUserPrivilege =
  jest.requireMock('@bahmni/widgets').useUserPrivilege;

describe('AllServicesPage', () => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });

  const wrapper = (
    <QueryClientProvider client={queryClient}>
      <AllServicesPage />
    </QueryClientProvider>
  );

  beforeEach(() => {
    jest.clearAllMocks();
    mockNavigate.mockClear();
    mockUseUserPrivilege.mockReturnValue({
      userPrivileges: [{ name: ADMIN_TAB_PRIVILEGE }],
    });
  });

  afterEach(() => {
    queryClient.clear();
  });

  it.each([
    {
      scenario: 'loading state while services are being fetched',
      mockValues: { data: null, isError: false, isLoading: true },
      expectedTestId: 'all-services-sortable-data-table-test-id-skeleton',
      expectedTexts: [],
    },
    {
      scenario: 'error state when fetching services fails',
      mockValues: { data: null, isError: true, isLoading: false },
      expectedTestId: 'all-services-sortable-data-table-test-id-error',
      expectedTexts: ['Failed to load services. Please try again.'],
    },
    {
      scenario: 'empty state when no services exist',
      mockValues: { data: [], isError: false, isLoading: false },
      expectedTestId: 'all-services-sortable-data-table-test-id-empty',
      expectedTexts: ['No services found.'],
    },
  ])(
    'should show $scenario',
    ({ mockValues, expectedTestId, expectedTexts }) => {
      (useQuery as jest.Mock).mockReturnValue(mockValues);
      render(wrapper);
      expect(
        screen.getByTestId('all-services-action-data-table-test-id'),
      ).toBeInTheDocument();
      expect(screen.getByTestId(expectedTestId)).toBeInTheDocument();
      expectedTexts.forEach((text) =>
        expect(screen.getByText(text)).toBeInTheDocument(),
      );
    },
  );

  it('should render all services in the table', () => {
    (useQuery as jest.Mock).mockReturnValue({
      data: mockAppointmentServices,
      isError: false,
      isLoading: false,
    });
    render(wrapper);
    expect(
      screen.getByTestId('all-services-sortable-data-table-test-id'),
    ).toBeInTheDocument();
    expect(
      screen.getByText('General Medicine OPD Consultation'),
    ).toBeInTheDocument();
    expect(screen.getByText('ENT OPD Consultation')).toBeInTheDocument();
    expect(screen.getByText('General Consultation')).toBeInTheDocument();
    expect(screen.getByText('General OPD')).toBeInTheDocument();
    expect(screen.getByText('General Medicine')).toBeInTheDocument();
    expect(screen.getByText('15')).toBeInTheDocument();
    expect(screen.getByText('30')).toBeInTheDocument();
  });

  it('should render missing data gracefully', () => {
    (useQuery as jest.Mock).mockReturnValue({
      data: [mockAppointmentServices[2]],
      isError: false,
      isLoading: false,
    });
    render(wrapper);
    const rowId = mockAppointmentServices[2].uuid;
    ['location', 'speciality', 'durationMins', 'description'].forEach(
      (field) => {
        expect(
          screen.getByTestId(`table-cell-${rowId}-${field}`),
        ).toHaveTextContent('-');
      },
    );
  });

  it('should use KNOWN_FIELDS as default when serviceTableFields is not configured', () => {
    jest.mocked(useAppointmentsConfig).mockReturnValue({
      appointmentsConfig: null,
      isLoading: false,
      error: null,
    });
    (useQuery as jest.Mock).mockReturnValue({
      data: mockAppointmentServices,
      isError: false,
      isLoading: false,
    });
    render(wrapper);
    [
      'Service Name',
      'Location',
      'Speciality',
      'Duration (mins)',
      'Description',
    ].forEach((header) => expect(screen.getByText(header)).toBeInTheDocument());
  });

  it('should render attribute columns from config', () => {
    jest.mocked(useAppointmentsConfig).mockReturnValue({
      appointmentsConfig: {
        serviceTableFields: ['name', 'serviceType'],
      },
      isLoading: false,
      error: null,
    });
    (useQuery as jest.Mock).mockReturnValue({
      data: mockAppointmentServices,
      isError: false,
      isLoading: false,
    });
    render(wrapper);
    expect(screen.getAllByText('OPD')).toHaveLength(2);
    const rowId = mockAppointmentServices[1].uuid;
    expect(
      screen.getByTestId(`table-cell-${rowId}-serviceType`),
    ).toHaveTextContent('OPD');
  });

  it('should close the delete modal when cancel is clicked', async () => {
    mockUseUserPrivilege.mockReturnValue({
      userPrivileges: [
        { name: ADMIN_TAB_PRIVILEGE },
        { name: MANAGE_APPOINTMENT_SERVICES_PRIVILEGE },
      ],
    });
    (useQuery as jest.Mock).mockReturnValue({
      data: mockAppointmentServices,
      isError: false,
      isLoading: false,
    });
    render(wrapper);

    await userEvent.click(
      screen.getByTestId(
        `delete-service-${mockAppointmentServices[0].uuid}-btn-test-id`,
      ),
    );
    expect(
      screen.getByTestId('delete-service-modal-test-id'),
    ).toBeInTheDocument();
    await userEvent.click(screen.getByText('Cancel'));

    expect(
      screen.queryByTestId('delete-service-modal-test-id'),
    ).not.toBeInTheDocument();
  });

  it('should navigate to ADMIN_ADD_SERVICE when the add button is clicked', async () => {
    mockUseUserPrivilege.mockReturnValue({
      userPrivileges: [
        { name: ADMIN_TAB_PRIVILEGE },
        { name: MANAGE_APPOINTMENT_SERVICES_PRIVILEGE },
      ],
    });
    (useQuery as jest.Mock).mockReturnValue({
      data: [],
      isError: false,
      isLoading: false,
    });
    render(wrapper);

    await userEvent.click(
      screen.getByTestId(
        'all-services-action-data-table-action-button-test-id',
      ),
    );

    expect(mockNavigate).toHaveBeenCalledWith(PATHS.ADMIN_ADD_SERVICE);
  });

  describe('Delete button privilege', () => {
    it.each([
      {
        scenario: 'disabled when user lacks manage privilege',
        userPrivileges: [{ name: ADMIN_TAB_PRIVILEGE }],
        assertButton: (btn: HTMLElement) => expect(btn).toBeDisabled(),
      },
      {
        scenario: 'enabled when user has the manage privilege',
        userPrivileges: [
          { name: ADMIN_TAB_PRIVILEGE },
          { name: MANAGE_APPOINTMENT_SERVICES_PRIVILEGE },
        ],
        assertButton: (btn: HTMLElement) => expect(btn).not.toBeDisabled(),
      },
    ])(
      'should render delete button $scenario',
      ({ userPrivileges, assertButton }) => {
        mockUseUserPrivilege.mockReturnValue({ userPrivileges });
        (useQuery as jest.Mock).mockReturnValue({
          data: mockAppointmentServices,
          isError: false,
          isLoading: false,
        });
        render(wrapper);
        const deleteButtons = screen.getAllByTestId(/^delete-service-/);
        expect(deleteButtons).toHaveLength(mockAppointmentServices.length);
        deleteButtons.forEach(assertButton);
      },
    );
  });

  describe('View privilege', () => {
    it.each([
      {
        scenario: 'no-privilege message when user lacks ADMIN_TAB_PRIVILEGE',
        userPrivileges: [],
        queryReturnValue: { data: undefined, isError: false, isLoading: false },
        visibleTestId: 'all-appointment-service-no-view-privilege-test-id',
        hiddenTestId: 'all-appointment-service-page-test-id',
      },
      {
        scenario: 'services table when user has ADMIN_TAB_PRIVILEGE',
        userPrivileges: [{ name: ADMIN_TAB_PRIVILEGE }],
        queryReturnValue: {
          data: mockAppointmentServices,
          isError: false,
          isLoading: false,
        },
        visibleTestId: 'all-appointment-service-page-test-id',
        hiddenTestId: 'all-appointment-service-no-view-privilege-test-id',
      },
    ])(
      'should show $scenario',
      ({ userPrivileges, queryReturnValue, visibleTestId, hiddenTestId }) => {
        mockUseUserPrivilege.mockReturnValue({ userPrivileges });
        (useQuery as jest.Mock).mockReturnValue(queryReturnValue);
        render(wrapper);
        expect(screen.getByTestId(visibleTestId)).toBeInTheDocument();
        expect(screen.queryByTestId(hiddenTestId)).not.toBeInTheDocument();
      },
    );
  });

  describe('Snapshot', () => {
    it('should match snapshot with services data', () => {
      (useQuery as jest.Mock).mockReturnValue({
        data: mockAppointmentServices,
        isError: false,
        isLoading: false,
      });
      const { container } = render(wrapper);
      expect(container).toMatchSnapshot();
    });
  });

  describe('Accessibility', () => {
    it('passes accessibility tests with services data', async () => {
      (useQuery as jest.Mock).mockReturnValue({
        data: mockAppointmentServices,
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
