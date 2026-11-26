import { updateProgramState, formatDateTime } from '@bahmni/services';
import * as BahmniServices from '@bahmni/services';
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
          fields: [
            { name: 'programName' },
            { name: 'startDate' },
            { name: 'endDate' },
            { name: 'state' },
            { name: 'outcome' },
          ],
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
              { name: 'programName' },
              { name: 'Registration Number' },
              { name: 'Treatment Category' },
              { name: 'startDate' },
              { name: 'state' },
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
              { name: 'programName' },
              { name: 'Registration Number' },
              { name: 'Treatment Category' },
              { name: 'startDate' },
              { name: 'state' },
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

  it('should render the care manager value when present', () => {
    (useQuery as jest.Mock).mockReturnValue({
      data: {
        id: 'program-1',
        uuid: 'program-uuid-1',
        programName: 'TB Program',
        dateEnrolled: '2023-01-15T10:30:00.000+00:00',
        dateCompleted: null,
        outcomeName: null,
        outcomeDetails: null,
        currentStateName: null,
        careManagerDisplay: 'Dr. Test',
        attributes: {},
        allowedStates: [],
      },
      error: null,
      isError: false,
      isLoading: false,
    });

    render(
      <QueryClientProvider client={queryClient}>
        <ProgramDetails
          programUUID="test-program-uuid"
          config={{
            fields: [{ name: 'programName' }, { name: 'careManager' }],
          }}
        />
      </QueryClientProvider>,
    );

    expect(
      screen.getByTestId('program-details-careManager-value-test-id'),
    ).toHaveTextContent('Dr. Test');
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

  it.each([
    [1, [{ uuid: 'state-uuid-1', display: 'Follow-up Phase' }]],
    [
      3,
      [
        { uuid: 'state-uuid-1', display: 'Treatment Phase' },
        { uuid: 'state-uuid-2', display: 'Follow-up Phase' },
        { uuid: 'state-uuid-3', display: 'Completed' },
      ],
    ],
  ])(
    'should render %i allowed state(s) as items of the Actions dropdown',
    async (count, allowedStates) => {
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
          allowedStates,
        },
        error: null,
        isError: false,
        isLoading: false,
      });

      render(wrapper);

      expect(
        screen.queryByTestId('patient-programs-state-uuid-1-button-test-id'),
      ).not.toBeInTheDocument();

      await userEvent.click(screen.getByText('PROGRAM_ACTIONS_BUTTON'));

      expect(screen.getAllByRole('menuitem')).toHaveLength(count);
      expect(
        screen.getByTestId('patient-programs-state-uuid-1-button-test-id'),
      ).toBeInTheDocument();
    },
  );

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

  describe('Cancel action', () => {
    const cancelAction = {
      type: 'cancel',
      label: 'PROGRAM_ACTION_CANCEL_EOC',
      stateConceptUuid: 'cancelled-concept-uuid',
      requiredPrivileges: ['app:eoc:cancel'],
      metadata: { reasonConceptSetUuid: 'reason-set-uuid' },
    };
    const finaliseState = {
      uuid: 'state-uuid-1',
      display: 'Finalised',
      conceptUuid: 'finalised-concept-uuid',
    };
    const cancelledState = {
      uuid: 'cancelled-state-uuid',
      display: 'Assessment Cancelled',
      conceptUuid: 'cancelled-concept-uuid',
    };

    const renderWithAllowedStates = (
      allowedStates: (typeof finaliseState)[],
      privileges = ['Edit Patient Programs', 'app:eoc:cancel'],
    ) => {
      (useUserPrivilege as jest.Mock).mockReturnValue({
        userPrivileges: privileges.map((name, i) => ({
          uuid: `privilege-uuid-${i}`,
          name,
        })),
      });
      (useQuery as jest.Mock).mockReturnValue({
        data: {
          id: 'program-1',
          uuid: 'program-uuid-1',
          programName: 'HA Program',
          dateEnrolled: '2023-01-15T10:30:00.000+00:00',
          dateCompleted: null,
          outcomeName: null,
          outcomeDetails: null,
          currentStateName: 'Completed',
          attributes: {},
          allowedStates,
        },
        error: null,
        isError: false,
        isLoading: false,
      });

      render(
        <QueryClientProvider client={queryClient}>
          <ProgramDetails
            programUUID="test-program-uuid"
            config={{
              fields: [{ name: 'programName' }],
              actions: [cancelAction],
            }}
          />
        </QueryClientProvider>,
      );
    };

    it('should show the other allowed states and the configured Cancel in an Actions dropdown', async () => {
      renderWithAllowedStates([finaliseState, cancelledState]);

      await userEvent.click(screen.getByText('PROGRAM_ACTIONS_BUTTON'));

      const items = screen.getAllByRole('menuitem');
      expect(items).toHaveLength(2);
      expect(items[0]).toHaveTextContent('Finalised');
      expect(items[1]).toHaveTextContent('PROGRAM_ACTION_CANCEL_EOC');
    });

    it('should not offer the cancelled state in any form when the user lacks the action privilege', async () => {
      renderWithAllowedStates(
        [finaliseState, cancelledState],
        ['Edit Patient Programs'],
      );

      await userEvent.click(screen.getByText('PROGRAM_ACTIONS_BUTTON'));

      const items = screen.getAllByRole('menuitem');
      expect(items).toHaveLength(1);
      expect(items[0]).toHaveTextContent('Finalised');
    });

    it('should only list the allowed states when the cancelled state is not allowed', async () => {
      renderWithAllowedStates([finaliseState]);

      await userEvent.click(screen.getByText('PROGRAM_ACTIONS_BUTTON'));

      const items = screen.getAllByRole('menuitem');
      expect(items).toHaveLength(1);
      expect(items[0]).toHaveTextContent('Finalised');
    });
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

    await userEvent.click(screen.getByText('PROGRAM_ACTIONS_BUTTON'));
    await userEvent.click(
      screen.getByTestId('patient-programs-allowed-state-2-button-test-id'),
    );

    expect(
      await screen.findByTestId('program-details-loading-overlay-test-id'),
    ).toBeInTheDocument();
    expect(
      screen.getByTestId('patient-programs-tile-test-id'),
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

    await userEvent.click(screen.getByText('PROGRAM_ACTIONS_BUTTON'));
    await userEvent.click(
      screen.getByTestId('patient-programs-allowed-state-2-button-test-id'),
    );

    await waitFor(() => {
      expect(mockAddNotification).toHaveBeenCalledWith({
        type: 'error',
        title: 'PROGRAM_DETAILS_STATE_CHANGE_ERROR_TITLE',
        message: 'PROGRAM_DETAILS_ERROR_UPDATING_STATE',
      });
    });
  });

  describe('renderAttributeValue', () => {
    const mockQueryData = {
      id: 'program-1',
      uuid: 'program-uuid-1',
      programName: 'TB Program',
      dateEnrolled: '2023-01-15T10:30:00.000+00:00',
      dateCompleted: null,
      outcomeName: null,
      outcomeDetails: null,
      currentStateName: 'Treatment Phase',
      attributes: {
        treatmentCategory: 'categoryI',
      },
      allowedStates: [],
    };

    it('should call formatDateTime and render the result when attribute value is of Date type', () => {
      mockFormatDateTime.mockReturnValue({ formattedResult: '04/02/2026' });

      (useQuery as jest.Mock).mockReturnValue({
        data: {
          ...mockQueryData,
          attributes: {
            treatmentDate: new Date('2026-02-04T00:00:00.000Z'),
          },
        },
        error: null,
        isError: false,
        isLoading: false,
      });

      render(
        <QueryClientProvider client={queryClient}>
          <ProgramDetails
            programUUID="test-program-uuid"
            config={{
              fields: [{ name: 'treatmentDate' }],
            }}
          />
        </QueryClientProvider>,
      );

      expect(mockFormatDateTime).toHaveBeenCalledWith(
        new Date('2026-02-04T00:00:00.000Z'),
        expect.any(Function),
      );
      expect(
        screen.getByTestId('program-details-treatmentDate-value-test-id'),
      ).toHaveTextContent('04/02/2026');
    });

    it('should render raw attribute value when field is not in enableTranslation', () => {
      (useQuery as jest.Mock).mockReturnValue({
        data: mockQueryData,
        error: null,
        isError: false,
        isLoading: false,
      });

      render(
        <QueryClientProvider client={queryClient}>
          <ProgramDetails
            programUUID="test-program-uuid"
            config={{
              fields: [{ name: 'treatmentCategory' }],
            }}
          />
        </QueryClientProvider>,
      );

      expect(
        screen.getByTestId('program-details-treatmentCategory-value-test-id'),
      ).toHaveTextContent('categoryI');
    });

    it('should return "-" for missing attribute when field is in enableTranslation', () => {
      (useQuery as jest.Mock).mockReturnValue({
        data: mockQueryData,
        error: null,
        isError: false,
        isLoading: false,
      });

      render(
        <QueryClientProvider client={queryClient}>
          <ProgramDetails
            programUUID="test-program-uuid"
            config={{
              fields: [{ name: 'missingField', enableTranslation: true }],
            }}
          />
        </QueryClientProvider>,
      );

      expect(
        screen.getByTestId('program-details-missingField-value-test-id'),
      ).toHaveTextContent('-');
    });

    it('should call t() with correct EOC key and render translated value when field is in enableTranslation', () => {
      const mockT = jest.fn((key: string, fallback: string) => fallback);
      const useTranslationSpy = jest
        .spyOn(BahmniServices, 'useTranslation')
        .mockReturnValue({ t: mockT });

      (useQuery as jest.Mock).mockReturnValue({
        data: mockQueryData,
        error: null,
        isError: false,
        isLoading: false,
      });

      render(
        <QueryClientProvider client={queryClient}>
          <ProgramDetails
            programUUID="test-program-uuid"
            config={{
              fields: [{ name: 'treatmentCategory', enableTranslation: true }],
            }}
          />
        </QueryClientProvider>,
      );

      expect(mockT).toHaveBeenCalledWith(
        'PROGRAM_ATTRIBUTE_VALUE_TREATMENT_CATEGORY_CATEGORY_I',
        'categoryI',
      );
      expect(
        screen.getByTestId('program-details-treatmentCategory-value-test-id'),
      ).toHaveTextContent('categoryI');

      useTranslationSpy.mockRestore();
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
