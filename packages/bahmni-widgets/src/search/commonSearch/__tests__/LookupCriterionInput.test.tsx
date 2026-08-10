import {
  getAllAppointmentServices,
  getUserLoginLocation,
} from '@bahmni/services';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import LookupCriterionInput from '../inputs/LookupCriterionInput';
import { ScalarValue } from '../models';
import {
  mockAppointmentServices,
  mockLookupInput,
  mockLookupScalarValue,
  mockUnsupportedLookupInput,
  mockUserLoginLocation,
} from './__mocks__/lookupCriterionInputMocks';

jest.mock('@bahmni/services', () => ({
  ...jest.requireActual('@bahmni/services'),
  getAllAppointmentServices: jest.fn(),
  getUserLoginLocation: jest.fn(),
}));

const mockGetAllAppointmentServices =
  getAllAppointmentServices as jest.MockedFunction<
    typeof getAllAppointmentServices
  >;
const mockGetUserLoginLocation = getUserLoginLocation as jest.MockedFunction<
  typeof getUserLoginLocation
>;

const mockOnChange = jest.fn();

const renderInput = (
  value: ScalarValue | null = null,
  validationError: string | null = null,
  input = mockLookupInput,
) => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(
    <QueryClientProvider client={queryClient}>
      <LookupCriterionInput
        input={input}
        value={value}
        onChange={mockOnChange}
        validationError={validationError}
      />
    </QueryClientProvider>,
  );
};

describe('LookupCriterionInput', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetUserLoginLocation.mockReturnValue(mockUserLoginLocation);
  });

  it('shows a loading message once the user types while options are being fetched', async () => {
    mockGetAllAppointmentServices.mockReturnValue(new Promise(() => {}));
    const user = userEvent.setup();
    renderInput();
    const combobox = screen.getByTestId(
      'lookup-input-LOOKUP_PLACEHOLDER-test-id',
    );
    await user.click(combobox);
    await user.type(combobox, 'a');
    expect(
      await screen.findByRole('option', {
        name: 'COMMON_SEARCH_LOOKUP_LOADING',
      }),
    ).toBeInTheDocument();
  });

  it('shows an error message once the user types when fetching options fails', async () => {
    mockGetAllAppointmentServices.mockRejectedValue(new Error('API Error'));
    const user = userEvent.setup();
    renderInput();
    const combobox = screen.getByTestId(
      'lookup-input-LOOKUP_PLACEHOLDER-test-id',
    );
    await user.click(combobox);
    await user.type(combobox, 'a');
    expect(
      await screen.findByRole('option', {
        name: 'COMMON_SEARCH_LOOKUP_ERROR',
      }),
    ).toBeInTheDocument();
  });

  it('shows an empty message once the user types when no options are returned', async () => {
    mockGetAllAppointmentServices.mockResolvedValue([]);
    const user = userEvent.setup();
    renderInput();
    const combobox = screen.getByTestId(
      'lookup-input-LOOKUP_PLACEHOLDER-test-id',
    );
    await user.click(combobox);
    await user.type(combobox, 'a');
    expect(
      await screen.findByRole('option', {
        name: 'COMMON_SEARCH_LOOKUP_EMPTY',
      }),
    ).toBeInTheDocument();
  });

  it('shows an unsupported-source message and never calls the loader when the source has no registered loader', async () => {
    const user = userEvent.setup();
    renderInput(null, null, mockUnsupportedLookupInput);
    await user.click(
      screen.getByTestId('lookup-input-LOOKUP_PLACEHOLDER-test-id'),
    );
    expect(
      await screen.findByRole('option', {
        name: 'COMMON_SEARCH_LOOKUP_UNSUPPORTED_SOURCE',
      }),
    ).toBeInTheDocument();
    expect(mockGetAllAppointmentServices).not.toHaveBeenCalled();
  });

  it('lists matching options once the user types and calls onChange with the selected uuid and label', async () => {
    mockGetAllAppointmentServices.mockResolvedValue(mockAppointmentServices);
    const user = userEvent.setup();
    renderInput();

    const combobox = screen.getByTestId(
      'lookup-input-LOOKUP_PLACEHOLDER-test-id',
    );
    await user.click(combobox);
    await user.type(combobox, 'tb');
    await user.click(await screen.findByRole('option', { name: 'TB Program' }));

    expect(mockOnChange).toHaveBeenCalledWith({
      value: 'service-uuid-1',
      label: 'TB Program',
    });
  });

  it('calls onChange with null when the selection is cleared', async () => {
    mockGetAllAppointmentServices.mockResolvedValue(mockAppointmentServices);
    const user = userEvent.setup();
    renderInput(mockLookupScalarValue);

    await waitFor(() =>
      expect(
        screen.getByTestId('lookup-input-LOOKUP_PLACEHOLDER-test-id'),
      ).toHaveValue('TB Program'),
    );
    await user.click(
      screen.getByRole('button', { name: /clear selected item/i }),
    );

    expect(mockOnChange).toHaveBeenCalledWith(null);
  });

  it('filters options by substring match as soon as a single character is typed', async () => {
    mockGetAllAppointmentServices.mockResolvedValue(mockAppointmentServices);
    const user = userEvent.setup();
    renderInput();

    const combobox = screen.getByTestId(
      'lookup-input-LOOKUP_PLACEHOLDER-test-id',
    );
    await user.click(combobox);
    await user.type(combobox, 'b');

    expect(
      await screen.findByRole('option', { name: 'TB Program' }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole('option', { name: 'HIV Program' }),
    ).not.toBeInTheDocument();
  });

  it('shows the empty message when the typed text matches nothing', async () => {
    mockGetAllAppointmentServices.mockResolvedValue(mockAppointmentServices);
    const user = userEvent.setup();
    renderInput();

    const combobox = screen.getByTestId(
      'lookup-input-LOOKUP_PLACEHOLDER-test-id',
    );
    await user.click(combobox);
    await user.type(combobox, 'xyz');

    expect(
      await screen.findByRole('option', {
        name: 'COMMON_SEARCH_LOOKUP_EMPTY',
      }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole('option', { name: 'TB Program' }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole('option', { name: 'HIV Program' }),
    ).not.toBeInTheDocument();
  });
});
