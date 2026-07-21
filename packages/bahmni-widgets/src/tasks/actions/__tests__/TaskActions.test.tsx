import { fetchObservationForms, hasPrivilege } from '@bahmni/services';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {
  mockTaskConfig,
  mockTaskViewModelWithInput,
  mockTaskViewModelWithLabForm,
  mockObservationForms,
  mockUserPrivileges,
  mockLaunchFormAction,
  mockRestrictedAction,
} from '../../__tests__/__mocks__/taskActionsMocks';
import TaskActions from '../TaskActions';

jest.mock('@bahmni/services', () => ({
  ...jest.requireActual('@bahmni/services'),
  fetchObservationForms: jest.fn(),
  hasPrivilege: jest.fn(),
}));

jest.mock('../../../userPrivileges/useUserPrivilege', () => ({
  useUserPrivilege: jest.fn(() => ({
    userPrivileges: mockUserPrivileges,
  })),
}));

const mockFetchObservationForms = fetchObservationForms as jest.MockedFunction<
  typeof fetchObservationForms
>;
const mockHasPrivilege = hasPrivilege as jest.MockedFunction<
  typeof hasPrivilege
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

describe('TaskActions', () => {
  let dispatchEventSpy: jest.SpyInstance;

  beforeEach(() => {
    jest.clearAllMocks();
    mockFetchObservationForms.mockResolvedValue(mockObservationForms);
    mockHasPrivilege.mockReturnValue(true);
    dispatchEventSpy = jest.spyOn(globalThis, 'dispatchEvent');
  });

  afterEach(() => {
    dispatchEventSpy.mockRestore();
  });

  describe('Rendering', () => {
    it('should render IconButton when permitted action exists', async () => {
      render(
        <TaskActions
          task={mockTaskViewModelWithInput}
          taskConfig={mockTaskConfig}
        />,
        { wrapper: createWrapper() },
      );

      await waitFor(() => {
        const button = screen.getByRole('button', { name: 'Fill Form' });
        expect(button).toBeInTheDocument();
      });
    });

    it('should not render when no permitted actions exist', async () => {
      mockHasPrivilege.mockReturnValue(false);

      const { container } = render(
        <TaskActions
          task={mockTaskViewModelWithInput}
          taskConfig={mockTaskConfig}
        />,
        { wrapper: createWrapper() },
      );

      await waitFor(() => {
        expect(mockFetchObservationForms).toHaveBeenCalled();
      });

      expect(container).toBeEmptyDOMElement();
    });

    it('should not render when taskConfig is empty', async () => {
      const { container } = render(
        <TaskActions task={mockTaskViewModelWithInput} taskConfig={[]} />,
        { wrapper: createWrapper() },
      );

      expect(mockFetchObservationForms).not.toHaveBeenCalled();
      expect(container).toBeEmptyDOMElement();
    });

    it('should not render when no matching taskConfig for task code', async () => {
      const taskWithDifferentCode = {
        ...mockTaskViewModelWithInput,
        code: 'non-matching-code',
      };

      const { container } = render(
        <TaskActions
          task={taskWithDifferentCode}
          taskConfig={mockTaskConfig}
        />,
        { wrapper: createWrapper() },
      );

      expect(mockFetchObservationForms).not.toHaveBeenCalled();
      expect(container).toBeEmptyDOMElement();
    });

    it('should pass correct testId for action button', async () => {
      render(
        <TaskActions
          task={mockTaskViewModelWithInput}
          taskConfig={mockTaskConfig}
        />,
        { wrapper: createWrapper() },
      );

      await waitFor(() => {
        const button = screen.getByTestId(
          `task-action-launchForm-${mockTaskViewModelWithInput.id}`,
        );
        expect(button).toBeInTheDocument();
      });
    });

    it('should show overflow menu when multiple actions exist', async () => {
      const configWithMultipleActions = [
        {
          taskCode: mockTaskViewModelWithInput.code,
          actions: [
            mockLaunchFormAction,
            {
              ...mockLaunchFormAction,
              label: 'Second Action',
              icon: 'delete',
            },
          ],
        },
      ];

      render(
        <TaskActions
          task={mockTaskViewModelWithInput}
          taskConfig={configWithMultipleActions}
        />,
        { wrapper: createWrapper() },
      );

      await waitFor(() => {
        expect(
          screen.getByTestId(
            `task-actions-menu-${mockTaskViewModelWithInput.id}`,
          ),
        ).toBeInTheDocument();
      });
    });

    it('should show single IconButton when only one action exists', async () => {
      render(
        <TaskActions
          task={mockTaskViewModelWithInput}
          taskConfig={mockTaskConfig}
        />,
        { wrapper: createWrapper() },
      );

      await waitFor(() => {
        expect(
          screen.getByRole('button', { name: 'Fill Form' }),
        ).toBeInTheDocument();
      });

      expect(
        screen.queryByTestId(
          `task-actions-menu-${mockTaskViewModelWithInput.id}`,
        ),
      ).not.toBeInTheDocument();
    });
  });

  describe('Privilege Filtering', () => {
    it('should filter actions based on user privileges', async () => {
      mockHasPrivilege.mockImplementation((privileges, required) => {
        return required?.includes('Edit Vitals') ?? false;
      });

      render(
        <TaskActions
          task={mockTaskViewModelWithInput}
          taskConfig={mockTaskConfig}
        />,
        { wrapper: createWrapper() },
      );

      await waitFor(() => {
        expect(
          screen.getByRole('button', { name: 'Fill Form' }),
        ).toBeInTheDocument();
      });
    });

    it('should filter out actions when user lacks privileges', async () => {
      const restrictedConfig = [
        {
          taskCode: mockTaskViewModelWithInput.code,
          actions: [mockRestrictedAction],
        },
      ];

      mockHasPrivilege.mockReturnValue(false);

      const { container } = render(
        <TaskActions
          task={mockTaskViewModelWithInput}
          taskConfig={restrictedConfig}
        />,
        { wrapper: createWrapper() },
      );

      await waitFor(() => {
        expect(mockFetchObservationForms).toHaveBeenCalled();
      });

      expect(container).toBeEmptyDOMElement();
    });

    it('should check hasPrivilege for all action types', async () => {
      render(
        <TaskActions
          task={mockTaskViewModelWithInput}
          taskConfig={mockTaskConfig}
        />,
        { wrapper: createWrapper() },
      );

      await waitFor(() => {
        expect(mockHasPrivilege).toHaveBeenCalledWith(
          mockUserPrivileges,
          mockLaunchFormAction.requiredPrivileges,
        );
      });
    });
  });

  describe('Form Edit Permissions', () => {
    it('should filter actions based on form edit permissions', async () => {
      const formsWithoutEditPrivilege = mockObservationForms.map((form) => ({
        ...form,
        privileges: [
          {
            privilegeName: 'View Only',
            editable: false,
          },
        ],
      }));

      mockFetchObservationForms.mockResolvedValue(formsWithoutEditPrivilege);

      const { container } = render(
        <TaskActions
          task={mockTaskViewModelWithInput}
          taskConfig={mockTaskConfig}
        />,
        { wrapper: createWrapper() },
      );

      await waitFor(() => {
        expect(mockFetchObservationForms).toHaveBeenCalled();
      });

      expect(container).toBeEmptyDOMElement();
    });

    it('should show action when user can edit matching form', async () => {
      render(
        <TaskActions
          task={mockTaskViewModelWithInput}
          taskConfig={mockTaskConfig}
        />,
        { wrapper: createWrapper() },
      );

      await waitFor(() => {
        expect(
          screen.getByRole('button', { name: 'Fill Form' }),
        ).toBeInTheDocument();
      });
    });
  });

  describe('Loading State', () => {
    it('should not show actions while forms are loading', () => {
      mockFetchObservationForms.mockImplementation(
        () => new Promise(() => {}), // Never resolves
      );

      const { container } = render(
        <TaskActions
          task={mockTaskViewModelWithInput}
          taskConfig={mockTaskConfig}
        />,
        { wrapper: createWrapper() },
      );

      expect(container).toBeEmptyDOMElement();
    });

    it('should fetch observation forms via useQuery', async () => {
      render(
        <TaskActions
          task={mockTaskViewModelWithInput}
          taskConfig={mockTaskConfig}
        />,
        { wrapper: createWrapper() },
      );

      await waitFor(() => {
        expect(mockFetchObservationForms).toHaveBeenCalled();
      });
    });
  });

  describe('Action Handling', () => {
    it('should call handleTaskAction when button clicked', async () => {
      const user = userEvent.setup();

      render(
        <TaskActions
          task={mockTaskViewModelWithInput}
          taskConfig={mockTaskConfig}
        />,
        { wrapper: createWrapper() },
      );

      await waitFor(() => {
        expect(
          screen.getByRole('button', { name: 'Fill Form' }),
        ).toBeInTheDocument();
      });

      const button = screen.getByRole('button', { name: 'Fill Form' });
      await user.click(button);

      expect(dispatchEventSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'startConsultation',
        }),
      );
    });

    it('should pass correct task and action to handler', async () => {
      const user = userEvent.setup();

      render(
        <TaskActions
          task={mockTaskViewModelWithInput}
          taskConfig={mockTaskConfig}
        />,
        { wrapper: createWrapper() },
      );

      await waitFor(() => {
        expect(
          screen.getByRole('button', { name: 'Fill Form' }),
        ).toBeInTheDocument();
      });

      const button = screen.getByRole('button', { name: 'Fill Form' });
      await user.click(button);

      expect(dispatchEventSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          detail: expect.objectContaining({
            task: mockTaskViewModelWithInput.fhirResource,
            taskFormName: 'Vitals',
          }),
        }),
      );
    });
  });

  describe('Multiple Tasks', () => {
    it.each([
      ['Vitals task', mockTaskViewModelWithInput, 'Fill Form'],
      ['Lab Tests task', mockTaskViewModelWithLabForm, 'Fill Form'],
    ])('should render action for %s', async (_, task, expectedLabel) => {
      render(<TaskActions task={task} taskConfig={mockTaskConfig} />, {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(
          screen.getByRole('button', { name: expectedLabel }),
        ).toBeInTheDocument();
      });
    });
  });

  describe('Task action disabled State based on task status', () => {
    it('should disable button when task status is not "ready"', async () => {
      const taskNotReady = {
        ...mockTaskViewModelWithInput,
        status: 'completed',
      };

      render(<TaskActions task={taskNotReady} taskConfig={mockTaskConfig} />, {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(
          screen.getByRole('button', { name: 'Fill Form' }),
        ).toBeInTheDocument();
      });

      const button = screen.getByRole('button', { name: 'Fill Form' });
      expect(button).toBeDisabled();
    });

    it('should enable button when task status is "ready"', async () => {
      const taskReady = {
        ...mockTaskViewModelWithInput,
        status: 'ready',
      };

      render(<TaskActions task={taskReady} taskConfig={mockTaskConfig} />, {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(
          screen.getByRole('button', { name: 'Fill Form' }),
        ).toBeInTheDocument();
      });

      const button = screen.getByRole('button', { name: 'Fill Form' });
      expect(button).not.toBeDisabled();
    });
  });

  describe('Edge Cases', () => {
    it('should handle missing taskConfig gracefully', async () => {
      const taskWithNoConfig = {
        ...mockTaskViewModelWithInput,
        code: 'undefined-task-code',
      };

      const { container } = render(
        <TaskActions task={taskWithNoConfig} taskConfig={mockTaskConfig} />,
        { wrapper: createWrapper() },
      );

      expect(mockFetchObservationForms).not.toHaveBeenCalled();
      expect(container).toBeEmptyDOMElement();
    });

    it('should handle undefined taskConfig.actions', async () => {
      const configWithoutActions = [
        {
          taskCode: mockTaskViewModelWithInput.code,
          actions: undefined as any,
        },
      ];

      const { container } = render(
        <TaskActions
          task={mockTaskViewModelWithInput}
          taskConfig={configWithoutActions}
        />,
        { wrapper: createWrapper() },
      );

      expect(mockFetchObservationForms).not.toHaveBeenCalled();
      expect(container).toBeEmptyDOMElement();
    });
  });
});
