import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
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
  mockAppointmentServices,
  mockAppointmentUnavailabilities,
  mockLocations,
  mockProviders,
  mockRequests,
} from '../__mocks__/unavailabilityMock';
import AppointmentUnavailabilityPage from '../index';

jest.mock('@tanstack/react-query', () => ({
  ...jest.requireActual('@tanstack/react-query'),
  useQuery: jest.fn(),
  useQueryClient: jest.fn(),
}));

jest.mock('@bahmni/widgets', () => ({
  ...jest.requireActual('@bahmni/widgets'),
  useNotification: jest.fn(),
  useUserPrivilege: jest.fn(),
}));

jest.mock('@bahmni/services', () => ({
  ...jest.requireActual('@bahmni/services'),
  createAppointmentUnavailability: jest.fn(),
  hasPrivilege: jest.fn(),
  getUserLoginLocation: jest.fn(),
  formatDateTime: jest.fn(() => ({ formattedResult: 'formatted-datetime' })),
}));

jest.mock('../hook', () => ({
  __esModule: true,
  default: jest.fn(),
}));

jest.mock('../utils', () => ({
  ...jest.requireActual('../utils'),
  validateUnavailabilityForm: jest.fn(),
  buildUnavailabilityRequests: jest.fn(),
}));

expect.extend(toHaveNoViolations);

const { useQuery, useQueryClient } = jest.requireMock('@tanstack/react-query');
const { useNotification, useUserPrivilege } =
  jest.requireMock('@bahmni/widgets');
const { createAppointmentUnavailability, hasPrivilege, getUserLoginLocation } =
  jest.requireMock('@bahmni/services');
const useUnavailabilityFormData = jest.requireMock('../hook').default;
const { validateUnavailabilityForm, buildUnavailabilityRequests } =
  jest.requireMock('../utils');

const mockAddNotification = jest.fn();
const mockInvalidateQueries = jest.fn();

type TableOverride = {
  data?: unknown;
  isLoading?: boolean;
  isError?: boolean;
};

const setupDefaultMocks = ({
  data = [],
  isLoading = false,
  isError = false,
}: TableOverride = {}) => {
  useUserPrivilege.mockReturnValue({ userPrivileges: [] });
  useNotification.mockReturnValue({ addNotification: mockAddNotification });
  useQueryClient.mockReturnValue({ invalidateQueries: mockInvalidateQueries });
  hasPrivilege.mockReturnValue(true);
  useQuery.mockReturnValue({ data, isLoading, isError });
  getUserLoginLocation.mockReturnValue({ uuid: 'location-uuid-1' });
  useUnavailabilityFormData.mockReturnValue({
    loginLocations: mockLocations,
    services: mockAppointmentServices,
    providers: mockProviders,
    isLoading: false,
    isError: false,
  });
  validateUnavailabilityForm.mockReturnValue({});
  buildUnavailabilityRequests.mockReturnValue(mockRequests);
  createAppointmentUnavailability.mockResolvedValue(undefined);
};

const renderComponent = () => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(
    <QueryClientProvider client={queryClient}>
      <AppointmentUnavailabilityPage />
    </QueryClientProvider>,
  );
};

describe('AppointmentUnavailabilityPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Table state rendering', () => {
    it('should not render rows or empty message while loading', () => {
      setupDefaultMocks({ data: undefined, isLoading: true });
      renderComponent();
      expect(
        screen.queryByTestId('table-row-unavailability-uuid-1'),
      ).not.toBeInTheDocument();
      expect(
        screen.queryByText('No Service Unavailabilities found'),
      ).not.toBeInTheDocument();
    });

    it.each([
      {
        scenario: 'error',
        tableOverride: { isError: true },
        expectedText:
          'Failed to load Unavailability periods. Please try again.',
      },
      {
        scenario: 'empty',
        tableOverride: { data: [] },
        expectedText: 'No Service Unavailabilities found',
      },
    ])(
      'should display status message for $scenario state',
      ({ tableOverride, expectedText }) => {
        setupDefaultMocks(tableOverride);
        renderComponent();
        expect(screen.getByText(expectedText)).toBeInTheDocument();
      },
    );

    it('should render table rows when data is available', () => {
      setupDefaultMocks({ data: mockAppointmentUnavailabilities });
      renderComponent();
      expect(
        screen.getByTestId('table-row-unavailability-uuid-1'),
      ).toBeInTheDocument();
      expect(
        screen.getByTestId('table-row-unavailability-uuid-2'),
      ).toBeInTheDocument();
    });
  });

  describe('Add button visibility', () => {
    it.each([{ canAdd: true }, { canAdd: false }])(
      'should render Add New button: $canAdd when canAddUnavailability is $canAdd',
      ({ canAdd }) => {
        setupDefaultMocks();
        hasPrivilege.mockReturnValueOnce(true).mockReturnValueOnce(canAdd);
        renderComponent();
        expect(!!screen.queryByText('Add New')).toBe(canAdd);
      },
    );
  });

  describe('Form visibility', () => {
    it('should show form panel when Add New button is clicked', async () => {
      setupDefaultMocks();
      renderComponent();
      await userEvent.click(screen.getByText('Add New'));
      expect(screen.getByText('Add Unavailability')).toBeInTheDocument();
    });

    it('should hide form when Cancel is clicked (handleFormCancel)', async () => {
      setupDefaultMocks();
      renderComponent();
      await userEvent.click(screen.getByText('Add New'));
      await userEvent.click(screen.getByRole('button', { name: /cancel/i }));
      expect(screen.queryByText('Add Unavailability')).not.toBeInTheDocument();
    });
  });

  describe('handlePrimaryButtonClick', () => {
    it('should not call API when validation returns errors', async () => {
      setupDefaultMocks();
      validateUnavailabilityForm.mockReturnValue({
        startDate: 'Start date is required',
      });
      renderComponent();
      await userEvent.click(screen.getByText('Add New'));
      await userEvent.click(screen.getByRole('button', { name: /^add$/i }));
      expect(createAppointmentUnavailability).not.toHaveBeenCalled();
    });

    it('should call API with built requests when validation passes', async () => {
      setupDefaultMocks();
      renderComponent();
      await userEvent.click(screen.getByText('Add New'));
      await userEvent.click(screen.getByRole('button', { name: /^add$/i }));
      await waitFor(() => {
        expect(createAppointmentUnavailability).toHaveBeenCalledWith(
          mockRequests,
        );
      });
    });
  });

  describe('handleClearErrors', () => {
    it.each([
      {
        field: 'startTime',
        errorKey: 'startTime',
        errorMessage: 'Start time is required',
        interact: () => {
          fireEvent.change(screen.getByLabelText('Start Time*'), {
            target: { value: '10:00' },
          });
        },
      },
      {
        field: 'endTime',
        errorKey: 'endTime',
        errorMessage: 'End time is required',
        interact: () => {
          fireEvent.change(screen.getByLabelText('End Time*'), {
            target: { value: '12:00' },
          });
        },
      },
    ])(
      'clears $field error when the field value changes',
      async ({ errorKey, errorMessage, interact }) => {
        setupDefaultMocks();
        validateUnavailabilityForm.mockReturnValue({
          [errorKey]: errorMessage,
        });
        renderComponent();
        await userEvent.click(screen.getByText('Add New'));
        await userEvent.click(screen.getByRole('button', { name: /^add$/i }));
        expect(screen.getByText(errorMessage)).toBeInTheDocument();

        interact();

        await waitFor(() => {
          expect(screen.queryByText(errorMessage)).not.toBeInTheDocument();
        });
      },
    );
  });

  describe('Snapshot', () => {
    it.each([
      {
        scenario: 'with unavailabilities data',
        tableOverride: { data: mockAppointmentUnavailabilities },
      },
      { scenario: 'with empty state', tableOverride: { data: [] } },
    ])('should match snapshot $scenario', ({ tableOverride }) => {
      setupDefaultMocks(tableOverride);
      const { container } = renderComponent();
      expect(container).toMatchSnapshot();
    });
  });

  describe('Accessibility', () => {
    it.each([
      {
        scenario: 'with unavailabilities data',
        tableOverride: { data: mockAppointmentUnavailabilities },
      },
      { scenario: 'with empty state', tableOverride: { data: [] } },
    ])('passes accessibility tests $scenario', async ({ tableOverride }) => {
      setupDefaultMocks(tableOverride);
      const { container } = renderComponent();
      await act(async () => {
        const results = await axe(container);
        expect(results).toHaveNoViolations();
      });
    });
  });

  describe('handleFormSubmit', () => {
    it('should show success notification, hide form, and invalidate query on API success', async () => {
      setupDefaultMocks();
      renderComponent();
      await userEvent.click(screen.getByText('Add New'));
      await userEvent.click(screen.getByRole('button', { name: /^add$/i }));

      await waitFor(() => {
        expect(mockAddNotification).toHaveBeenCalledWith(
          expect.objectContaining({
            title: 'Success',
            message: 'Unavailability added successfully',
            type: 'success',
          }),
        );
      });
      expect(screen.queryByText('Add Unavailability')).not.toBeInTheDocument();
      expect(mockInvalidateQueries).toHaveBeenCalledWith({
        queryKey: ['appointmentUnavailabilities'],
      });
    });

    it('should show error notification and keep form visible on API failure', async () => {
      setupDefaultMocks();
      createAppointmentUnavailability.mockRejectedValue(
        new Error('API failed'),
      );
      renderComponent();
      await userEvent.click(screen.getByText('Add New'));
      await userEvent.click(screen.getByRole('button', { name: /^add$/i }));

      await waitFor(() => {
        expect(mockAddNotification).toHaveBeenCalledWith(
          expect.objectContaining({
            title: 'Add Failed',
            message: 'Failed to add Unavailability. Please try again.',
            type: 'error',
          }),
        );
      });
      expect(screen.getByText('Add Unavailability')).toBeInTheDocument();
      expect(mockInvalidateQueries).not.toHaveBeenCalled();
    });
  });
});
