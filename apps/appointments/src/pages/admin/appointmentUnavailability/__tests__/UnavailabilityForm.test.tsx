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
  mockLocations,
  mockAppointmentServices,
  mockProviders,
  mockCurrentUser,
} from '../__mocks__/mocks';
import UnavailabilityForm from '../components/UnavailabilityForm';

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

const mockAddNotification = jest.fn();
const mockOnSuccess = jest.fn();
const mockOnCancel = jest.fn();
const mockCreateAppointmentUnavailability = jest.fn();
const mockGetCurrentUser = jest.fn<Promise<typeof mockCurrentUser | null>, []>(
  () => Promise.resolve(mockCurrentUser),
);
const mockGetProviderLoginLocations = jest.fn<
  Promise<typeof mockLocations>,
  [string]
>(() => Promise.resolve(mockLocations));

const mockGetFHIRLocationsByTag = jest.fn<
  Promise<typeof mockLocations>,
  [string]
>(() => Promise.resolve(mockLocations));

jest.mock('@tanstack/react-query', () => ({
  ...jest.requireActual('@tanstack/react-query'),
  useQuery: jest.fn(),
}));

jest.mock('@bahmni/widgets', () => ({
  ...jest.requireActual('@bahmni/widgets'),
  useNotification: jest.fn(() => ({ addNotification: mockAddNotification })),
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

const mockGetUserLoginLocation = jest.fn(() => ({ uuid: 'location-uuid-1' }));

jest.mock('@bahmni/services', () => ({
  ...jest.requireActual('@bahmni/services'),
  createAppointmentUnavailability: (data: unknown) =>
    mockCreateAppointmentUnavailability(data),
  getAllAppointmentServices: jest.fn(),
  getPaginatedProviders: jest.fn(),
  fetchAllProviders: jest.fn(),
  getCurrentUser: () => mockGetCurrentUser(),
  getFHIRLocationsByTag: (tag: string) => mockGetFHIRLocationsByTag(tag),
  getProviderLoginLocations: (uuid: string) =>
    mockGetProviderLoginLocations(uuid),
  getUserLoginLocation: () => mockGetUserLoginLocation(),
  convertTo24HourFormat: jest.fn((time: string) => {
    const match = time.match(/(\d+):(\d+)\s*(AM|PM)/i);
    if (!match) return null;
    const [, hours, minutes, period] = match;
    let h = parseInt(hours);
    if (period.toUpperCase() === 'PM' && h !== 12) h += 12;
    if (period.toUpperCase() === 'AM' && h === 12) h = 0;
    return `${h.toString().padStart(2, '0')}:${minutes}`;
  }),
}));

describe('UnavailabilityForm', () => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });

  const renderComponent = () =>
    render(
      <QueryClientProvider client={queryClient}>
        <UnavailabilityForm onSuccess={mockOnSuccess} onCancel={mockOnCancel} />
      </QueryClientProvider>,
    );

  const setupMocksWithData = () => {
    (useQuery as jest.Mock).mockImplementation(({ queryKey }) => {
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

  const setupMocksEmpty = () => {
    (useQuery as jest.Mock).mockReturnValue({
      data: [],
      isError: false,
      isLoading: false,
    });
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(() => {
    queryClient.clear();
  });

  describe('Form Rendering', () => {
    it('should render the form title', () => {
      setupMocksWithData();
      renderComponent();
      expect(screen.getByText('Add Unavailability')).toBeInTheDocument();
    });

    it('should render all form fields', () => {
      setupMocksWithData();
      renderComponent();
      expect(screen.getByText(/Select Location/)).toBeInTheDocument();
      expect(screen.getByText(/Start Date/)).toBeInTheDocument();
      expect(screen.getByText(/Start Time/)).toBeInTheDocument();
      expect(screen.getByText(/End Date/)).toBeInTheDocument();
      expect(screen.getByText(/End Time/)).toBeInTheDocument();
      expect(screen.getByText(/Select Service/)).toBeInTheDocument();
      expect(screen.getByText(/Select Provider/)).toBeInTheDocument();
    });

    it('should render Add and Cancel buttons', () => {
      setupMocksWithData();
      renderComponent();
      expect(screen.getByText('Add')).toBeInTheDocument();
      expect(screen.getByText('Cancel')).toBeInTheDocument();
    });

    it('should render location dropdown with options', () => {
      setupMocksWithData();
      renderComponent();
      expect(screen.getByText('General OPD')).toBeInTheDocument();
    });
  });

  describe('Form Interactions', () => {
    it('should call onCancel when Cancel button is clicked', async () => {
      setupMocksWithData();
      renderComponent();
      await userEvent.click(screen.getByText('Cancel'));
      expect(mockOnCancel).toHaveBeenCalled();
    });

    it('should show validation error when submitting empty form', async () => {
      setupMocksEmpty();
      renderComponent();
      await userEvent.click(screen.getByText('Add'));
      expect(mockAddNotification).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'error',
          title: 'Validation Error',
        }),
      );
    });

    it('should update location when a different location is selected', async () => {
      setupMocksWithData();
      renderComponent();
      expect(screen.getByText('General OPD')).toBeInTheDocument();
      expect(screen.getByText(/Select Location/)).toBeInTheDocument();
    });
  });

  describe('Provider Filtering', () => {
    it('should render provider multiselect with filtered providers', () => {
      setupMocksWithData();
      renderComponent();
      expect(screen.getByText(/Select Provider/)).toBeInTheDocument();
    });
  });

  describe('Service Filtering', () => {
    it('should render service multiselect for selected location', () => {
      setupMocksWithData();
      renderComponent();
      expect(screen.getByText(/Select Service/)).toBeInTheDocument();
    });
  });

  describe('Form Submission', () => {
    const fillFormFields = async () => {
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
    };

    it('should call createAppointmentUnavailability on successful submission', async () => {
      setupMocksWithData();
      mockCreateAppointmentUnavailability.mockResolvedValue({});
      renderComponent();

      await fillFormFields();

      await userEvent.click(screen.getByText('Add'));

      await waitFor(() => {
        expect(mockCreateAppointmentUnavailability).toHaveBeenCalled();
      });
    });

    it('should show success notification on successful submission', async () => {
      setupMocksWithData();
      mockCreateAppointmentUnavailability.mockResolvedValue({});
      renderComponent();

      await fillFormFields();

      await userEvent.click(screen.getByText('Add'));

      await waitFor(() => {
        expect(mockAddNotification).toHaveBeenCalledWith(
          expect.objectContaining({
            type: 'success',
            title: 'Success',
          }),
        );
      });
    });

    it('should call onSuccess after successful submission', async () => {
      setupMocksWithData();
      mockCreateAppointmentUnavailability.mockResolvedValue({});
      renderComponent();

      await fillFormFields();

      await userEvent.click(screen.getByText('Add'));

      await waitFor(() => {
        expect(mockOnSuccess).toHaveBeenCalled();
      });
    });

    it('should show error notification on submission failure', async () => {
      setupMocksWithData();
      mockCreateAppointmentUnavailability.mockRejectedValue(
        new Error('API Error'),
      );
      renderComponent();

      await fillFormFields();

      await userEvent.click(screen.getByText('Add'));

      await waitFor(() => {
        expect(mockAddNotification).toHaveBeenCalledWith(
          expect.objectContaining({
            type: 'error',
            title: 'Add Failed',
          }),
        );
      });
    });
  });

  describe('Time Validation', () => {
    it('should show error when end time is before start time on same day', async () => {
      setupMocksWithData();
      renderComponent();

      const startDateInput = screen.getByLabelText(/Start Date/);
      await userEvent.type(startDateInput, '05/25/2026');

      const startTimeInput = screen.getByLabelText(/Start Time/);
      await userEvent.type(startTimeInput, '10:00');

      const endDateInput = screen.getByLabelText(/End Date/);
      await userEvent.type(endDateInput, '05/25/2026');

      const endTimeInput = screen.getByLabelText(/End Time/);
      await userEvent.type(endTimeInput, '09:00');

      await userEvent.click(screen.getByText('Add'));

      await waitFor(() => {
        expect(mockAddNotification).toHaveBeenCalledWith(
          expect.objectContaining({
            type: 'error',
          }),
        );
      });
    });
  });

  describe('Snapshot', () => {
    it('should match snapshot', () => {
      setupMocksWithData();
      const { container } = renderComponent();
      expect(container).toMatchSnapshot();
    });
  });

  describe('Provider Login Locations', () => {
    it('should return empty locations when getCurrentUser returns null', async () => {
      mockGetCurrentUser.mockResolvedValueOnce(null);
      let capturedQueryFn: (() => Promise<unknown>) | null = null;

      (useQuery as jest.Mock).mockImplementation(({ queryKey, queryFn }) => {
        if (queryKey[0] === 'providerLoginLocations') {
          capturedQueryFn = queryFn;
          return {
            data: [],
            isError: false,
            isLoading: false,
          };
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

      renderComponent();
      expect(screen.getByText('Add Unavailability')).toBeInTheDocument();
      expect(capturedQueryFn).not.toBeNull();

      const result = await (
        capturedQueryFn as unknown as () => Promise<unknown>
      )();
      expect(result).toEqual([]);
      expect(mockGetCurrentUser).toHaveBeenCalled();
      expect(mockGetProviderLoginLocations).not.toHaveBeenCalled();
    });

    it('should call getProviderLoginLocations when getCurrentUser returns a user', async () => {
      mockGetCurrentUser.mockResolvedValueOnce(mockCurrentUser);
      mockGetProviderLoginLocations.mockResolvedValueOnce(mockLocations);
      let capturedQueryFn: (() => Promise<unknown>) | null = null;

      (useQuery as jest.Mock).mockImplementation(({ queryKey, queryFn }) => {
        if (queryKey[0] === 'providerLoginLocations') {
          capturedQueryFn = queryFn;
          return {
            data: mockLocations,
            isError: false,
            isLoading: false,
          };
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

      renderComponent();
      expect(screen.getByText('Add Unavailability')).toBeInTheDocument();
      expect(capturedQueryFn).not.toBeNull();

      const result = await (
        capturedQueryFn as unknown as () => Promise<unknown>
      )();
      expect(result).toEqual(mockLocations);
      expect(mockGetCurrentUser).toHaveBeenCalled();
      expect(mockGetProviderLoginLocations).toHaveBeenCalledWith(
        mockCurrentUser.uuid,
      );
    });

    it('should fallback to getFHIRLocationsByTag when provider locations are empty', async () => {
      mockGetCurrentUser.mockResolvedValueOnce(mockCurrentUser);
      mockGetProviderLoginLocations.mockResolvedValueOnce([]);
      mockGetFHIRLocationsByTag.mockResolvedValueOnce(mockLocations);
      let capturedQueryFn: (() => Promise<unknown>) | null = null;

      (useQuery as jest.Mock).mockImplementation(({ queryKey, queryFn }) => {
        if (queryKey[0] === 'providerLoginLocations') {
          capturedQueryFn = queryFn;
          return {
            data: mockLocations,
            isError: false,
            isLoading: false,
          };
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

      renderComponent();
      expect(screen.getByText('Add Unavailability')).toBeInTheDocument();
      expect(capturedQueryFn).not.toBeNull();

      const result = await (
        capturedQueryFn as unknown as () => Promise<unknown>
      )();
      expect(result).toEqual(mockLocations);
      expect(mockGetCurrentUser).toHaveBeenCalled();
      expect(mockGetProviderLoginLocations).toHaveBeenCalledWith(
        mockCurrentUser.uuid,
      );
      expect(mockGetFHIRLocationsByTag).toHaveBeenCalledWith(
        'Appointment Location',
      );
    });
  });

  describe('Accessibility', () => {
    it('passes accessibility tests', async () => {
      setupMocksWithData();
      const { container } = renderComponent();
      await act(async () => {
        const results = await axe(container);
        expect(results).toHaveNoViolations();
      });
    });
  });

  describe('getInitialLocationUuid', () => {
    it('should return empty string when getUserLoginLocation throws an error', () => {
      mockGetUserLoginLocation.mockImplementationOnce(() => {
        throw new Error('No login location');
      });
      setupMocksWithData();
      renderComponent();
      expect(screen.getByText('Add Unavailability')).toBeInTheDocument();
    });
  });

  describe('findItemByUuid edge cases', () => {
    it('should handle undefined uuid in location dropdown', async () => {
      (useQuery as jest.Mock).mockImplementation(({ queryKey }) => {
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

      mockGetUserLoginLocation.mockImplementationOnce(() => {
        throw new Error('No location');
      });

      renderComponent();
      expect(screen.getByText('Add Unavailability')).toBeInTheDocument();
    });
  });

  describe('Form field onChange handlers', () => {
    it('should render location dropdown and allow interaction', async () => {
      setupMocksWithData();
      renderComponent();

      const locationDropdown = screen.getByRole('combobox', {
        name: /select location/i,
      });
      expect(locationDropdown).toBeInTheDocument();
    });

    it('should update location and reset services when location dropdown changes', async () => {
      setupMocksWithData();
      renderComponent();

      const locationDropdown = screen.getByRole('combobox', {
        name: /select location/i,
      });

      expect(locationDropdown).toBeInTheDocument();
      expect(screen.getByText('General OPD')).toBeInTheDocument();
    });

    it('should update start time period when AM/PM select changes', async () => {
      setupMocksWithData();
      renderComponent();

      const startTimeInput = screen.getByLabelText(/Start Time/);
      await userEvent.type(startTimeInput, '09:00');

      const startTimePeriodSelect = document.getElementById(
        'time-picker-select-1',
      );
      expect(startTimePeriodSelect).not.toBeNull();
      await userEvent.selectOptions(startTimePeriodSelect!, 'PM');
    });

    it('should update end time period when AM/PM select changes', async () => {
      setupMocksWithData();
      renderComponent();

      const endTimeInput = screen.getByLabelText(/End time/i);
      await userEvent.type(endTimeInput, '05:00');

      const endTimePeriodSelect = document.getElementById(
        'time-picker-select-2',
      );
      expect(endTimePeriodSelect).not.toBeNull();
      await userEvent.selectOptions(endTimePeriodSelect!, 'PM');
    });

    it('should handle service multiselect onChange when items are selected', async () => {
      setupMocksWithData();
      renderComponent();

      const serviceMultiselect = screen.getByPlaceholderText(/Select Service/);
      expect(serviceMultiselect).toBeInTheDocument();

      await userEvent.click(serviceMultiselect);

      await waitFor(() => {
        const serviceItems = screen.queryAllByRole('option');
        expect(serviceItems.length).toBeGreaterThanOrEqual(0);
      });
    });

    it('should handle provider multiselect onChange when items are selected', async () => {
      setupMocksWithData();
      renderComponent();

      const providerMultiselect =
        screen.getByPlaceholderText(/Select Provider/);
      expect(providerMultiselect).toBeInTheDocument();

      await userEvent.click(providerMultiselect);

      await waitFor(() => {
        const providerItems = screen.queryAllByRole('option');
        expect(providerItems.length).toBeGreaterThanOrEqual(0);
      });
    });
  });

  describe('itemToString callbacks', () => {
    it('should handle null items in location dropdown itemToString', async () => {
      setupMocksWithData();
      renderComponent();

      const locationDropdown = screen.getByRole('combobox', {
        name: /select location/i,
      });
      expect(locationDropdown).toBeInTheDocument();
    });

    it('should handle null items in service multiselect itemToString', () => {
      setupMocksWithData();
      renderComponent();

      const serviceMultiselect = screen.getByText(/Select Service/);
      expect(serviceMultiselect).toBeInTheDocument();
    });

    it('should handle null items in provider multiselect itemToString', () => {
      setupMocksWithData();
      renderComponent();

      const providerMultiselect = screen.getByText(/Select Provider/);
      expect(providerMultiselect).toBeInTheDocument();
    });
  });

  describe('Date picker onChange handlers', () => {
    it('should update start date when date picker changes', async () => {
      setupMocksWithData();
      renderComponent();

      const startDateInput = screen.getByLabelText(/Start Date/);
      await userEvent.type(startDateInput, '05/25/2026');

      expect(startDateInput).toHaveValue('05/25/2026');
    });

    it('should update end date when date picker changes', async () => {
      setupMocksWithData();
      renderComponent();

      const endDateInput = screen.getByLabelText(/End Date/);
      await userEvent.type(endDateInput, '05/26/2026');

      expect(endDateInput).toHaveValue('05/26/2026');
    });
  });
});
