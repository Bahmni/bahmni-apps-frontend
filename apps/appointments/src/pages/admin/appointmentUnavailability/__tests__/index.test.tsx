import {
  QueryClient,
  QueryClientProvider,
  useQuery,
} from '@tanstack/react-query';
import {
  render,
  screen,
  act,
  waitFor,
  fireEvent,
} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { axe, toHaveNoViolations } from 'jest-axe';
import {
  mockAppointmentUnavailabilities,
  mockLocations,
  mockAppointmentServices,
  mockProviders,
  mockCurrentUser,
} from '../__mocks__/mocks';
import AppointmentUnavailabilityPage from '../index';

expect.extend(toHaveNoViolations);

class ResizeObserverMock {
  observe() {}
  unobserve() {}
  disconnect() {}
}
global.ResizeObserver = ResizeObserverMock;

if (!document.adoptedStyleSheets) {
  Object.defineProperty(document, 'adoptedStyleSheets', {
    value: [],
    writable: true,
  });
}

global.CSSStyleSheet = class CSSStyleSheet {
  cssRules = [];
  replaceSync() {}
  replace() {
    return Promise.resolve(this);
  }
  insertRule() {
    return 0;
  }
  deleteRule() {}
} as unknown as typeof CSSStyleSheet;

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

jest.mock('@bahmni/design-system', () => {
  const actual = jest.requireActual('@bahmni/design-system');
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const React = require('react');

  const MockDatePicker = ({
    children,
    onChange,
  }: {
    children: React.ReactNode;
    onChange?: (dates: Date[]) => void;
  }) => {
    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const value = e.target.value;
      if (value && onChange) {
        const parts = value.split('/');
        if (parts.length === 3) {
          const [month, day, year] = parts.map(Number);
          const date = new Date(year, month - 1, day);
          if (!isNaN(date.getTime())) {
            onChange([date]);
          }
        }
      }
    };

    return (
      <div data-testid="mock-date-picker">
        {React.Children.map(children, (child: React.ReactElement) => {
          if (React.isValidElement(child)) {
            return React.cloneElement(child, {
              onChange: handleInputChange,
            } as React.HTMLAttributes<HTMLInputElement>);
          }
          return child;
        })}
      </div>
    );
  };

  return {
    ...actual,
    DatePicker: MockDatePicker,
  };
});

const mockCreateAppointmentUnavailability = jest.fn();

jest.mock('@bahmni/services', () => ({
  ...jest.requireActual('@bahmni/services'),
  formatDateTime: jest.fn((date: string) => ({
    formattedResult: date,
  })),
  getAppointmentUnavailabilities: jest.fn(),
  createAppointmentUnavailability: (data: unknown) =>
    mockCreateAppointmentUnavailability(data),
  getAllAppointmentServices: jest.fn(),
  getAllProviders: jest.fn(),
  getCurrentUser: jest.fn(() => Promise.resolve(mockCurrentUser)),
  getProviderLoginLocations: jest.fn(() => Promise.resolve(mockLocations)),
  getUserLoginLocation: jest.fn(() => ({ uuid: 'location-uuid-1' })),
  convertTo24HourFormat: jest.fn((time: string) => {
    const match = time.match(/(\d+):(\d+)\s*(AM|PM)/i);
    if (!match) return null;
    const [, hours, minutes, period] = match;
    let h = parseInt(hours);
    if (period.toUpperCase() === 'PM' && h !== 12) h += 12;
    if (period.toUpperCase() === 'AM' && h === 12) h = 0;
    return `${h.toString().padStart(2, '0')}:${minutes}`;
  }),
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

  it('should render the page title correctly', () => {
    (useQuery as jest.Mock).mockReturnValue({
      data: [],
      isError: false,
      isLoading: false,
    });
    render(wrapper);
    expect(screen.getByText('Service Unavailability')).toBeInTheDocument();
  });

  it('should render Add new button when form is not visible', () => {
    (useQuery as jest.Mock).mockReturnValue({
      data: [],
      isError: false,
      isLoading: false,
    });
    render(wrapper);
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

  it('should show form when Add new button is clicked', async () => {
    (useQuery as jest.Mock).mockReturnValue({
      data: [],
      isError: false,
      isLoading: false,
    });
    render(wrapper);
    await userEvent.click(screen.getByText('Add New'));
    expect(screen.getByText('Add Unavailability')).toBeInTheDocument();
  });

  it('should hide Add new button when form is visible', async () => {
    (useQuery as jest.Mock).mockReturnValue({
      data: [],
      isError: false,
      isLoading: false,
    });
    render(wrapper);
    await userEvent.click(screen.getByText('Add New'));
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

    it('should hide form and invalidate queries on successful form submission', async () => {
      setupMocksWithFormData();
      mockCreateAppointmentUnavailability.mockResolvedValue({});
      render(wrapper);

      await userEvent.click(screen.getByText('Add New'));
      expect(screen.getByText('Add Unavailability')).toBeInTheDocument();

      const startDateInput = screen.getByLabelText(/Start Date/);
      fireEvent.change(startDateInput, { target: { value: '05/25/2026' } });
      fireEvent.blur(startDateInput);

      const startTimeInput = screen.getByLabelText(/Start Time/);
      fireEvent.change(startTimeInput, { target: { value: '09:00' } });

      const endDateInput = screen.getByLabelText(/End Date/);
      fireEvent.change(endDateInput, { target: { value: '05/25/2026' } });
      fireEvent.blur(endDateInput);

      const endTimeInput = screen.getByLabelText(/End Time/);
      fireEvent.change(endTimeInput, { target: { value: '10:00' } });

      await userEvent.click(screen.getByText('Add'));

      await waitFor(() => {
        expect(mockCreateAppointmentUnavailability).toHaveBeenCalled();
      });

      await waitFor(() => {
        expect(mockInvalidateQueries).toHaveBeenCalledWith({
          queryKey: ['appointmentUnavailabilities'],
        });
      });

      await waitFor(() => {
        expect(
          screen.queryByText('Add Unavailability'),
        ).not.toBeInTheDocument();
      });

      await waitFor(() => {
        expect(screen.getByText('Add New')).toBeInTheDocument();
      });
    });
  });

  describe('Accessibility', () => {
    it('passes accessibility tests with unavailabilities data', async () => {
      (useQuery as jest.Mock).mockReturnValue({
        data: mockAppointmentUnavailabilities,
        isError: false,
        isLoading: false,
      });
      const { container } = render(wrapper);
      await act(async () => {
        const results = await axe(container);
        expect(results).toHaveNoViolations();
      });
    });

    it('passes accessibility tests with empty state', async () => {
      (useQuery as jest.Mock).mockReturnValue({
        data: [],
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
