import { getTasks, shouldEnableEncounterFilter } from '@bahmni/services';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, waitFor } from '@testing-library/react';
import { TaskActionType, TaskViewType } from '../constants';
import TaskList from '../TaskList';
import { mockTaskConfigWithViews } from './__mocks__/configMocks';
import {
  mockTasksBundle,
  emptyTasksBundle,
  mockTasksControlConfigNoFitlers,
  mockTasksControlConfigWithActions,
  mockError,
} from './__mocks__/taskListMocks';

jest.mock('@bahmni/services', () => ({
  ...jest.requireActual('@bahmni/services'),
  getTasks: jest.fn(),
  shouldEnableEncounterFilter: jest.fn(),
  useSubscribeConsultationSaved: jest.fn((callback) => {
    // Store callback for testing
    (globalThis as any).__consultationSavedCallback = callback;
  }),
  fetchObservationForms: jest.fn(() => Promise.resolve([])),
  hasPrivilege: jest.fn(() => true),
}));

jest.mock('../../hooks/usePatientUUID', () => ({
  usePatientUUID: jest.fn(() => 'patient-uuid'),
}));

jest.mock('../../userPrivileges/useUserPrivilege', () => ({
  useUserPrivilege: jest.fn(() => ({
    userPrivileges: [{ name: 'Edit Vitals', retired: false }],
  })),
}));

const mockGetTasks = getTasks as jest.MockedFunction<typeof getTasks>;
const mockShouldEnableEncounterFilter =
  shouldEnableEncounterFilter as jest.MockedFunction<
    typeof shouldEnableEncounterFilter
  >;

let queryClient: QueryClient;

const createWrapper = () => {
  queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        staleTime: 0,
        gcTime: 0,
      },
    },
  });

  // eslint-disable-next-line react/display-name
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
};

describe('TaskList', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockShouldEnableEncounterFilter.mockReturnValue(false);
  });

  describe('Data Fetching', () => {
    it('should fetch and display tasks when data is available', async () => {
      mockGetTasks.mockResolvedValue(mockTasksBundle);

      render(<TaskList config={mockTasksControlConfigNoFitlers} />, {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(screen.getByTestId('tasks-table')).toBeInTheDocument();
      });

      expect(mockGetTasks).toHaveBeenCalledWith('patient-uuid', undefined);
    });

    it('should pass orderReference when provided', async () => {
      mockGetTasks.mockResolvedValue(mockTasksBundle);

      render(
        <TaskList
          config={mockTasksControlConfigNoFitlers}
          orderReference="ServiceRequest/order-123"
        />,
        { wrapper: createWrapper() },
      );

      await waitFor(() => {
        expect(mockGetTasks).toHaveBeenCalledWith(
          'patient-uuid',
          'ServiceRequest/order-123',
        );
      });
    });

    it('should not fetch when encounterFilter is empty', () => {
      mockShouldEnableEncounterFilter.mockReturnValue(true);

      render(
        <TaskList
          config={mockTasksControlConfigNoFitlers}
          episodeOfCareUuids={[]}
          encounterUuids={[]}
        />,
        { wrapper: createWrapper() },
      );

      expect(screen.getByTestId('task-list-empty')).toBeInTheDocument();
      expect(mockGetTasks).not.toHaveBeenCalled();
    });
  });

  describe('Loading and Error States', () => {
    it('should display loading state while fetching', () => {
      mockGetTasks.mockImplementation(
        () => new Promise(() => {}), // Never resolves
      );

      render(<TaskList config={mockTasksControlConfigNoFitlers} />, {
        wrapper: createWrapper(),
      });

      expect(screen.getByTestId('tasks-table-skeleton')).toBeInTheDocument();
    });

    it('should display error state when fetch fails', async () => {
      mockGetTasks.mockRejectedValue(mockError);

      render(<TaskList config={mockTasksControlConfigNoFitlers} />, {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(screen.getByTestId('tasks-table-error')).toBeInTheDocument();
        expect(screen.getByText('TASKS_LOADING_ERROR')).toBeInTheDocument();
      });
    });

    it('should display empty state when no tasks are returned', async () => {
      mockGetTasks.mockResolvedValue(emptyTasksBundle);

      render(<TaskList config={mockTasksControlConfigNoFitlers} />, {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        const table = screen.getByTestId('tasks-table');
        expect(table).toHaveTextContent('TASKS_NOT_FOUND');
      });
    });
  });

  describe('Task Rendering', () => {
    beforeEach(() => {
      mockGetTasks.mockResolvedValue(mockTasksBundle);
    });

    it('should render all column headers', async () => {
      render(<TaskList config={mockTasksControlConfigNoFitlers} />, {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(screen.getByText('TASK_NAME')).toBeInTheDocument();
      });

      expect(screen.getByText('TASK_COMPLETED_BY')).toBeInTheDocument();
      expect(screen.getByText('TASK_COMPLETED_ON')).toBeInTheDocument();
      expect(screen.getByText('TASK_STATUS')).toBeInTheDocument();
    });

    it('should render task data in table cells', async () => {
      render(<TaskList config={mockTasksControlConfigNoFitlers} />, {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(screen.getByText('Vitals Form')).toBeInTheDocument();
      });

      expect(screen.getByText('Physical Exam')).toBeInTheDocument();
      expect(screen.getByText('Lab Review')).toBeInTheDocument();
      expect(screen.getByText('Complete Patient Intake')).toBeInTheDocument();
    });

    it.each([
      ['task-1', 'TASK_STATUS_COMPLETED'],
      ['task-2', 'TASK_STATUS_IN_PROGRESS'],
      ['task-3', 'TASK_STATUS_REQUESTED'],
      ['parent-task-1', 'TASK_STATUS_IN_PROGRESS'],
    ])(
      'should render status badge for task %s with %s',
      async (taskId, statusKey) => {
        render(<TaskList config={mockTasksControlConfigNoFitlers} />, {
          wrapper: createWrapper(),
        });

        await waitFor(() => {
          const statusBadge = screen.getByTestId(`task-status-${taskId}`);
          expect(statusBadge).toBeInTheDocument();
          expect(statusBadge).toHaveTextContent(statusKey);
        });
      },
    );

    it('should display dash for missing completedBy and completedOn fields', async () => {
      render(<TaskList config={mockTasksControlConfigNoFitlers} />, {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        const dashes = screen.getAllByText('-');
        expect(dashes.length).toBeGreaterThan(0);
      });
    });
  });

  describe('Leaf Task Filtering', () => {
    beforeEach(() => {
      mockGetTasks.mockResolvedValue(mockTasksBundle);
    });

    it('should filter to show only leaf tasks when showOnlyLeafTasks is true', async () => {
      render(<TaskList config={{ showOnlyLeafTasks: true }} />, {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(screen.getByText('Vitals Form')).toBeInTheDocument();
      });

      // Leaf tasks should be visible
      expect(screen.getByText('Physical Exam')).toBeInTheDocument();
      expect(screen.getByText('Lab Review')).toBeInTheDocument();

      // Parent task should NOT be visible (it's referenced in partOf)
      expect(
        screen.queryByText('Complete Patient Intake'),
      ).not.toBeInTheDocument();
    });

    it('should show all tasks when showOnlyLeafTasks is false', async () => {
      render(<TaskList config={{ showOnlyLeafTasks: false }} />, {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(screen.getByText('Vitals Form')).toBeInTheDocument();
      });

      expect(screen.getByText('Physical Exam')).toBeInTheDocument();
      expect(screen.getByText('Lab Review')).toBeInTheDocument();
      expect(screen.getByText('Complete Patient Intake')).toBeInTheDocument();
    });

    it('should default to showing all tasks when config is not specified', async () => {
      render(<TaskList />, { wrapper: createWrapper() });

      await waitFor(() => {
        expect(screen.getByText('Vitals Form')).toBeInTheDocument();
      });

      expect(screen.getByText('Physical Exam')).toBeInTheDocument();
      expect(screen.getByText('Lab Review')).toBeInTheDocument();
      expect(screen.getByText('Complete Patient Intake')).toBeInTheDocument();
    });
  });

  describe('Task Type Filtering', () => {
    beforeEach(() => {
      mockGetTasks.mockResolvedValue(mockTasksBundle);
    });

    it('should filter tasks by taskTypes when specified', async () => {
      render(
        <TaskList
          config={{
            showOnlyLeafTasks: false,
            taskTypes: [
              '6501d0f9-98da-44be-afc9-e2319453f0d6', // Vitals
              '7601d0f9-98da-44be-afc9-e2319453f0d7', // Physical Exam
            ],
          }}
        />,
        { wrapper: createWrapper() },
      );

      await waitFor(() => {
        expect(screen.getByText('Vitals Form')).toBeInTheDocument();
      });

      expect(screen.getByText('Physical Exam')).toBeInTheDocument();
      expect(screen.queryByText('Lab Review')).not.toBeInTheDocument();
      expect(
        screen.queryByText('Complete Patient Intake'),
      ).not.toBeInTheDocument();
    });

    it('should show all tasks when taskTypes is not specified', async () => {
      render(<TaskList config={{ showOnlyLeafTasks: false }} />, {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(screen.getByText('Vitals Form')).toBeInTheDocument();
      });

      expect(screen.getByText('Physical Exam')).toBeInTheDocument();
      expect(screen.getByText('Lab Review')).toBeInTheDocument();
      expect(screen.getByText('Complete Patient Intake')).toBeInTheDocument();
    });
  });

  describe('Combined Filtering', () => {
    beforeEach(() => {
      mockGetTasks.mockResolvedValue(mockTasksBundle);
    });

    it('should apply both leaf task and taskTypes filtering', async () => {
      render(
        <TaskList
          config={{
            showOnlyLeafTasks: true,
            taskTypes: ['6501d0f9-98da-44be-afc9-e2319453f0d6'], // Only Vitals
          }}
        />,
        { wrapper: createWrapper() },
      );

      await waitFor(() => {
        expect(screen.getByText('Vitals Form')).toBeInTheDocument();
      });

      // Other tasks should be filtered out
      expect(screen.queryByText('Physical Exam')).not.toBeInTheDocument();
      expect(screen.queryByText('Lab Review')).not.toBeInTheDocument();
      expect(
        screen.queryByText('Complete Patient Intake'),
      ).not.toBeInTheDocument();
    });
  });

  describe('Encounter Filtering', () => {
    it('should pass encounterUuids to query key for cache invalidation', async () => {
      mockGetTasks.mockResolvedValue(mockTasksBundle);

      const { rerender } = render(
        <TaskList
          config={mockTasksControlConfigNoFitlers}
          encounterUuids={['encounter-1']}
        />,
        { wrapper: createWrapper() },
      );

      await waitFor(() => {
        expect(screen.getByTestId('tasks-table')).toBeInTheDocument();
      });

      // Changing encounterUuids should trigger new query
      rerender(
        <TaskList
          config={mockTasksControlConfigNoFitlers}
          encounterUuids={['encounter-2']}
        />,
      );

      await waitFor(() => {
        expect(mockGetTasks).toHaveBeenCalledTimes(2);
      });
    });
  });

  describe('Actions Column', () => {
    beforeEach(() => {
      mockGetTasks.mockResolvedValue(mockTasksBundle);
    });

    it('should show actions column header when taskConfig exists', async () => {
      render(<TaskList config={mockTasksControlConfigWithActions} />, {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(screen.getByText('TASK_ACTIONS')).toBeInTheDocument();
      });
    });

    it('should not show actions column when no taskConfig', async () => {
      render(<TaskList config={mockTasksControlConfigNoFitlers} />, {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(screen.getByTestId('tasks-table')).toBeInTheDocument();
      });

      expect(screen.queryByText('TASK_ACTIONS')).not.toBeInTheDocument();
    });

    it('should not show actions column when taskConfig is empty', async () => {
      render(
        <TaskList config={{ showOnlyLeafTasks: false, taskConfig: [] }} />,
        {
          wrapper: createWrapper(),
        },
      );

      await waitFor(() => {
        expect(screen.getByTestId('tasks-table')).toBeInTheDocument();
      });

      expect(screen.queryByText('TASK_ACTIONS')).not.toBeInTheDocument();
    });

    it('should not show actions column when taskConfig has no actions', async () => {
      const configWithoutActions = {
        showOnlyLeafTasks: false,
        taskConfig: [{ taskCode: 'some-code', actions: [] }],
      };

      render(<TaskList config={configWithoutActions} />, {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(screen.getByTestId('tasks-table')).toBeInTheDocument();
      });

      expect(screen.queryByText('TASK_ACTIONS')).not.toBeInTheDocument();
    });
  });

  describe('Results Column', () => {
    beforeEach(() => {
      mockGetTasks.mockResolvedValue(mockTasksBundle);
    });

    it('should show results column header when taskConfig has views', async () => {
      const configWithViews = {
        showOnlyLeafTasks: false,
        taskConfig: mockTaskConfigWithViews,
      };

      render(<TaskList config={configWithViews} />, {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(screen.getByText('TASK_RESULTS')).toBeInTheDocument();
      });
    });

    it('should not show results column when no taskConfig', async () => {
      render(<TaskList config={mockTasksControlConfigNoFitlers} />, {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(screen.getByTestId('tasks-table')).toBeInTheDocument();
      });

      expect(screen.queryByText('TASK_RESULTS')).not.toBeInTheDocument();
    });

    it('should not show results column when taskConfig is empty', async () => {
      render(
        <TaskList config={{ showOnlyLeafTasks: false, taskConfig: [] }} />,
        {
          wrapper: createWrapper(),
        },
      );

      await waitFor(() => {
        expect(screen.getByTestId('tasks-table')).toBeInTheDocument();
      });

      expect(screen.queryByText('TASK_RESULTS')).not.toBeInTheDocument();
    });

    it('should not show results column when taskConfig has no views', async () => {
      const configWithoutViews = {
        showOnlyLeafTasks: false,
        taskConfig: [{ taskCode: 'some-code', actions: [] }],
      };

      render(<TaskList config={configWithoutViews} />, {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(screen.getByTestId('tasks-table')).toBeInTheDocument();
      });

      expect(screen.queryByText('TASK_RESULTS')).not.toBeInTheDocument();
    });

    it('should not show results column when taskConfig has empty views array', async () => {
      const configWithEmptyViews = {
        showOnlyLeafTasks: false,
        taskConfig: [{ taskCode: 'some-code', views: [] }],
      };

      render(<TaskList config={configWithEmptyViews} />, {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(screen.getByTestId('tasks-table')).toBeInTheDocument();
      });

      expect(screen.queryByText('TASK_RESULTS')).not.toBeInTheDocument();
    });

    it('should show both Results and Actions columns when both exist', async () => {
      const configWithBoth = {
        showOnlyLeafTasks: false,
        taskConfig: [
          {
            taskCode: 'some-code',
            actions: [
              {
                label: 'Test Action',
                type: TaskActionType.LAUNCH_FORM,
                icon: 'edit',
                requiredPrivileges: [],
                handlerConfig: {},
              },
            ],
            views: [
              {
                label: 'Test View',
                type: TaskViewType.VIEW_FORM,
                requiredPrivileges: [],
                handlerConfig: { formInputCode: 'test' },
              },
            ],
          },
        ],
      };

      render(<TaskList config={configWithBoth} />, {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(screen.getByText('TASK_RESULTS')).toBeInTheDocument();
        expect(screen.getByText('TASK_ACTIONS')).toBeInTheDocument();
      });
    });

    it('should show Results column but not Actions column when only views exist', async () => {
      const configWithOnlyViews = {
        showOnlyLeafTasks: false,
        taskConfig: mockTaskConfigWithViews,
      };

      render(<TaskList config={configWithOnlyViews} />, {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(screen.getByText('TASK_RESULTS')).toBeInTheDocument();
        expect(screen.queryByText('TASK_ACTIONS')).not.toBeInTheDocument();
      });
    });
  });

  describe('Task Refetch on Consultation Save', () => {
    beforeEach(() => {
      mockGetTasks.mockResolvedValue(mockTasksBundle);
      delete (globalThis as any).__consultationSavedCallback;
    });

    it('should refetch tasks when observationFormsWithBasedOn is true', async () => {
      render(
        <TaskList
          config={mockTasksControlConfigNoFitlers}
          orderReference="order-123"
        />,
        {
          wrapper: createWrapper(),
        },
      );

      await waitFor(() => {
        expect(screen.getByTestId('tasks-table')).toBeInTheDocument();
      });

      expect(mockGetTasks).toHaveBeenCalledTimes(1);

      // Trigger consultation saved event
      const callback = (globalThis as any).__consultationSavedCallback;
      if (callback) {
        callback({
          patientUUID: 'patient-uuid',
          updatedResources: {
            observationFormsWithBasedOn: 'order-123',
          },
        });
      }

      await waitFor(() => {
        expect(mockGetTasks).toHaveBeenCalledTimes(2);
      });
    });

    it('should not refetch when observationFormsWithBasedOn is false', async () => {
      render(
        <TaskList
          config={mockTasksControlConfigNoFitlers}
          orderReference="order-123"
        />,
        {
          wrapper: createWrapper(),
        },
      );

      await waitFor(() => {
        expect(screen.getByTestId('tasks-table')).toBeInTheDocument();
      });

      expect(mockGetTasks).toHaveBeenCalledTimes(1);

      // Trigger consultation saved event
      const callback = (globalThis as any).__consultationSavedCallback;
      if (callback) {
        callback({
          patientUUID: 'patient-uuid',
          updatedResources: {
            observationFormsWithBasedOn: undefined,
          },
        });
      }

      await waitFor(() => {
        expect(mockGetTasks).toHaveBeenCalledTimes(1);
      });
    });

    it('should not refetch for different patientUUID', async () => {
      render(
        <TaskList
          config={mockTasksControlConfigNoFitlers}
          orderReference="order-123"
        />,
        {
          wrapper: createWrapper(),
        },
      );

      await waitFor(() => {
        expect(screen.getByTestId('tasks-table')).toBeInTheDocument();
      });

      expect(mockGetTasks).toHaveBeenCalledTimes(1);

      // Trigger consultation saved event for different patient
      const callback = (globalThis as any).__consultationSavedCallback;
      if (callback) {
        callback({
          patientUUID: 'different-patient-uuid',
          updatedResources: {
            observationFormsWithBasedOn: 'order-123',
          },
        });
      }

      await waitFor(() => {
        expect(mockGetTasks).toHaveBeenCalledTimes(1);
      });
    });

    it('should refetch only for matching patientUUID', async () => {
      render(
        <TaskList
          config={mockTasksControlConfigNoFitlers}
          orderReference="order-123"
        />,
        {
          wrapper: createWrapper(),
        },
      );

      await waitFor(() => {
        expect(screen.getByTestId('tasks-table')).toBeInTheDocument();
      });

      const initialCallCount = mockGetTasks.mock.calls.length;

      // Trigger with wrong patient
      const callback = (globalThis as any).__consultationSavedCallback;
      if (callback) {
        callback({
          patientUUID: 'wrong-patient',
          updatedResources: { observationFormsWithBasedOn: 'order-123' },
        });
      }

      await waitFor(() => {
        expect(mockGetTasks).toHaveBeenCalledTimes(initialCallCount);
      });

      // Trigger with correct patient
      if (callback) {
        callback({
          patientUUID: 'patient-uuid',
          updatedResources: { observationFormsWithBasedOn: 'order-123' },
        });
      }

      await waitFor(() => {
        expect(mockGetTasks).toHaveBeenCalledTimes(initialCallCount + 1);
      });
    });

    it('should remove observationsByServiceRequest cache for matching orderReference on consultation save', async () => {
      render(
        <TaskList
          config={mockTasksControlConfigNoFitlers}
          orderReference="order-123"
        />,
        { wrapper: createWrapper() },
      );

      await waitFor(() => {
        expect(screen.getByTestId('tasks-table')).toBeInTheDocument();
      });

      const removeQueriesSpy = jest.spyOn(queryClient, 'removeQueries');

      const callback = (globalThis as any).__consultationSavedCallback;
      if (callback) {
        callback({
          patientUUID: 'patient-uuid',
          updatedResources: {
            observationFormsWithBasedOn: 'order-123',
          },
        });
      }

      await waitFor(() => {
        expect(removeQueriesSpy).toHaveBeenCalledWith({
          queryKey: ['observationsByServiceRequest', 'order-123'],
        });
      });
    });
  });
});
