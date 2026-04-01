import { updateProgramState, formatDateTime } from '@bahmni/services';
import {
  QueryClient,
  QueryClientProvider,
  useQuery,
} from '@tanstack/react-query';
import { render, screen, act, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { axe, toHaveNoViolations } from 'jest-axe';
import { useNotification } from '../../notification';
import { useUserPrivilege } from '../../userPrivileges/useUserPrivilege';
import { mockProgramWithAttributes } from '../__mocks__/mocks';
import ProgramDetails from '../ProgramDetails';

expect.extend(toHaveNoViolations);

jest.mock('@tanstack/react-query', () => ({
  ...jest.requireActual('@tanstack/react-query'),
  useQuery: jest.fn(),
}));
jest.mock('@bahmni/services', () => ({
  ...jest.requireActual('@bahmni/services'),
  updateProgramState: jest.fn(),
  formatDateTime: jest.fn(),
}));
jest.mock('../../notification');
jest.mock('../../userPrivileges/useUserPrivilege');

const mockAddNotification = jest.fn();
const mockFormatDateTime = formatDateTime as jest.MockedFunction<
  typeof formatDateTime
>;

describe('ProgramDetails', () => {
  const queryClient: QueryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });

  beforeEach(() => {
    jest.clearAllMocks();
    (useNotification as jest.Mock).mockReturnValue({
      addNotification: mockAddNotification,
    });
    (useUserPrivilege as jest.Mock).mockReturnValue({
      userPrivileges: [
        { uuid: 'privilege-uuid-1', name: 'Edit Patient Programs' },
      ],
    });
    mockFormatDateTime.mockReturnValue({ formattedResult: '15/01/2023' });
  });

  afterEach(() => {
    queryClient.clear();
  });

  const wrapper = (
    <QueryClientProvider client={queryClient}>
      <ProgramDetails
        programUUID="test-program-uuid"
        config={{
          fields: ['programName', 'startDate', 'endDate', 'state', 'outcome'],
        }}
      />
    </QueryClientProvider>
  );

  it('should show loading state when data is loading', () => {
    (useQuery as jest.Mock).mockReturnValue({
      data: null,
      error: null,
      isError: false,
      isLoading: true,
    });
    render(wrapper);
    expect(
      screen.getByTestId('patient-programs-table-loading-test-id'),
    ).toBeInTheDocument();
  });

  it('should show error state when an error occurs', () => {
    (useQuery as jest.Mock).mockReturnValue({
      data: null,
      error: new Error('An unexpected error occurred'),
      isError: true,
      isLoading: false,
    });
    render(wrapper);
    expect(
      screen.getByTestId('patient-programs-table-error-test-id'),
    ).toBeInTheDocument();
    expect(
      screen.getByTestId('patient-programs-table-error-test-id'),
    ).toHaveTextContent('ERROR_FETCHING_PROGRAM_DETAILS');
  });

  it('should show error state when an program uuid is falsy', () => {
    const wrapperWithAttributes = (
      <QueryClientProvider client={queryClient}>
        <ProgramDetails
          programUUID=""
          config={{
            fields: [
              'programName',
              'Registration Number',
              'Treatment Category',
              'startDate',
              'state',
            ],
          }}
        />
      </QueryClientProvider>
    );
    render(wrapperWithAttributes);
    expect(
      screen.getByTestId('patient-programs-table-error-test-id'),
    ).toBeInTheDocument();
    expect(
      screen.getByTestId('patient-programs-table-error-test-id'),
    ).toHaveTextContent('ERROR_FETCHING_PROGRAM_DETAILS');
  });

  it('should display program details and handle missing values gracefully', () => {
    (useQuery as jest.Mock).mockReturnValue({
      data: {
        id: 'program-1',
        uuid: 'program-uuid-1',
        programName: 'TB Program',
        dateEnrolled: '2023-01-15T10:30:00.000+00:00',
        dateCompleted: '2023-01-14T10:30:00.000+00:00',
        outcomeName: null,
        outcomeDetails: null,
        currentStateName: null,
        attributes: {},
        allowedStates: [],
      },
      error: null,
      isError: false,
      isLoading: false,
    });
    render(wrapper);
    expect(
      screen.getByTestId('patient-programs-tile-test-id'),
    ).toBeInTheDocument();
    expect(
      screen.getByTestId('program-details-programName-value-test-id'),
    ).toHaveTextContent('TB Program');
    expect(
      screen.getByTestId('program-details-endDate-value-test-id'),
    ).toHaveTextContent('15/01/2023');
    expect(
      screen.getByTestId('program-details-state-value-test-id'),
    ).toHaveTextContent('-');
    expect(
      screen.getByTestId('program-details-outcome-value-test-id'),
    ).toHaveTextContent('-');
  });

  it('should render custom program attributes with values and missing values', () => {
    const wrapperWithAttributes = (
      <QueryClientProvider client={queryClient}>
        <ProgramDetails
          programUUID="test-program-uuid"
          config={{
            fields: [
              'programName',
              'Registration Number',
              'Treatment Category',
              'startDate',
              'state',
            ],
          }}
        />
      </QueryClientProvider>
    );

    (useQuery as jest.Mock).mockReturnValue({
      data: {
        id: 'program-1',
        uuid: 'program-uuid-1',
        programName: 'TB Program',
        dateEnrolled: '2023-01-15T10:30:00.000+00:00',
        dateCompleted: null,
        outcomeName: null,
        outcomeDetails: null,
        currentStateName: 'Treatment Phase',
        attributes: {
          'Registration Number': 'REG123456',
        },
        allowedStates: [],
      },
      error: null,
      isError: false,
      isLoading: false,
    });

    render(wrapperWithAttributes);
    expect(
      screen.getByTestId('patient-programs-tile-test-id'),
    ).toBeInTheDocument();
    expect(
      screen.getByTestId('program-details-Registration Number-value-test-id'),
    ).toHaveTextContent('REG123456');
    expect(
      screen.getByTestId('program-details-Treatment Category-value-test-id'),
    ).toHaveTextContent('-');
  });

  it('should not render description items when config fields is undefined', () => {
    const wrapperWithoutFields = (
      <QueryClientProvider client={queryClient}>
        <ProgramDetails programUUID="test-program-uuid" config={{} as any} />
      </QueryClientProvider>
    );

    (useQuery as jest.Mock).mockReturnValue({
      data: {
        id: 'program-1',
        uuid: 'program-uuid-1',
        programName: 'TB Program',
        dateEnrolled: '2023-01-15T10:30:00.000+00:00',
        dateCompleted: null,
        outcomeName: null,
        outcomeDetails: null,
        currentStateName: 'Treatment Phase',
        attributes: {},
        allowedStates: [],
      },
      error: null,
      isError: false,
      isLoading: false,
    });

    render(wrapperWithoutFields);
    expect(
      screen.getByTestId('patient-programs-tile-test-id'),
    ).toBeInTheDocument();
    expect(screen.getByText('TB Program')).toBeInTheDocument();
    expect(
      screen.queryByTestId(/program-details-.*-value-test-id/),
    ).not.toBeInTheDocument();
  });

  it('should not render buttons when allowedStates is empty', () => {
    (useQuery as jest.Mock).mockReturnValue({
      data: {
        id: 'program-1',
        uuid: 'program-uuid-1',
        programName: 'TB Program',
        dateEnrolled: '2023-01-15T10:30:00.000+00:00',
        dateCompleted: null,
        outcomeName: null,
        outcomeDetails: null,
        currentStateName: 'Treatment Phase',
        attributes: {},
        allowedStates: [],
      },
      error: null,
      isError: false,
      isLoading: false,
    });

    render(wrapper);

    expect(
      screen.queryByTestId(
        'patient-programs-state-change-button-group-test-id',
      ),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByTestId('patient-programs-state-uuid-1-button-test-id'),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByTestId('patient-programs-state-uuid-2-button-test-id'),
    ).not.toBeInTheDocument();
  });

  it('should render individual Button components when allowedStates has less than 3 items', () => {
    (useQuery as jest.Mock).mockReturnValue({
      data: {
        id: 'program-1',
        uuid: 'program-uuid-1',
        programName: 'TB Program',
        dateEnrolled: '2023-01-15T10:30:00.000+00:00',
        dateCompleted: null,
        outcomeName: null,
        outcomeDetails: null,
        currentStateName: 'Treatment Phase',
        attributes: {},
        allowedStates: [
          { uuid: 'state-uuid-1', display: 'Follow-up Phase' },
          { uuid: 'state-uuid-2', display: 'Completed' },
        ],
      },
      error: null,
      isError: false,
      isLoading: false,
    });

    render(wrapper);

    expect(
      screen.getByTestId('patient-programs-state-uuid-1-button-test-id'),
    ).toBeInTheDocument();
    expect(
      screen.getByTestId('patient-programs-state-uuid-2-button-test-id'),
    ).toBeInTheDocument();
    expect(
      screen.queryByText('UPDATE_PROGRAM_STATE_BUTTON'),
    ).not.toBeInTheDocument();
  });

  it('should render MenuButton with MenuItems when allowedStates has 3 or more items', () => {
    (useQuery as jest.Mock).mockReturnValue({
      data: {
        id: 'program-1',
        uuid: 'program-uuid-1',
        programName: 'TB Program',
        dateEnrolled: '2023-01-15T10:30:00.000+00:00',
        dateCompleted: null,
        outcomeName: null,
        outcomeDetails: null,
        currentStateName: 'Treatment Phase',
        attributes: {},
        allowedStates: [
          { uuid: 'state-uuid-1', display: 'Treatment Phase' },
          { uuid: 'state-uuid-2', display: 'Follow-up Phase' },
          { uuid: 'state-uuid-3', display: 'Completed' },
        ],
      },
      error: null,
      isError: false,
      isLoading: false,
    });

    render(wrapper);

    expect(screen.getByText('UPDATE_PROGRAM_STATE_BUTTON')).toBeInTheDocument();
    expect(
      screen.queryByTestId('patient-programs-state-uuid-1-button-test-id'),
    ).not.toBeInTheDocument();
  });

  it('should not render buttons when user does not have Edit Patient Programs privilege', () => {
    (useUserPrivilege as jest.Mock).mockReturnValue({
      userPrivileges: [],
    });

    (useQuery as jest.Mock).mockReturnValue({
      data: {
        id: 'program-1',
        uuid: 'program-uuid-1',
        programName: 'TB Program',
        dateEnrolled: '2023-01-15T10:30:00.000+00:00',
        dateCompleted: null,
        outcomeName: null,
        outcomeDetails: null,
        currentStateName: 'Treatment Phase',
        attributes: {},
        allowedStates: [
          { uuid: 'state-uuid-1', display: 'Follow-up Phase' },
          { uuid: 'state-uuid-2', display: 'Completed' },
        ],
      },
      error: null,
      isError: false,
      isLoading: false,
    });

    render(wrapper);

    expect(
      screen.queryByTestId(
        'patient-programs-state-change-button-group-test-id',
      ),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByTestId('patient-programs-state-uuid-1-button-test-id'),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByTestId('patient-programs-state-uuid-2-button-test-id'),
    ).not.toBeInTheDocument();
  });

  it('should update state when update button is clicked', async () => {
    const mockRefetch = jest.fn();
    (useQuery as jest.Mock).mockReturnValue({
      data: {
        id: 'program-1',
        uuid: 'program-uuid-1',
        programName: 'TB Program',
        dateEnrolled: '2023-01-15T10:30:00.000+00:00',
        dateCompleted: null,
        outcomeName: null,
        outcomeDetails: null,
        currentStateName: 'Treatment Phase',
        attributes: {},
        allowedStates: [
          { uuid: 'allowed-state-2', display: 'Follow-up Phase' },
          { uuid: 'allowed-state-3', display: 'Completed' },
        ],
      },
      error: null,
      isError: false,
      isLoading: false,
      refetch: mockRefetch,
    });

    const updatedMockProgram = {
      ...mockProgramWithAttributes,
      states: [
        {
          ...mockProgramWithAttributes.states[0],
          state: {
            ...mockProgramWithAttributes.states[0].state,
            uuid: 'allowed-state-2',
            display: 'Follow-up Phase',
            concept: {
              ...mockProgramWithAttributes.states[0].state.concept,
              display: 'Follow-up Phase',
              name: {
                ...mockProgramWithAttributes.states[0].state.concept.name,
                display: 'Follow-up Phase',
                name: 'Follow-up Phase',
              },
            },
          },
        },
      ],
    };

    (updateProgramState as jest.Mock).mockImplementation(
      () =>
        new Promise((resolve) => {
          setTimeout(() => resolve(updatedMockProgram), 100);
        }),
    );

    render(wrapper);

    const button = screen.getByTestId(
      'patient-programs-allowed-state-2-button-test-id',
    );

    await userEvent.click(button);

    expect(
      screen.getByTestId('patient-programs-table-loading-test-id'),
    ).toBeInTheDocument();

    await waitFor(() => {
      expect(mockAddNotification).toHaveBeenCalledWith({
        type: 'success',
        title: 'PROGRAM_STATE_UPDATED_SUCCESSFULLY_TITLE',
        message: 'PROGRAM_STATE_UPDATED_SUCCESSFULLY_MESSAGE',
      });
      expect(updateProgramState).toHaveBeenCalledWith(
        'test-program-uuid',
        'allowed-state-2',
      );
      expect(mockRefetch).toHaveBeenCalled();
      expect(
        screen.getByTestId('patient-programs-tile-test-id'),
      ).toBeInTheDocument();
      expect(
        screen.getByTestId('patient-programs-allowed-state-2-button-test-id'),
      ).toHaveTextContent('Follow-up Phase');
    });
  });

  it('should show notification when program state update fails', async () => {
    (useQuery as jest.Mock).mockReturnValue({
      data: {
        id: 'program-1',
        uuid: 'program-uuid-1',
        programName: 'TB Program',
        dateEnrolled: '2023-01-15T10:30:00.000+00:00',
        dateCompleted: null,
        outcomeName: null,
        outcomeDetails: null,
        currentStateName: 'Treatment Phase',
        attributes: {},
        allowedStates: [
          { uuid: 'allowed-state-2', display: 'Follow-up Phase' },
          { uuid: 'allowed-state-3', display: 'Completed' },
        ],
      },
      error: null,
      isError: false,
      isLoading: false,
    });

    (updateProgramState as jest.Mock).mockRejectedValue(
      new Error('Failed to update program state'),
    );

    render(wrapper);

    const button = screen.getByTestId(
      'patient-programs-allowed-state-2-button-test-id',
    );

    await userEvent.click(button);

    await waitFor(() => {
      expect(mockAddNotification).toHaveBeenCalledWith({
        type: 'error',
        title: 'PROGRAM_DETAILS_STATE_CHANGE_ERROR_TITLE',
        message: 'PROGRAM_DETAILS_ERROR_UPDATING_STATE',
      });
    });
  });

  describe('Snapshot', () => {
    it('should match snapshot with program data', () => {
      (useQuery as jest.Mock).mockReturnValue({
        data: {
          id: 'program-1',
          uuid: 'program-uuid-1',
          programName: 'HIV Program',
          dateEnrolled: '2023-01-15T10:30:00.000+00:00',
          dateCompleted: null,
          outcomeName: null,
          outcomeDetails: null,
          currentStateName: 'On ART',
          attributes: {},
          allowedStates: [],
        },
        error: null,
        isError: false,
        isLoading: false,
      });
      const { container } = render(wrapper);
      expect(container).toMatchSnapshot();
    });
  });

  describe('Accessibility', () => {
    it('passes accessibility tests with data', async () => {
      (useQuery as jest.Mock).mockReturnValue({
        data: {
          id: 'program-1',
          uuid: 'program-uuid-1',
          programName: 'HIV Program',
          dateEnrolled: '2023-01-15T10:30:00.000+00:00',
          dateCompleted: null,
          outcomeName: null,
          outcomeDetails: null,
          currentStateName: 'On ART',
          attributes: {},
          allowedStates: [],
        },
        error: null,
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
