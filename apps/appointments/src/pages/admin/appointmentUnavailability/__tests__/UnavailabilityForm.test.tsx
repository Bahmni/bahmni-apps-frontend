import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { axe, toHaveNoViolations } from 'jest-axe';
import React from 'react';
import {
  mockAppointmentServices,
  mockLocations,
  mockProviders,
  mockUnavailableProviders,
} from '../__mocks__/unavailabilityMock';
import UnavailabilityForm from '../components/UnavailabilityForm';
import type {
  UnavailabilityFormData,
  UnavailabilityFormErrors,
} from '../models';

jest.mock('../hook', () => ({
  __esModule: true,
  default: jest.fn(),
}));

jest.mock('@bahmni/services', () => ({
  ...jest.requireActual('@bahmni/services'),
  getUserLoginLocation: jest.fn(),
  getTodayDate: jest.fn(),
  formatDateTime: jest.fn(() => ({ formattedResult: 'formatted-datetime' })),
}));

expect.extend(toHaveNoViolations);

const useUnavailabilityFormData = jest.requireMock('../hook').default;
const { getUserLoginLocation, getTodayDate } =
  jest.requireMock('@bahmni/services');

const defaultHookReturn = {
  loginLocations: mockLocations,
  services: mockAppointmentServices,
  providers: mockProviders,
  isLoading: false,
  isError: false,
};

type HookOverride = Partial<typeof defaultHookReturn>;

const setupMocks = (hookOverride: HookOverride = {}) => {
  useUnavailabilityFormData.mockReturnValue({
    ...defaultHookReturn,
    ...hookOverride,
  });
  getUserLoginLocation.mockReturnValue({ uuid: 'location-uuid-1' });
  getTodayDate.mockReturnValue('05/29/2026');
};

const renderComponent = (
  errors: UnavailabilityFormErrors = {},
  onClearErrors = jest.fn(),
) => {
  const formDataRef = React.createRef<UnavailabilityFormData | null>();
  const { container } = render(
    <UnavailabilityForm
      errors={errors}
      formDataRef={formDataRef}
      onClearErrors={onClearErrors}
    />,
  );
  return { formDataRef, container, onClearErrors };
};

describe('UnavailabilityForm', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Loading and error states', () => {
    it.each([
      {
        scenario: 'loading',
        hookOverride: {
          isLoading: true,
          loginLocations: [],
          services: [],
          providers: [],
        },
        expectedTestId: 'unavailability-form-skeleton',
      },
      {
        scenario: 'error',
        hookOverride: {
          isError: true,
          loginLocations: [],
          services: [],
          providers: [],
        },
        expectedTestId: 'unavailability-form-error',
      },
    ])(
      'renders $scenario indicator and hides form content',
      ({ hookOverride, expectedTestId }) => {
        setupMocks(hookOverride);
        renderComponent();
        expect(screen.getByTestId(expectedTestId)).toBeInTheDocument();
        expect(
          screen.queryByTestId('unavailability-form-content-test-id'),
        ).not.toBeInTheDocument();
      },
    );

    it('displays error message text when data fails to load', () => {
      setupMocks({
        isError: true,
        loginLocations: [],
        services: [],
        providers: [],
      });
      renderComponent();
      expect(
        screen.getByText('Failed to load form data. Please try again.'),
      ).toBeInTheDocument();
    });
  });

  describe('Form field rendering', () => {
    it('renders all form fields', () => {
      setupMocks();
      renderComponent();
      expect(
        screen.getByTestId('unavailability-form-content-test-id'),
      ).toBeInTheDocument();
      expect(screen.getByTestId('location-dropdown')).toBeInTheDocument();
      expect(screen.getByTestId('start-date-input')).toBeInTheDocument();
      expect(screen.getByLabelText('Start Time*')).toBeInTheDocument();
      expect(screen.getByTestId('end-date-input')).toBeInTheDocument();
      expect(screen.getByLabelText('End Time*')).toBeInTheDocument();
      expect(
        screen.getByTestId('unavailability-form-service-test-id'),
      ).toBeInTheDocument();
      expect(
        screen.getByTestId('unavailability-form-provider-test-id'),
      ).toBeInTheDocument();
    });
  });

  describe('Field validation error display', () => {
    it.each([
      { field: 'location', errors: { location: 'Required field' } },
      { field: 'startDate', errors: { startDate: 'Required field' } },
      { field: 'startTime', errors: { startTime: 'Required field' } },
      { field: 'endDate', errors: { endDate: 'Required field' } },
      { field: 'endTime', errors: { endTime: 'Required field' } },
      {
        field: 'dateTime',
        errors: { dateTime: 'End time must be after start time' },
      },
    ])('displays error text for $field field', ({ errors }) => {
      setupMocks();
      renderComponent(errors);
      const errorText = Object.values(errors)[0];
      expect(screen.getByText(errorText)).toBeInTheDocument();
    });
  });

  describe('Error clearing on field change', () => {
    it.each([
      {
        field: 'location',
        errors: { location: 'Required field' },
        interact: async () => {
          await userEvent.click(
            screen.getByRole('combobox', { name: 'Select Location*' }),
          );
          await userEvent.click(await screen.findByText('ENT Ward'));
        },
        expectedKeys: ['location'],
      },
      {
        field: 'startTime',
        errors: { startTime: 'Required field' },
        interact: async () => {
          fireEvent.change(screen.getByLabelText('Start Time*'), {
            target: { value: '10:00' },
          });
        },
        expectedKeys: ['startTime', 'dateTime'],
      },
      {
        field: 'endTime',
        errors: { endTime: 'Required field' },
        interact: async () => {
          fireEvent.change(screen.getByLabelText('End Time*'), {
            target: { value: '12:00' },
          });
        },
        expectedKeys: ['endTime', 'dateTime'],
      },
      {
        field: 'startDate',
        errors: { startDate: 'Required field' },
        interact: async () => {
          await userEvent.click(screen.getByTestId('start-date-input'));
          const [startCalendar] = screen.getAllByRole('application', {
            name: 'calendar-container',
          });
          await userEvent.click(within(startCalendar).getByText('15'));
        },
        expectedKeys: ['startDate', 'dateTime'],
      },
      {
        field: 'endDate',
        errors: { endDate: 'Required field' },
        interact: async () => {
          await userEvent.click(screen.getByTestId('end-date-input'));
          const [, endCalendar] = screen.getAllByRole('application', {
            name: 'calendar-container',
          });
          await userEvent.click(within(endCalendar).getByText('15'));
        },
        expectedKeys: ['endDate', 'dateTime'],
      },
      {
        field: 'startTimePeriod',
        errors: { dateTime: 'End time must be after start time' },
        interact: async () => {
          fireEvent.change(
            screen.getAllByLabelText('open list of options')[0],
            { target: { value: 'PM' } },
          );
        },
        expectedKeys: ['dateTime'],
      },
      {
        field: 'endTimePeriod',
        errors: { dateTime: 'End time must be after start time' },
        interact: async () => {
          fireEvent.change(
            screen.getAllByLabelText('open list of options')[1],
            { target: { value: 'PM' } },
          );
        },
        expectedKeys: ['dateTime'],
      },
    ])(
      'calls onClearErrors with $expectedKeys when $field changes',
      async ({ errors, interact, expectedKeys }) => {
        setupMocks();
        const onClearErrors = jest.fn();
        renderComponent(errors, onClearErrors);
        await interact();
        expect(onClearErrors).toHaveBeenCalledWith(expectedKeys);
      },
    );
  });

  describe('formDataRef population', () => {
    it('populates formDataRef with initial form state', () => {
      setupMocks();
      const { formDataRef } = renderComponent();
      expect(formDataRef.current).toMatchObject({
        locationUuid: 'location-uuid-1',
        startDate: null,
        startTime: '',
        startTimePeriod: 'AM',
        endDate: null,
        endTime: '',
        endTimePeriod: 'AM',
        filteredServicesCount: 1,
        availableProvidersCount: 2,
      });
    });
  });

  describe('Location reconciliation', () => {
    it.each([
      {
        scenario: 'cookie location is present in loginLocations',
        cookieUuid: 'location-uuid-1',
        hookOverride: {} as HookOverride,
        expectedUuid: 'location-uuid-1',
      },
      {
        scenario: 'cookie location is not in loginLocations',
        cookieUuid: 'location-uuid-unknown',
        hookOverride: {} as HookOverride,
        expectedUuid: '',
      },
      {
        scenario: 'loginLocations is empty',
        cookieUuid: 'location-uuid-1',
        hookOverride: { loginLocations: [] } as HookOverride,
        expectedUuid: '',
      },
    ])(
      'sets locationUuid to "$expectedUuid" when $scenario',
      async ({ cookieUuid, hookOverride, expectedUuid }) => {
        setupMocks(hookOverride);
        getUserLoginLocation.mockReturnValue({ uuid: cookieUuid });
        const { formDataRef } = renderComponent();
        await waitFor(() => {
          expect(formDataRef.current?.locationUuid).toBe(expectedUuid);
        });
      },
    );
  });

  describe('Service auto-selection', () => {
    it('auto-selects all service items when services exist for the location', async () => {
      setupMocks();
      const { formDataRef } = renderComponent();
      await waitFor(() => {
        expect(formDataRef.current?.selectedServiceItems).toEqual(
          expect.arrayContaining([
            expect.objectContaining({ id: 'service-uuid-1' }),
            expect.objectContaining({ id: 'select-all-services' }),
          ]),
        );
      });
    });

    it('does not auto-select services when no services exist for the location', async () => {
      useUnavailabilityFormData.mockReturnValue({ ...defaultHookReturn });
      getUserLoginLocation.mockReturnValue({ uuid: 'location-uuid-unknown' });
      getTodayDate.mockReturnValue('05/29/2026');
      const { formDataRef } = renderComponent();
      await waitFor(() => {
        expect(formDataRef.current?.selectedServiceItems).toEqual([]);
      });
    });
  });

  describe('Provider auto-selection', () => {
    it('auto-selects all provider items when available providers exist', async () => {
      setupMocks();
      const { formDataRef } = renderComponent();
      await waitFor(() => {
        expect(formDataRef.current?.selectedProviderItems).toEqual(
          expect.arrayContaining([
            expect.objectContaining({ id: 'provider-uuid-1' }),
            expect.objectContaining({ id: 'provider-uuid-2' }),
            expect.objectContaining({ id: 'select-all-providers' }),
          ]),
        );
      });
    });

    it('does not auto-select providers when no available providers exist', async () => {
      setupMocks({ providers: mockUnavailableProviders });
      const { formDataRef } = renderComponent();
      await waitFor(() => {
        expect(formDataRef.current?.selectedProviderItems).toEqual([]);
      });
    });
  });

  describe('Filtering', () => {
    it('sets filteredServicesCount to services matching the selected location', () => {
      setupMocks();
      const { formDataRef } = renderComponent();
      expect(formDataRef.current?.filteredServicesCount).toBe(1);
    });

    it('excludes providers without availability attribute from availableProvidersCount', () => {
      setupMocks();
      const { formDataRef } = renderComponent();
      expect(formDataRef.current?.availableProvidersCount).toBe(2);
    });
  });

  describe('User interactions', () => {
    it('updates locationUuid and switches service selection to new location when location changes', async () => {
      setupMocks();
      const { formDataRef } = renderComponent();

      await userEvent.click(
        screen.getByRole('combobox', { name: 'Select Location*' }),
      );
      await userEvent.click(await screen.findByText('ENT Ward'));

      await waitFor(() => {
        expect(formDataRef.current?.locationUuid).toBe('location-uuid-2');
        const serviceIds =
          formDataRef.current?.selectedServiceItems.map((i) => i.id) ?? [];
        expect(serviceIds).not.toContain('service-uuid-1');
        expect(serviceIds).toContain('service-uuid-2');
      });
    });

    it.each([
      { label: 'Start Time*', value: '10:00', field: 'startTime' as const },
      { label: 'End Time*', value: '12:00', field: 'endTime' as const },
    ])(
      'updates $field in formDataRef when time input changes',
      ({ label, value, field }) => {
        setupMocks();
        const { formDataRef } = renderComponent();
        fireEvent.change(screen.getByLabelText(label), { target: { value } });
        expect(formDataRef.current?.[field]).toBe(value);
      },
    );

    it.each([
      { scenario: 'start', index: 0, field: 'startTimePeriod' as const },
      { scenario: 'end', index: 1, field: 'endTimePeriod' as const },
    ])(
      'updates $scenario time period to PM in formDataRef',
      ({ index, field }) => {
        setupMocks();
        const { formDataRef } = renderComponent();
        fireEvent.change(
          screen.getAllByLabelText('open list of options')[index],
          {
            target: { value: 'PM' },
          },
        );
        expect(formDataRef.current?.[field]).toBe('PM');
      },
    );

    it('updates selectedServiceItems when service selection changes', async () => {
      setupMocks();
      const { formDataRef } = renderComponent();

      await waitFor(() => {
        expect(
          formDataRef.current?.selectedServiceItems.length,
        ).toBeGreaterThan(0);
      });

      await userEvent.click(
        screen.getByRole('combobox', { name: /Select Service/i }),
      );
      await userEvent.click(
        await screen.findByRole('option', {
          name: /General Medicine OPD Consultation/i,
        }),
      );

      const serviceIds =
        formDataRef.current?.selectedServiceItems.map((item) => item.id) ?? [];
      expect(serviceIds).not.toContain('service-uuid-1');
    });

    it('updates selectedProviderItems when provider selection changes', async () => {
      setupMocks();
      const { formDataRef } = renderComponent();

      await waitFor(() => {
        expect(
          formDataRef.current?.selectedProviderItems.length,
        ).toBeGreaterThan(0);
      });

      await userEvent.click(
        screen.getByRole('combobox', { name: /Select Provider/i }),
      );
      await userEvent.click(
        await screen.findByRole('option', { name: /Dr. John Smith/i }),
      );

      const providerIds =
        formDataRef.current?.selectedProviderItems.map((item) => item.id) ?? [];
      expect(providerIds).not.toContain('provider-uuid-1');
    });
  });

  describe('Snapshot', () => {
    it.each([
      { scenario: 'normal state', hookOverride: {} as HookOverride },
      {
        scenario: 'loading state',
        hookOverride: {
          isLoading: true,
          loginLocations: [],
          services: [],
          providers: [],
        },
      },
      {
        scenario: 'error state',
        hookOverride: {
          isError: true,
          loginLocations: [],
          services: [],
          providers: [],
        },
      },
    ])('matches snapshot for $scenario', ({ hookOverride }) => {
      setupMocks(hookOverride);
      const { container } = renderComponent();
      expect(container).toMatchSnapshot();
    });
  });

  describe('Accessibility', () => {
    it.each([
      { scenario: 'normal state', hookOverride: {} as HookOverride },
      {
        scenario: 'loading state',
        hookOverride: {
          isLoading: true,
          loginLocations: [],
          services: [],
          providers: [],
        },
      },
      {
        scenario: 'error state',
        hookOverride: {
          isError: true,
          loginLocations: [],
          services: [],
          providers: [],
        },
      },
    ])('passes accessibility tests for $scenario', async ({ hookOverride }) => {
      setupMocks(hookOverride);
      const { container } = renderComponent();
      await act(async () => {
        const results = await axe(container);
        expect(results).toHaveNoViolations();
      });
    });
  });
});
