import { fetchObservationForms, hasPrivilege } from '@bahmni/services';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { Task } from 'fhir/r4';
import React from 'react';
import {
  mockTaskConfigWithViews,
  mockViewFormView,
  mockViewFormViewRestricted,
  mockTaskConfigEmptyViews,
  mockTaskConfigNoViews,
} from '../../__tests__/__mocks__/configMocks';
import {
  mockUserPrivileges,
  mockFHIRTaskWithInput,
  mockObservationForms,
} from '../../__tests__/__mocks__/taskActionsMocks';
import { VITALS_TASK_CODE } from '../../__tests__/__mocks__/taskListMocks';
import type { TaskViewModel } from '../../models';
import TaskViewResults from '../TaskViewResults';
import { handleTaskView } from '../viewHandlers';

jest.mock('@bahmni/services', () => ({
  ...jest.requireActual('@bahmni/services'),
  fetchObservationForms: jest.fn(),
  hasPrivilege: jest.fn(),
}));

const viewableObservationForms = [
  {
    ...mockObservationForms[0],
    privileges: [
      { privilegeName: 'Edit Vitals', editable: true, viewable: true },
    ],
  },
  ...mockObservationForms.slice(1),
];

const nonViewableObservationForms = [
  {
    ...mockObservationForms[0],
    privileges: [
      { privilegeName: 'Edit Vitals', editable: true, viewable: false },
    ],
  },
  ...mockObservationForms.slice(1),
];

jest.mock('../../../hooks/usePatientUUID', () => ({
  usePatientUUID: jest.fn(() => 'patient-uuid-123'),
}));

jest.mock('../../../userPrivileges/useUserPrivilege', () => ({
  useUserPrivilege: jest.fn(() => ({
    userPrivileges: mockUserPrivileges,
  })),
}));

jest.mock('../viewHandlers', () => ({
  handleTaskView: jest.fn(() => (
    <div data-testid="mocked-view">Mocked View</div>
  )),
}));

const mockFetchObservationForms = fetchObservationForms as jest.MockedFunction<
  typeof fetchObservationForms
>;
const mockHasPrivilege = hasPrivilege as jest.MockedFunction<
  typeof hasPrivilege
>;
const mockHandleTaskView = handleTaskView as jest.MockedFunction<
  typeof handleTaskView
>;

const createWrapper = () => {
  const queryClient = new QueryClient({
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

const createTaskViewModel = (
  fhirTask: Task,
  status: string = 'completed',
): TaskViewModel => ({
  id: fhirTask.id ?? '',
  name: fhirTask.description ?? '',
  code: fhirTask.code?.coding?.[0]?.code ?? '',
  status,
  partOf: [],
  fhirResource: fhirTask,
});

const mockCompletedTask = createTaskViewModel(
  mockFHIRTaskWithInput,
  'completed',
);
const mockInProgressTask = createTaskViewModel(
  mockFHIRTaskWithInput,
  'in-progress',
);
const mockRequestedTask = createTaskViewModel(
  mockFHIRTaskWithInput,
  'requested',
);

describe('TaskViewResults', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockFetchObservationForms.mockResolvedValue(viewableObservationForms);
    mockHasPrivilege.mockReturnValue(true);
  });

  describe('Rendering', () => {
    it('should render link when permitted views exist', async () => {
      render(
        <TaskViewResults
          task={mockCompletedTask}
          taskConfig={mockTaskConfigWithViews}
        />,
        { wrapper: createWrapper() },
      );

      const link = await screen.findByTestId(
        `task-view-viewForm-${mockCompletedTask.id}`,
      );
      expect(link).toBeInTheDocument();
      expect(link).toHaveTextContent('View Data');
    });

    it('should render dash when no permitted views exist', () => {
      mockHasPrivilege.mockReturnValue(false);

      const { container } = render(
        <TaskViewResults
          task={mockCompletedTask}
          taskConfig={mockTaskConfigWithViews}
        />,
        { wrapper: createWrapper() },
      );

      expect(container.textContent).toBe('-');
      expect(screen.queryByText('View Data')).not.toBeInTheDocument();
    });

    it.each([
      ['empty taskConfig', []],
      ['null taskConfig', null],
      ['undefined taskConfig', undefined],
    ])('should render dash when %s', (_, config) => {
      const { container } = render(
        <TaskViewResults task={mockCompletedTask} taskConfig={config as any} />,
        { wrapper: createWrapper() },
      );

      expect(container.textContent).toBe('-');
    });

    it('should render dash when taskConfig has empty views array', () => {
      const { container } = render(
        <TaskViewResults
          task={mockCompletedTask}
          taskConfig={mockTaskConfigEmptyViews}
        />,
        { wrapper: createWrapper() },
      );

      expect(container.textContent).toBe('-');
    });

    it('should render dash when taskConfig has no views property', () => {
      const { container } = render(
        <TaskViewResults
          task={mockCompletedTask}
          taskConfig={mockTaskConfigNoViews}
        />,
        { wrapper: createWrapper() },
      );

      expect(container.textContent).toBe('-');
    });

    it('should render dash when no matching taskConfig for task code', () => {
      const taskWithDifferentCode = {
        ...mockCompletedTask,
        code: 'non-existent-code',
      };

      const { container } = render(
        <TaskViewResults
          task={taskWithDifferentCode}
          taskConfig={mockTaskConfigWithViews}
        />,
        { wrapper: createWrapper() },
      );

      expect(container.textContent).toBe('-');
    });
  });

  describe('Privilege filtering', () => {
    it('should show view when user has required privileges', async () => {
      mockHasPrivilege.mockReturnValue(true);

      render(
        <TaskViewResults
          task={mockCompletedTask}
          taskConfig={mockTaskConfigWithViews}
        />,
        { wrapper: createWrapper() },
      );

      expect(
        await screen.findByTestId(`task-view-viewForm-${mockCompletedTask.id}`),
      ).toBeInTheDocument();
    });

    it('should not show view when user lacks required privileges', async () => {
      mockHasPrivilege.mockReturnValue(false);

      const { container } = render(
        <TaskViewResults
          task={mockCompletedTask}
          taskConfig={[
            {
              taskCode: VITALS_TASK_CODE,
              views: [mockViewFormViewRestricted],
            },
          ]}
        />,
        { wrapper: createWrapper() },
      );

      await waitFor(() => {
        expect(mockFetchObservationForms).toHaveBeenCalled();
      });
      expect(container.textContent).toBe('-');
    });

    it('should show view when no privileges are required', async () => {
      const configWithNoPrivileges = [
        {
          taskCode: VITALS_TASK_CODE,
          views: [
            {
              ...mockViewFormView,
              requiredPrivileges: [],
            },
          ],
        },
      ];

      render(
        <TaskViewResults
          task={mockCompletedTask}
          taskConfig={configWithNoPrivileges}
        />,
        { wrapper: createWrapper() },
      );

      expect(
        await screen.findByTestId(`task-view-viewForm-${mockCompletedTask.id}`),
      ).toBeInTheDocument();
    });

    it('should not show view when form is not viewable by user', async () => {
      mockFetchObservationForms.mockResolvedValue(nonViewableObservationForms);

      const { container } = render(
        <TaskViewResults
          task={mockCompletedTask}
          taskConfig={mockTaskConfigWithViews}
        />,
        { wrapper: createWrapper() },
      );

      await waitFor(() => {
        expect(mockFetchObservationForms).toHaveBeenCalled();
      });
      expect(container.textContent).toBe('-');
      expect(
        screen.queryByTestId(`task-view-viewForm-${mockCompletedTask.id}`),
      ).not.toBeInTheDocument();
    });
  });

  describe('Task status filtering', () => {
    it.each([
      ['in-progress', mockInProgressTask],
      ['requested', mockRequestedTask],
      ['ready', { ...mockCompletedTask, status: 'ready' }],
    ])('should not show view for %s task', (_statusName, task) => {
      const { container } = render(
        <TaskViewResults task={task} taskConfig={mockTaskConfigWithViews} />,
        { wrapper: createWrapper() },
      );

      expect(container.textContent).toBe('-');
      expect(screen.queryByText('View Data')).not.toBeInTheDocument();
    });

    it('should show view only for completed tasks', async () => {
      render(
        <TaskViewResults
          task={mockCompletedTask}
          taskConfig={mockTaskConfigWithViews}
        />,
        { wrapper: createWrapper() },
      );

      expect(
        await screen.findByTestId(`task-view-viewForm-${mockCompletedTask.id}`),
      ).toBeInTheDocument();
    });
  });

  describe('View rendering', () => {
    it('should call handleTaskView when link is clicked', async () => {
      const user = userEvent.setup();

      render(
        <TaskViewResults
          task={mockCompletedTask}
          taskConfig={mockTaskConfigWithViews}
        />,
        { wrapper: createWrapper() },
      );

      const link = await screen.findByTestId(
        `task-view-viewForm-${mockCompletedTask.id}`,
      );
      await user.click(link);

      await waitFor(() => {
        expect(mockHandleTaskView).toHaveBeenCalledWith(
          mockViewFormView,
          mockCompletedTask,
          'patient-uuid-123',
          expect.any(Function),
        );
      });
    });

    it('should render mocked view after clicking link', async () => {
      const user = userEvent.setup();

      render(
        <TaskViewResults
          task={mockCompletedTask}
          taskConfig={mockTaskConfigWithViews}
        />,
        { wrapper: createWrapper() },
      );

      const link = await screen.findByTestId(
        `task-view-viewForm-${mockCompletedTask.id}`,
      );
      await user.click(link);

      await waitFor(() => {
        expect(screen.getByTestId('mocked-view')).toBeInTheDocument();
      });
    });

    it('should not render view when not selected', async () => {
      render(
        <TaskViewResults
          task={mockCompletedTask}
          taskConfig={mockTaskConfigWithViews}
        />,
        { wrapper: createWrapper() },
      );

      await screen.findByTestId(`task-view-viewForm-${mockCompletedTask.id}`);
      expect(screen.queryByTestId('mocked-view')).not.toBeInTheDocument();
    });
  });

  describe('Form matching', () => {
    it('should show view when task has matching form input', async () => {
      render(
        <TaskViewResults
          task={mockCompletedTask}
          taskConfig={mockTaskConfigWithViews}
        />,
        { wrapper: createWrapper() },
      );

      expect(
        await screen.findByTestId(`task-view-viewForm-${mockCompletedTask.id}`),
      ).toBeInTheDocument();
    });

    it('should not show view when form name cannot be extracted', () => {
      const taskWithoutInput: TaskViewModel = {
        ...mockCompletedTask,
        fhirResource: {
          ...mockCompletedTask.fhirResource,
          input: [],
        },
      };

      const { container } = render(
        <TaskViewResults
          task={taskWithoutInput}
          taskConfig={mockTaskConfigWithViews}
        />,
        { wrapper: createWrapper() },
      );

      expect(container.textContent).toBe('-');
    });

    it('should not show view when task has no input property', () => {
      const taskWithoutInputProperty: TaskViewModel = {
        ...mockCompletedTask,
        fhirResource: {
          ...mockCompletedTask.fhirResource,
          input: undefined,
        },
      };

      const { container } = render(
        <TaskViewResults
          task={taskWithoutInputProperty}
          taskConfig={mockTaskConfigWithViews}
        />,
        { wrapper: createWrapper() },
      );

      expect(container.textContent).toBe('-');
    });
  });

  describe('View selection', () => {
    it('should render overflow menu when multiple views exist', async () => {
      const configWithMultipleViews = [
        {
          taskCode: VITALS_TASK_CODE,
          views: [
            mockViewFormView,
            {
              ...mockViewFormView,
              label: 'Second View',
            },
          ],
        },
      ];

      render(
        <TaskViewResults
          task={mockCompletedTask}
          taskConfig={configWithMultipleViews}
        />,
        { wrapper: createWrapper() },
      );

      const menu = await screen.findByTestId(
        `task-views-menu-${mockCompletedTask.id}`,
      );
      expect(menu).toBeInTheDocument();
    });

    it('should show single Link when only one view exists', async () => {
      render(
        <TaskViewResults
          task={mockCompletedTask}
          taskConfig={mockTaskConfigWithViews}
        />,
        { wrapper: createWrapper() },
      );

      expect(
        await screen.findByTestId(`task-view-viewForm-${mockCompletedTask.id}`),
      ).toBeInTheDocument();

      expect(
        screen.queryByTestId(`task-views-menu-${mockCompletedTask.id}`),
      ).not.toBeInTheDocument();
    });

    it('should pass correct testId to link', async () => {
      render(
        <TaskViewResults
          task={mockCompletedTask}
          taskConfig={mockTaskConfigWithViews}
        />,
        { wrapper: createWrapper() },
      );

      expect(
        await screen.findByTestId(`task-view-viewForm-${mockCompletedTask.id}`),
      ).toBeInTheDocument();
    });
  });
});
