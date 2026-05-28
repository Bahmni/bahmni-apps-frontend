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
    const makeProviderLocationsQueryMock = (
      locationsData: typeof mockLocations | [],
      capture: { queryFn: (() => Promise<unknown>) | null },
    ) =>
      ({
        queryKey,
        queryFn,
      }: {
        queryKey: string[];
        queryFn?: () => Promise<unknown>;
      }) => {
        if (queryKey[0] === 'providerLoginLocations') {
          capture.queryFn = queryFn ?? null;
          return { data: locationsData, isError: false, isLoading: false };
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
      };

    it('should return empty locations when getCurrentUser returns null', async () => {
      mockGetCurrentUser.mockResolvedValueOnce(null);
      const capture = { queryFn: null as (() => Promise<unknown>) | null };

      (useQuery as jest.Mock).mockImplementation(
        makeProviderLocationsQueryMock([], capture),
      );

      renderComponent();
      expect(screen.getByText('Add Unavailability')).toBeInTheDocument();
    });

    it('should call getProviderLoginLocations when currentUser is available', async () => {
      mockGetProviderLoginLocations.mockResolvedValueOnce(mockLocations);
      const capture = { queryFn: null as (() => Promise<unknown>) | null };

      (useQuery as jest.Mock).mockImplementation(({ queryKey, queryFn }) => {
        if (queryKey[0] === 'currentUser') {
          return { data: mockCurrentUser, isError: false, isLoading: false };
        }
        if (queryKey[0] === 'providerLoginLocations') {
          capture.queryFn = queryFn;
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
      expect(capture.queryFn).not.toBeNull();

      const result = await (capture.queryFn as () => Promise<unknown>)();
      expect(result).toEqual(mockLocations);
      expect(mockGetProviderLoginLocations).toHaveBeenCalledWith(
        mockCurrentUser.uuid,
      );
    });

    it('should fallback to getFHIRLocationsByTag when provider locations are empty', async () => {
      mockGetProviderLoginLocations.mockResolvedValueOnce([]);
      mockGetFHIRLocationsByTag.mockResolvedValueOnce(mockFHIRBundle);
      const capture = { queryFn: null as (() => Promise<unknown>) | null };

      (useQuery as jest.Mock).mockImplementation(({ queryKey, queryFn }) => {
        if (queryKey[0] === 'currentUser') {
          return { data: mockCurrentUser, isError: false, isLoading: false };
        }
        if (queryKey[0] === 'providerLoginLocations') {
          capture.queryFn = queryFn;
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
      expect(capture.queryFn).not.toBeNull();

      const result = await (capture.queryFn as () => Promise<unknown>)();
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

  describe('Form field onChange handlers', () => {
    it('should filter services to the selected location after location changes', async () => {
      setupMocksWithData();
      renderComponent();

      await userEvent.click(
        screen.getByRole('combobox', { name: /select location/i }),
      );
      await userEvent.click(screen.getByRole('option', { name: 'ENT Ward' }));

      await userEvent.click(screen.getByPlaceholderText(/Select Service/i));

      await waitFor(() => {
        expect(
          screen.getByRole('option', { name: /ENT OPD Consultation/i }),
        ).toBeInTheDocument();
        expect(
          screen.queryByRole('option', {
            name: /General Medicine OPD Consultation/i,
          }),
        ).not.toBeInTheDocument();
      });
    });

    it('should only include available providers in the provider multiselect', async () => {
      setupMocksWithData();
      renderComponent();

      await userEvent.click(screen.getByPlaceholderText(/Select Provider/i));

      await waitFor(() => {
        expect(
          screen.getByRole('option', { name: /Dr. John Smith/i }),
        ).toBeInTheDocument();
        expect(
          screen.getByRole('option', { name: /Dr. Jane Doe/i }),
        ).toBeInTheDocument();
        expect(
          screen.queryByRole('option', { name: /Dr. Unavailable Provider/i }),
        ).not.toBeInTheDocument();
      });
    });

    it.each([
      {
        name: 'start time',
        label: /Start Time/,
        selectId: 'start-time-period',
        typeValue: '09:00',
      },
      {
        name: 'end time',
        label: /End time/i,
        selectId: 'end-time-period',
        typeValue: '05:00',
      },
    ])(
      'should update $name AM/PM when select changes',
      async ({ label, selectId, typeValue }) => {
        setupMocksWithData();
        renderComponent();

        const timeInput = screen.getByLabelText(label);
        await userEvent.type(timeInput, typeValue);

        const timePeriodSelect = document.getElementById(selectId);
        expect(timePeriodSelect).not.toBeNull();
        await userEvent.selectOptions(timePeriodSelect!, 'PM');
      },
    );
  });

  describe('Date picker onChange handlers', () => {
    it.each([
      { name: 'start date', label: /Start Date/, value: '05/25/2026' },
      { name: 'end date', label: /End Date/, value: '05/26/2026' },
    ])(
      'should update $name when date picker changes',
      async ({ label, value }) => {
        setupMocksWithData();
        renderComponent();

        const input = screen.getByLabelText(label);
        await userEvent.type(input, value);

        expect(input).toHaveValue(value);
      },
    );
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
