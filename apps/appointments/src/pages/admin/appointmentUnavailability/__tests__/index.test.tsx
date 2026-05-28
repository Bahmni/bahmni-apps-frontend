import {
  QueryClient,
  QueryClientProvider,
  useQuery,
} from '@tanstack/react-query';
import { render, screen, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { axe, toHaveNoViolations } from 'jest-axe';
import {
  mockAppointmentUnavailabilities,
  mockLocations,
  mockAppointmentServices,
  mockProviders,
  mockCurrentUser,
} from '../__mocks__/unavailabilityMock';
import AppointmentUnavailabilityPage from '../index';

expect.extend(toHaveNoViolations);

const mockInvalidateQueries = jest.fn();

jest.mock('@tanstack/react-query', () => ({
  ...jest.requireActual('@tanstack/react-query'),
  useQuery: jest.fn(),
  useQueryClient: jest.fn(() => ({
    invalidateQueries: mockInvalidateQueries,
  })),
}));

jest.mock('@bahmni/widgets', () => ({
  ...jest.requireActual('@bahmni/widgets'),
  useNotification: jest.fn(() => ({ addNotification: jest.fn() })),
  useUserPrivilege: jest.fn(() => ({
    userPrivileges: [
      'Get Appointment Unavailability',
      'Add Appointment Unavailability',
    ],
  })),
}));

const mockCreateAppointmentUnavailability = jest.fn();

jest.mock('@bahmni/services', () => ({
  ...jest.requireActual('@bahmni/services'),
  formatDateTime: jest.fn(
    (dateTime: string, _t?: unknown, includeTime?: boolean) => ({
      formattedResult: includeTime
        ? `${dateTime.split('T')[0]} ${dateTime.split('T')[1] || ''}`
        : dateTime,
    }),
  ),
  getAppointmentUnavailabilities: jest.fn(),
  createAppointmentUnavailability: (data: unknown) =>
    mockCreateAppointmentUnavailability(data),
  getAllAppointmentServices: jest.fn(),
  getAllProviders: jest.fn(),
  getCurrentUser: jest.fn(() => Promise.resolve(mockCurrentUser)),
  getProviderLoginLocations: jest.fn(() => Promise.resolve(mockLocations)),
  getUserLoginLocation: jest.fn(() => ({ uuid: 'location-uuid-1' })),
  hasPrivilege: jest.fn(() => true),
  BAHMNI_HOME_PATH: '/bahmni/home',
}));

describe('AppointmentUnavailabilityPage', () => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });

  const wrapper = (
    <QueryClientProvider client={queryClient}>
      <AppointmentUnavailabilityPage />
    </QueryClientProvider>
  );

  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(() => {
    queryClient.clear();
  });

  it.each([
    {
      scenario: 'error state when fetching unavailabilities fails',
      mockValues: { data: null, isError: true, isLoading: false },
      expectedTexts: [
        'Failed to load Unavailability periods. Please try again.',
      ],
    },
    {
      scenario: 'empty state when no unavailabilities exist',
      mockValues: { data: [], isError: false, isLoading: false },
      expectedTexts: ['No Service Unavailabilities found'],
    },
  ])('should show $scenario', ({ mockValues, expectedTexts }) => {
    (useQuery as jest.Mock).mockReturnValue(mockValues);
    render(wrapper);
    expect(
      screen.getByTestId('appointment-unavailability-page-test-id'),
    ).toBeInTheDocument();
    expectedTexts.forEach((text) =>
      expect(screen.getByText(text)).toBeInTheDocument(),
    );
  });

  it('should render page title and Add New button', () => {
    (useQuery as jest.Mock).mockReturnValue({
      data: [],
      isError: false,
      isLoading: false,
    });
    render(wrapper);
    expect(screen.getByText('Service Unavailability')).toBeInTheDocument();
    expect(screen.getByText('Add New')).toBeInTheDocument();
  });

  it('should render all unavailabilities in the table', () => {
    (useQuery as jest.Mock).mockReturnValue({
      data: mockAppointmentUnavailabilities,
      isError: false,
      isLoading: false,
    });
    render(wrapper);
    expect(screen.getAllByText('General OPD').length).toBeGreaterThan(0);
    expect(screen.getByText('ENT Ward')).toBeInTheDocument();
    expect(
      screen.getAllByText('General Medicine OPD Consultation').length,
    ).toBeGreaterThan(0);
    expect(screen.getByText('Dr. John Smith')).toBeInTheDocument();
  });

  it('should display "All" for null service and provider names', () => {
    (useQuery as jest.Mock).mockReturnValue({
      data: mockAppointmentUnavailabilities,
      isError: false,
      isLoading: false,
    });
    render(wrapper);
    const allTexts = screen.getAllByText('All');
    expect(allTexts.length).toBeGreaterThanOrEqual(2);
  });

  it('should show form and hide Add New button when Add New is clicked', async () => {
    (useQuery as jest.Mock).mockReturnValue({
      data: [],
      isError: false,
      isLoading: false,
    });
    render(wrapper);
    await userEvent.click(screen.getByText('Add New'));
    expect(screen.getByText('Add Unavailability')).toBeInTheDocument();
    expect(screen.queryByText('Add New')).not.toBeInTheDocument();
  });

  it('should render table headers correctly', () => {
    (useQuery as jest.Mock).mockReturnValue({
      data: mockAppointmentUnavailabilities,
      isError: false,
      isLoading: false,
    });
    render(wrapper);
    expect(screen.getByText('Start Date and Time')).toBeInTheDocument();
    expect(screen.getByText('End Date and Time')).toBeInTheDocument();
    expect(screen.getByText('Location')).toBeInTheDocument();
    expect(screen.getByText('Service Unavailable')).toBeInTheDocument();
    expect(screen.getByText('Provider Unavailable')).toBeInTheDocument();
  });

  describe('Snapshot', () => {
    it('should match snapshot with unavailabilities data', () => {
      (useQuery as jest.Mock).mockReturnValue({
        data: mockAppointmentUnavailabilities,
        isError: false,
        isLoading: false,
      });
      const { container } = render(wrapper);
      expect(container).toMatchSnapshot();
    });

    it('should match snapshot with empty state', () => {
      (useQuery as jest.Mock).mockReturnValue({
        data: [],
        isError: false,
        isLoading: false,
      });
      const { container } = render(wrapper);
      expect(container).toMatchSnapshot();
    });
  });

  describe('Form Callbacks', () => {
    const setupMocksWithFormData = () => {
      (useQuery as jest.Mock).mockImplementation(({ queryKey }) => {
        if (queryKey[0] === 'appointmentUnavailabilities') {
          return { data: [], isError: false, isLoading: false };
        }
        if (queryKey[0] === 'providerLoginLocations') {
          return { data: mockLocations, isError: false, isLoading: false };
        }
        if (queryKey[0] === 'appointmentServices') {
          return {
            data: mockAppointmentServices,
            isError: false,
            isLoading: false,
          };
        }
        if (queryKey[0] === 'providers') {
          return { data: mockProviders, isError: false, isLoading: false };
        }
        return { data: [], isError: false, isLoading: false };
      });
    };

    it('should hide form when Cancel button is clicked', async () => {
      (useQuery as jest.Mock).mockReturnValue({
        data: [],
        isError: false,
        isLoading: false,
      });
      render(wrapper);
      await userEvent.click(screen.getByText('Add New'));
      expect(screen.getByText('Add Unavailability')).toBeInTheDocument();
      await userEvent.click(screen.getByText('Cancel'));
      expect(screen.queryByText('Add Unavailability')).not.toBeInTheDocument();
      expect(screen.getByText('Add New')).toBeInTheDocument();
    });

    it('should render form with all required fields when Add New is clicked', async () => {
      setupMocksWithFormData();
      render(wrapper);

      await userEvent.click(screen.getByText('Add New'));
      expect(screen.getByText('Add Unavailability')).toBeInTheDocument();
      expect(screen.getByLabelText(/Start Date/)).toBeInTheDocument();
      expect(screen.getByLabelText(/Start Time/)).toBeInTheDocument();
      expect(screen.getByLabelText(/End Date/)).toBeInTheDocument();
      expect(screen.getByLabelText(/End Time/)).toBeInTheDocument();
      expect(screen.getByText('Add')).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it.each([
      {
        scenario: 'with unavailabilities data',
        data: mockAppointmentUnavailabilities,
      },
      { scenario: 'with empty state', data: [] },
    ])('passes accessibility tests $scenario', async ({ data }) => {
      (useQuery as jest.Mock).mockReturnValue({
        data,
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
