import { getProgramByUUID, updateProgramState } from '@bahmni/services';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useNotification } from '../../notification';
import { useUserPrivilege } from '../../userPrivileges/useUserPrivilege';
import { mockProgramWithAttributes } from '../__mocks__/mocks';
import ProgramDetails from '../ProgramDetails';

jest.mock('@bahmni/services', () => ({
  ...jest.requireActual('@bahmni/services'),
  getProgramByUUID: jest.fn(),
  updateProgramState: jest.fn(),
}));
jest.mock('../../notification');
jest.mock('../../userPrivileges/useUserPrivilege');

describe('ProgramDetails Integration', () => {
  const queryClient: QueryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        staleTime: 0,
      },
    },
  });

  beforeEach(() => {
    jest.clearAllMocks();
    (useNotification as jest.Mock).mockReturnValue({
      addNotification: jest.fn(),
    });
    (useUserPrivilege as jest.Mock).mockReturnValue({
      userPrivileges: [
        { uuid: 'privilege-uuid-1', name: 'Edit Patient Programs' },
      ],
    });
  });

  afterEach(() => {
    queryClient.clear();
  });

  it('should fetch and display program details correctly', async () => {
    (getProgramByUUID as jest.Mock).mockResolvedValue(
      mockProgramWithAttributes,
    );

    render(
      <QueryClientProvider client={queryClient}>
        <ProgramDetails
          programUUID="enrollment-uuid-2"
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
      </QueryClientProvider>,
    );

    expect(
      screen.getByTestId('patient-programs-table-loading-test-id'),
    ).toBeInTheDocument();

    await waitFor(() => {
      expect(
        screen.getByTestId('patient-programs-tile-test-id'),
      ).toBeInTheDocument();
    });

    expect(
      screen.getByTestId('program-details-programName-value-test-id'),
    ).toHaveTextContent('TB Program');
    expect(screen.getByTestId('program-status-test-id')).toHaveTextContent(
      'Treatment Phase',
    );
    expect(screen.getByText('REG123456')).toBeInTheDocument();
    expect(screen.getByText('Category I')).toBeInTheDocument();

    expect(getProgramByUUID).toHaveBeenCalledTimes(1);
    expect(getProgramByUUID).toHaveBeenCalledWith('enrollment-uuid-2');
  });

  it('should show error state when an error occurs', async () => {
    const errorMessage = 'Failed to fetch program details from server';
    (getProgramByUUID as jest.Mock).mockRejectedValue(new Error(errorMessage));

    render(
      <QueryClientProvider client={queryClient}>
        <ProgramDetails
          programUUID="enrollment-uuid-1"
          config={{
            fields: ['programName', 'startDate', 'endDate', 'state'],
          }}
        />
      </QueryClientProvider>,
    );

    expect(
      screen.getByTestId('patient-programs-table-loading-test-id'),
    ).toBeInTheDocument();

    await waitFor(() => {
      expect(
        screen.getByTestId('patient-programs-table-error-test-id'),
      ).toBeInTheDocument();
    });

    expect(
      screen.getByText('ERROR_FETCHING_PROGRAM_DETAILS'),
    ).toBeInTheDocument();
  });

  it('should update program state when menu item is clicked', async () => {
    (getProgramByUUID as jest.Mock).mockResolvedValue(
      mockProgramWithAttributes,
    );

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

    (updateProgramState as jest.Mock).mockResolvedValue(updatedMockProgram);

    render(
      <QueryClientProvider client={queryClient}>
        <ProgramDetails
          programUUID="enrollment-uuid-2"
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
      </QueryClientProvider>,
    );

    await waitFor(() => {
      expect(
        screen.getByTestId('patient-programs-tile-test-id'),
      ).toBeInTheDocument();
    });

    expect(screen.getByTestId('program-status-test-id')).toHaveTextContent(
      'Treatment Phase',
    );

    const menuButton = screen.getByText('UPDATE_PROGRAM_STATE_BUTTON');
    await userEvent.click(menuButton);

    const menuItem = await screen.findByText('Follow-up Phase');
    await userEvent.click(menuItem);

    await waitFor(() => {
      expect(updateProgramState).toHaveBeenCalledWith(
        'enrollment-uuid-2',
        'allowed-state-2',
      );
    });

    await waitFor(() => {
      expect(screen.getByTestId('program-status-test-id')).toBeInTheDocument();
    });
  });

  it('should show notification when program state update fails', async () => {
    const mockAddNotification = jest.fn();
    (useNotification as jest.Mock).mockReturnValue({
      addNotification: mockAddNotification,
    });

    (getProgramByUUID as jest.Mock).mockResolvedValue(
      mockProgramWithAttributes,
    );

    (updateProgramState as jest.Mock).mockRejectedValue(
      new Error('Failed to update program state'),
    );

    render(
      <QueryClientProvider client={queryClient}>
        <ProgramDetails
          programUUID="enrollment-uuid-2"
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
      </QueryClientProvider>,
    );

    await waitFor(() => {
      expect(
        screen.getByTestId('patient-programs-tile-test-id'),
      ).toBeInTheDocument();
    });

    const menuButton = screen.getByText('UPDATE_PROGRAM_STATE_BUTTON');
    await userEvent.click(menuButton);

    const menuItem = await screen.findByText('Follow-up Phase');
    await userEvent.click(menuItem);

    await waitFor(() => {
      expect(mockAddNotification).toHaveBeenCalledWith({
        type: 'error',
        title: 'PROGRAM_DETAILS_STATE_CHANGE_ERROR_TITLE',
        message: 'PROGRAM_DETAILS_ERROR_UPDATING_STATE',
      });
    });
  });

  it('should parse error message with brackets and convert to translation key', async () => {
    const mockAddNotification = jest.fn();
    (useNotification as jest.Mock).mockReturnValue({
      addNotification: mockAddNotification,
    });

    (getProgramByUUID as jest.Mock).mockResolvedValue(
      mockProgramWithAttributes,
    );

    (updateProgramState as jest.Mock).mockRejectedValue(
      new Error('Operation failed [invalidStateTransition] for program'),
    );

    render(
      <QueryClientProvider client={queryClient}>
        <ProgramDetails
          programUUID="enrollment-uuid-2"
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
      </QueryClientProvider>,
    );

    await waitFor(() => {
      expect(
        screen.getByTestId('patient-programs-tile-test-id'),
      ).toBeInTheDocument();
    });

    const menuButton = screen.getByText('UPDATE_PROGRAM_STATE_BUTTON');
    await userEvent.click(menuButton);

    const menuItem = await screen.findByText('Follow-up Phase');
    await userEvent.click(menuItem);

    await waitFor(() => {
      expect(mockAddNotification).toHaveBeenCalledWith({
        type: 'error',
        title: 'PROGRAM_DETAILS_STATE_CHANGE_ERROR_TITLE',
        message: 'INVALID_STATE_TRANSITION',
      });
    });
  });
});
