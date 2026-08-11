import {
  fetchObservationForms,
  getPatientObservationsBundle,
  hasPrivilege,
} from '@bahmni/services';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {
  mockTaskConfig,
  mockTaskConfigWithEditForm,
  mockTaskViewModelWithInput,
  mockTaskViewModelWithLabForm,
  mockTaskViewModelCompleted,
  mockObservationForms,
  mockUserPrivileges,
  mockLaunchFormAction,
  mockRestrictedAction,
  FILL_ENCOUNTER_UUID,
  SERVICE_REQUEST_UUID_COMPLETED,
  PATIENT_UUID_COMPLETED,
} from '../../__tests__/__mocks__/taskActionsMocks';
import TaskActions from '../TaskActions';

jest.mock('@bahmni/services', () => ({
  ...jest.requireActual('@bahmni/services'),
  fetchObservationForms: jest.fn(),
  hasPrivilege: jest.fn(),
  getPatientObservationsBundle: jest.fn(),
}));

jest.mock('../../../userPrivileges/useUserPrivilege', () => ({
  useUserPrivilege: jest.fn(() => ({
    userPrivileges: mockUserPrivileges,
  })),
}));

const mockAddNotification = jest.fn();
jest.mock('../../../notification', () => ({
  useNotification: jest.fn(() => ({ addNotification: mockAddNotification })),
}));

const mockFetchObservationForms = fetchObservationForms as jest.MockedFunction<
  typeof fetchObservationForms
>;
const mockHasPrivilege = hasPrivilege as jest.MockedFunction<
  typeof hasPrivilege
>;
const mockGetPatientObservationsBundle =
  getPatientObservationsBundle as jest.MockedFunction<
    typeof getPatientObservationsBundle
  >;

const FORM_NAMESPACE_URL =
  'http://fhir.bahmni.org/ext/observation/form-namespace-path';
const buildFormObservation = (
  id: string,
  encounterUuid: string,
  formFieldPath = 'Bahmni^Vitals.1/1-0',
) => ({
  resourceType: 'Observation' as const,
  id,
  status: 'final' as const,
  encounter: { reference: `Encounter/${encounterUuid}` },
  extension: [{ url: FORM_NAMESPACE_URL, valueString: formFieldPath }],
});

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
    mockGetPatientObservationsBundle.mockResolvedValue({
      resourceType: 'Bundle',
      type: 'searchset',
      entry: [
        { resource: buildFormObservation('obs-newest', FILL_ENCOUNTER_UUID) },
        { resource: buildFormObservation('obs-older', 'older-encounter-uuid') },
      ],
    });
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

    it('should not render when no permitted actions', async () => {
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
  });

  describe('Loading State', () => {
    it('should not show actions while forms are loading', () => {
      mockFetchObservationForms.mockImplementation(() => new Promise(() => {}));

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
    it('should dispatch startConsultation event with correct details when button clicked', async () => {
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
    it('should hide LAUNCH_FORM button when task status is "completed"', async () => {
      const taskCompleted = {
        ...mockTaskViewModelWithInput,
        status: 'completed',
      };

      const { container } = render(
        <TaskActions task={taskCompleted} taskConfig={mockTaskConfig} />,
        { wrapper: createWrapper() },
      );

      await waitFor(() => {
        expect(mockFetchObservationForms).toHaveBeenCalled();
      });

      expect(container).toBeEmptyDOMElement();
    });

    it('should disable LAUNCH_FORM button when task status is "in-progress"', async () => {
      const taskInProgress = {
        ...mockTaskViewModelWithInput,
        status: 'in-progress',
      };

      render(
        <TaskActions task={taskInProgress} taskConfig={mockTaskConfig} />,
        { wrapper: createWrapper() },
      );

      await waitFor(() => {
        expect(
          screen.getByRole('button', { name: 'Fill Form' }),
        ).toBeInTheDocument();
      });

      const button = screen.getByRole('button', { name: 'Fill Form' });
      expect(button).toBeDisabled();
    });

    it('should enable LAUNCH_FORM button when task status is "ready"', async () => {
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

  describe('EDIT_FORM action', () => {
    it('should render edit button only for completed tasks', async () => {
      render(
        <TaskActions
          task={mockTaskViewModelCompleted}
          taskConfig={mockTaskConfigWithEditForm}
        />,
        { wrapper: createWrapper() },
      );

      await waitFor(() => {
        expect(
          screen.getByRole('button', { name: 'Edit Form' }),
        ).toBeInTheDocument();
      });

      expect(
        screen.queryByRole('button', { name: 'Fill Form' }),
      ).not.toBeInTheDocument();
    });

    it('should not render edit button for non-completed tasks', async () => {
      const taskReady = { ...mockTaskViewModelWithInput, status: 'ready' };

      render(
        <TaskActions
          task={taskReady}
          taskConfig={mockTaskConfigWithEditForm}
        />,
        { wrapper: createWrapper() },
      );

      await waitFor(() => {
        expect(mockFetchObservationForms).toHaveBeenCalled();
      });

      expect(
        screen.queryByRole('button', { name: 'Edit Form' }),
      ).not.toBeInTheDocument();
    });

    it('resolves editEncounterUuid from the newest observation matching the task ServiceRequest', async () => {
      const user = userEvent.setup();

      render(
        <TaskActions
          task={mockTaskViewModelCompleted}
          taskConfig={mockTaskConfigWithEditForm}
        />,
        { wrapper: createWrapper() },
      );

      await waitFor(() => {
        expect(
          screen.getByRole('button', { name: 'Edit Form' }),
        ).toBeInTheDocument();
      });

      await user.click(screen.getByRole('button', { name: 'Edit Form' }));

      await waitFor(() => {
        expect(mockGetPatientObservationsBundle).toHaveBeenCalledWith(
          PATIENT_UUID_COMPLETED,
          undefined,
          SERVICE_REQUEST_UUID_COMPLETED,
        );
      });

      await waitFor(() => {
        expect(dispatchEventSpy).toHaveBeenCalledWith(
          expect.objectContaining({
            type: 'startConsultation',
            detail: expect.objectContaining({
              editOnly: 'observationForms',
              editEncounterUuid: FILL_ENCOUNTER_UUID,
              editFormName: 'Vitals',
              directFormMode: true,
              task: mockTaskViewModelCompleted.fhirResource,
            }),
          }),
        );
      });
    });

    it('surfaces an error notification and does not dispatch startConsultation when the observation fetch rejects', async () => {
      mockGetPatientObservationsBundle.mockRejectedValue(
        new Error('network down'),
      );
      const user = userEvent.setup();

      render(
        <TaskActions
          task={mockTaskViewModelCompleted}
          taskConfig={mockTaskConfigWithEditForm}
        />,
        { wrapper: createWrapper() },
      );

      await waitFor(() => {
        expect(
          screen.getByRole('button', { name: 'Edit Form' }),
        ).toBeInTheDocument();
      });

      await user.click(screen.getByRole('button', { name: 'Edit Form' }));

      await waitFor(() => {
        expect(mockAddNotification).toHaveBeenCalledWith(
          expect.objectContaining({
            title: 'ERROR_DEFAULT_TITLE',
            type: 'error',
          }),
        );
      });

      expect(dispatchEventSpy).not.toHaveBeenCalledWith(
        expect.objectContaining({ type: 'startConsultation' }),
      );
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
