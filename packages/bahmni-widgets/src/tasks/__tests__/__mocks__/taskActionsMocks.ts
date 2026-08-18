import {
  getPatientObservationsBundle,
  type ObservationForm,
  type UserPrivilege,
} from '@bahmni/services';
import type { Task } from 'fhir/r4';
import { TaskActionType } from '../../constants';
import type { TaskAction, TaskConfig, TaskViewModel } from '../../models';
import {
  VITALS_TASK_CODE,
  LAB_TESTS_TASK_CODE,
  FORM_NAME_INPUT_CODE,
} from './taskListMocks';

export const ENCOUNTER_UUID = 'encounter-uuid-1';

export const mockUserPrivileges: UserPrivilege[] = [
  { name: 'Edit Vitals', retired: false },
  { name: 'Edit Lab Tests', retired: false },
  { name: 'View Only Access', retired: false },
];

export const mockEmptyUserPrivileges: UserPrivilege[] = [];

export const mockObservationForms: ObservationForm[] = [
  {
    formUuid: 'form-vitals-uuid',
    formName: 'Vitals',
    formVersion: '1',
    name: 'Vitals',
    uuid: 'form-vitals-uuid',
    version: '1',
    published: true,
    privileges: [
      {
        privilegeName: 'Edit Vitals',
        editable: true,
      },
    ],
    resources: [],
  },
  {
    formUuid: 'form-labs-uuid',
    formName: 'Lab Tests',
    formVersion: '1',
    name: 'Lab Tests',
    uuid: 'form-labs-uuid',
    version: '1',
    published: true,
    privileges: [
      {
        privilegeName: 'Edit Lab Tests',
        editable: true,
      },
      {
        privilegeName: 'View Only Access',
        editable: false,
      },
    ],
    resources: [],
  },
  {
    formUuid: 'form-no-privileges-uuid',
    formName: 'General Form',
    formVersion: '1',
    name: 'General Form',
    uuid: 'form-no-privileges-uuid',
    version: '1',
    published: true,
    privileges: [],
    resources: [],
  },
  {
    formUuid: 'form-restricted-uuid',
    formName: 'Restricted Form',
    formVersion: '1',
    name: 'Restricted Form',
    uuid: 'form-restricted-uuid',
    version: '1',
    published: true,
    privileges: [
      {
        privilegeName: 'Admin Only',
        editable: true,
      },
    ],
    resources: [],
  },
];

export const mockLaunchFormAction: TaskAction = {
  label: 'Fill Form',
  type: TaskActionType.LAUNCH_FORM,
  icon: 'launch',
  requiredPrivileges: ['Edit Vitals'],
  handlerConfig: {
    formInputCode: FORM_NAME_INPUT_CODE,
    encounterType: 'consultation',
  },
};

export const mockEditFormAction: TaskAction = {
  label: 'Edit Form',
  type: TaskActionType.EDIT_FORM,
  icon: 'edit',
  requiredPrivileges: ['Edit Vitals'],
  handlerConfig: {
    formInputCode: FORM_NAME_INPUT_CODE,
  },
};

export const mockLaunchFormActionNoPrivileges: TaskAction = {
  label: 'Fill Form',
  type: TaskActionType.LAUNCH_FORM,
  icon: 'edit',
  requiredPrivileges: [],
  handlerConfig: {
    formInputCode: FORM_NAME_INPUT_CODE,
    encounterType: 'consultation',
  },
};

export const mockRestrictedAction: TaskAction = {
  label: 'Admin Action',
  type: TaskActionType.LAUNCH_FORM,
  icon: 'admin',
  requiredPrivileges: ['Admin Only'],
  handlerConfig: {
    formInputCode: FORM_NAME_INPUT_CODE,
    encounterType: 'consultation',
  },
};

export const mockTaskConfig: TaskConfig[] = [
  {
    taskCode: VITALS_TASK_CODE,
    actions: [mockLaunchFormAction],
  },
  {
    taskCode: LAB_TESTS_TASK_CODE,
    actions: [mockLaunchFormActionNoPrivileges],
  },
];

export const mockTaskConfigWithEditForm: TaskConfig[] = [
  {
    taskCode: VITALS_TASK_CODE,
    actions: [mockLaunchFormAction, mockEditFormAction],
  },
];

const createTaskWithFormInput = (
  id: string,
  description: string,
  taskCode: string,
  taskDisplay: string,
  formName: string,
  additionalInput?: Task['input'],
  status: Task['status'] = 'ready',
): Task => ({
  resourceType: 'Task',
  id,
  status,
  intent: 'order',
  description,
  code: {
    text: description,
    coding: [
      {
        code: taskCode,
        display: taskDisplay,
      },
    ],
  },
  for: {
    reference: 'Patient/patient-uuid',
    display: 'John Doe',
  },
  input: [
    {
      type: {
        coding: [
          {
            code: FORM_NAME_INPUT_CODE,
            display: 'Form Name',
          },
        ],
      },
      valueString: formName,
    },
    ...(additionalInput ?? []),
  ],
});

export const mockFHIRTaskWithInput: Task = {
  ...createTaskWithFormInput(
    'task-with-input',
    'Fill Vitals Form',
    VITALS_TASK_CODE,
    'Vitals Form Task',
    'Vitals',
    [
      {
        type: {
          coding: [
            {
              code: 'other-input-type',
              display: 'Other Input',
            },
          ],
        },
        valueString: 'Some other value',
      },
    ],
  ),
  basedOn: [
    {
      reference: 'ServiceRequest/service-request-123',
    },
  ],
};

export const mockFHIRTaskWithoutInput: Task = {
  resourceType: 'Task',
  id: 'task-without-input',
  status: 'requested',
  intent: 'order',
  description: 'Task without input',
  code: {
    text: 'Some Task',
    coding: [
      {
        code: VITALS_TASK_CODE,
        display: 'Some Task',
      },
    ],
  },
  for: {
    reference: 'Patient/patient-uuid',
    display: 'John Doe',
  },
};

export const mockFHIRTaskWithEmptyInput: Task = {
  ...mockFHIRTaskWithoutInput,
  id: 'task-empty-input',
  description: 'Task with empty input',
  input: [],
};

export const mockFHIRTaskWithLabForm: Task = createTaskWithFormInput(
  'task-with-lab-form',
  'Fill Lab Tests Form',
  LAB_TESTS_TASK_CODE,
  'Lab Tests Task',
  'Lab Tests',
);

export const mockFHIRTaskWithCaseInsensitiveForm: Task =
  createTaskWithFormInput(
    'task-case-insensitive',
    'Case insensitive form match',
    VITALS_TASK_CODE,
    'Vitals Task',
    'VITALS', // Uppercase
  );

export const mockFHIRTaskWithNonexistentForm: Task = createTaskWithFormInput(
  'task-nonexistent-form',
  'Form that does not exist',
  VITALS_TASK_CODE,
  'Unknown Task',
  'Nonexistent Form',
);

const createTaskViewModel = (fhirTask: Task): TaskViewModel => ({
  id: fhirTask.id ?? '',
  name: fhirTask.description ?? fhirTask.code?.text ?? '',
  code: fhirTask.code?.coding?.[0]?.code ?? fhirTask.code?.text ?? '',
  status: fhirTask.status,
  partOf: [],
  fhirResource: fhirTask,
});

export const mockTaskViewModelWithInput: TaskViewModel = createTaskViewModel(
  mockFHIRTaskWithInput,
);

export const mockTaskViewModelWithoutInput: TaskViewModel = createTaskViewModel(
  mockFHIRTaskWithoutInput,
);

export const mockTaskViewModelWithEmptyInput: TaskViewModel =
  createTaskViewModel(mockFHIRTaskWithEmptyInput);

export const mockTaskViewModelWithLabForm: TaskViewModel = createTaskViewModel(
  mockFHIRTaskWithLabForm,
);

export const mockTaskViewModelWithCaseInsensitiveForm: TaskViewModel =
  createTaskViewModel(mockFHIRTaskWithCaseInsensitiveForm);

export const mockTaskViewModelWithNonexistentForm: TaskViewModel =
  createTaskViewModel(mockFHIRTaskWithNonexistentForm);

export const SERVICE_REQUEST_UUID_COMPLETED = 'service-request-completed';
export const PATIENT_UUID_COMPLETED = 'patient-uuid-completed';
export const FILL_ENCOUNTER_UUID = 'fill-encounter-completed';

export const mockFHIRCompletedTaskWithInput: Task = {
  ...createTaskWithFormInput(
    'task-completed-with-input',
    'Fill Vitals Form',
    VITALS_TASK_CODE,
    'Vitals Form Task',
    'Vitals',
  ),
  status: 'completed',
  for: {
    reference: `Patient/${PATIENT_UUID_COMPLETED}`,
  },
  basedOn: [
    {
      reference: `ServiceRequest/${SERVICE_REQUEST_UUID_COMPLETED}`,
    },
  ],
};

export const mockTaskViewModelCompleted: TaskViewModel = createTaskViewModel(
  mockFHIRCompletedTaskWithInput,
);

export const mockGetPatientObservationsBundle =
  getPatientObservationsBundle as jest.MockedFunction<
    typeof getPatientObservationsBundle
  >;
