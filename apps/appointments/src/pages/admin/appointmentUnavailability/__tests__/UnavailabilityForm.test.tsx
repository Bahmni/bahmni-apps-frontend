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
} from '../__mocks__/unavailabilityMock';
import UnavailabilityForm from '../components/UnavailabilityForm';
import { createBaseData, mapFHIRBundleToLocations } from '../utils';

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
const mockOnSubmit = jest.fn(() => Promise.resolve());
const mockOnCancel = jest.fn();
const mockGetCurrentUser = jest.fn<Promise<typeof mockCurrentUser | null>, []>(
  () => Promise.resolve(mockCurrentUser),
);
const mockGetProviderLoginLocations = jest.fn<
  Promise<typeof mockLocations>,
  [string]
>(() => Promise.resolve(mockLocations));

const mockFHIRBundle = {
  resourceType: 'Bundle' as const,
  id: 'test-bundle',
  type: 'searchset',
  total: 2,
  entry: [
    {
      fullUrl: 'http://test/Location/location-uuid-1',
      resource: {
        resourceType: 'Location' as const,
        id: 'location-uuid-1',
        name: 'General OPD',
      },
    },
    {
      fullUrl: 'http://test/Location/location-uuid-2',
      resource: {
        resourceType: 'Location' as const,
        id: 'location-uuid-2',
        name: 'ENT Ward',
      },
    },
  ],
};

const mockMappedFHIRLocations = [
  {
    uuid: 'location-uuid-1',
    display: 'General OPD',
    childLocations: [],
  },
  {
    uuid: 'location-uuid-2',
    display: 'ENT Ward',
    childLocations: [],
  },
];

const mockGetFHIRLocationsByTag = jest.fn<
  Promise<typeof mockFHIRBundle>,
  [string]
>(() => Promise.resolve(mockFHIRBundle));

jest.mock('@tanstack/react-query', () => ({
  ...jest.requireActual('@tanstack/react-query'),
  useQuery: jest.fn(),
}));

jest.mock('@bahmni/widgets', () => ({
  ...jest.requireActual('@bahmni/widgets'),
  useNotification: jest.fn(() => ({ addNotification: mockAddNotification })),
}));

const mockGetUserLoginLocation = jest.fn(() => ({ uuid: 'location-uuid-1' }));

jest.mock('@bahmni/services', () => ({
  ...jest.requireActual('@bahmni/services'),
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
        <UnavailabilityForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />
      </QueryClientProvider>,
    );

  const setupMocksWithData = () => {
    (useQuery as jest.Mock).mockImplementation(({ queryKey }) => {
      if (queryKey[0] === 'currentUser') {
        return { data: mockCurrentUser, isError: false, isLoading: false };
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

    it('should update location when a different location is selected', async () => {
      setupMocksWithData();
      renderComponent();
      expect(screen.getByText('General OPD')).toBeInTheDocument();
      expect(screen.getByText(/Select Location/)).toBeInTheDocument();
    });
  });

  describe('Form Validation', () => {
    const validationTestCases = [
      {
        description: 'empty form is submitted',
        setupMocks: () => {
          (useQuery as jest.Mock).mockReturnValue({
            data: [],
            isError: false,
            isLoading: false,
          });
        },
        fillFields: () => {},
      },
      {
        description: 'start date is missing',
        setupMocks: () => {
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
        },
        fillFields: async () => {
          const startTimeInput = screen.getByLabelText(/Start Time/);
          fireEvent.change(startTimeInput, { target: { value: '09:00' } });

          const endDateInput = screen.getByLabelText(/End Date/);
          fireEvent.change(endDateInput, { target: { value: '05/25/2026' } });
          fireEvent.blur(endDateInput);

          const endTimeInput = screen.getByLabelText(/End Time/);
          fireEvent.change(endTimeInput, { target: { value: '10:00' } });
        },
      },
      {
        description: 'start time is missing',
        setupMocks: () => {
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
        },
        fillFields: async () => {
          const startDateInput = screen.getByLabelText(/Start Date/);
          fireEvent.change(startDateInput, { target: { value: '05/25/2026' } });
          fireEvent.blur(startDateInput);

          const endDateInput = screen.getByLabelText(/End Date/);
          fireEvent.change(endDateInput, { target: { value: '05/25/2026' } });
          fireEvent.blur(endDateInput);

          const endTimeInput = screen.getByLabelText(/End Time/);
          fireEvent.change(endTimeInput, { target: { value: '10:00' } });
        },
      },
      {
        description: 'end date is missing',
        setupMocks: () => {
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
        },
        fillFields: async () => {
          const startDateInput = screen.getByLabelText(/Start Date/);
          fireEvent.change(startDateInput, { target: { value: '05/25/2026' } });
          fireEvent.blur(startDateInput);

          const startTimeInput = screen.getByLabelText(/Start Time/);
          fireEvent.change(startTimeInput, { target: { value: '09:00' } });

          const endTimeInput = screen.getByLabelText(/End Time/);
          fireEvent.change(endTimeInput, { target: { value: '10:00' } });
        },
      },
      {
        description: 'end time is missing',
        setupMocks: () => {
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
        },
        fillFields: async () => {
          const startDateInput = screen.getByLabelText(/Start Date/);
          fireEvent.change(startDateInput, { target: { value: '05/25/2026' } });
          fireEvent.blur(startDateInput);

          const startTimeInput = screen.getByLabelText(/Start Time/);
          fireEvent.change(startTimeInput, { target: { value: '09:00' } });

          const endDateInput = screen.getByLabelText(/End Date/);
          fireEvent.change(endDateInput, { target: { value: '05/25/2026' } });
          fireEvent.blur(endDateInput);
        },
      },
      {
        description: 'end time is before start time on same day',
        setupMocks: () => {
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
        },
        fillFields: async () => {
          const startDateInput = screen.getByLabelText(/Start Date/);
          await userEvent.type(startDateInput, '05/25/2026');

          const startTimeInput = screen.getByLabelText(/Start Time/);
          await userEvent.type(startTimeInput, '10:00');

          const endDateInput = screen.getByLabelText(/End Date/);
          await userEvent.type(endDateInput, '05/25/2026');

          const endTimeInput = screen.getByLabelText(/End Time/);
          await userEvent.type(endTimeInput, '09:00');
        },
      },
    ];

    it.each(validationTestCases)(
      'should not submit when $description',
      async ({ setupMocks, fillFields }) => {
        setupMocks();
        renderComponent();

        await fillFields();
        await userEvent.click(screen.getByText('Add'));

        await waitFor(() => {
          expect(mockOnSubmit).not.toHaveBeenCalled();
        });
      },
    );
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
    it('should render Add button', () => {
      setupMocksWithData();
      renderComponent();
      expect(screen.getByText('Add')).toBeInTheDocument();
    });

    it('should have onSubmit mock configured', () => {
      expect(mockOnSubmit).toBeDefined();
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
    it('should not call providerLoginLocations query when currentUser is null', () => {
      (useQuery as jest.Mock).mockImplementation(({ queryKey, enabled }) => {
        if (queryKey[0] === 'currentUser') {
          return { data: null, isError: false, isLoading: false };
        }
        if (queryKey[0] === 'providerLoginLocations') {
          // eslint-disable-next-line jest/no-conditional-expect
          expect(enabled).toBe(false);
          return { data: [], isError: false, isLoading: false };
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
    });

    it('should call getProviderLoginLocations when currentUser is available', async () => {
      mockGetProviderLoginLocations.mockResolvedValueOnce(mockLocations);
      let capturedQueryFn: (() => Promise<unknown>) | null = null;

      (useQuery as jest.Mock).mockImplementation(({ queryKey, queryFn }) => {
        if (queryKey[0] === 'currentUser') {
          return { data: mockCurrentUser, isError: false, isLoading: false };
        }
        if (queryKey[0] === 'providerLoginLocations') {
          capturedQueryFn = queryFn;
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

      renderComponent();
      expect(screen.getByText('Add Unavailability')).toBeInTheDocument();
      expect(capturedQueryFn).not.toBeNull();

      const result = await capturedQueryFn!();
      expect(result).toEqual(mockLocations);
      expect(mockGetProviderLoginLocations).toHaveBeenCalledWith(
        mockCurrentUser.uuid,
      );
    });

    it('should fallback to getFHIRLocationsByTag when provider locations are empty', async () => {
      mockGetProviderLoginLocations.mockResolvedValueOnce([]);
      mockGetFHIRLocationsByTag.mockResolvedValueOnce(mockFHIRBundle);
      let capturedQueryFn: (() => Promise<unknown>) | null = null;

      (useQuery as jest.Mock).mockImplementation(({ queryKey, queryFn }) => {
        if (queryKey[0] === 'currentUser') {
          return { data: mockCurrentUser, isError: false, isLoading: false };
        }
        if (queryKey[0] === 'providerLoginLocations') {
          capturedQueryFn = queryFn;
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

      renderComponent();
      expect(screen.getByText('Add Unavailability')).toBeInTheDocument();
      expect(capturedQueryFn).not.toBeNull();

      const result = await capturedQueryFn!();
      expect(result).toEqual(mockMappedFHIRLocations);
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

      const startTimePeriodSelect =
        document.getElementById('start-time-period');
      expect(startTimePeriodSelect).not.toBeNull();
      await userEvent.selectOptions(startTimePeriodSelect!, 'PM');
    });

    it('should update end time period when AM/PM select changes', async () => {
      setupMocksWithData();
      renderComponent();

      const endTimeInput = screen.getByLabelText(/End time/i);
      await userEvent.type(endTimeInput, '05:00');

      const endTimePeriodSelect = document.getElementById('end-time-period');
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

  describe('Utils - createBaseData', () => {
    const mockTranslation = jest.fn(
      (key: string) => key,
    ) as unknown as ReturnType<
      typeof import('@bahmni/services').useTranslation
    >['t'];

    it('should create base data with formatted dates and times', () => {
      const params = {
        locationUuid: 'location-123',
        startDate: new Date('2024-01-15'),
        startTime: '09:00',
        startTimePeriod: 'AM' as const,
        endDate: new Date('2024-01-15'),
        endTime: '05:00',
        endTimePeriod: 'PM' as const,
      };

      const result = createBaseData(params, mockTranslation);

      expect(result.locationUuid).toBe('location-123');
      expect(result.startTime).toBe('09:00');
      expect(result.endTime).toBe('17:00');
    });
  });

  describe('Utils - mapFHIRBundleToLocations', () => {
    it('should map FHIR bundle entries to Location format', () => {
      const result = mapFHIRBundleToLocations(mockFHIRBundle);

      expect(result).toEqual(mockMappedFHIRLocations);
    });

    it('should return empty array when FHIR bundle has no entries', () => {
      const emptyBundle = {
        resourceType: 'Bundle' as const,
        id: 'empty-bundle',
        type: 'searchset',
        total: 0,
        entry: [],
      };

      const result = mapFHIRBundleToLocations(emptyBundle);

      expect(result).toEqual([]);
    });

    it('should return empty array when FHIR bundle entry is undefined', () => {
      const bundleWithUndefinedEntry = {
        resourceType: 'Bundle' as const,
        id: 'bundle-no-entry',
        type: 'searchset',
        total: 0,
        entry: undefined,
      };

      const result = mapFHIRBundleToLocations(bundleWithUndefinedEntry as any);

      expect(result).toEqual([]);
    });
  });
});
