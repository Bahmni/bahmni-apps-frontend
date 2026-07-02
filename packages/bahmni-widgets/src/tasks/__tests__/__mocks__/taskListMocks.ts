import { Bundle, Task } from 'fhir/r4';
import { TaskViewModel } from '../../models';

// Shared task code constants
export const VITALS_TASK_CODE = '6501d0f9-98da-44be-afc9-e2319453f0d6';
export const LAB_TESTS_TASK_CODE = '7601d0f9-98da-44be-afc9-e2319453f0d7';
export const FORM_NAME_INPUT_CODE = 'form-name-input-type';

export const mockFHIRTasks: Task[] = [
  {
    resourceType: 'Task',
    id: 'task-1',
    status: 'completed',
    intent: 'order',
    description: 'Vitals Form',
    code: {
      text: 'Record Vitals',
      coding: [
        {
          code: VITALS_TASK_CODE,
          display: 'Vitals Form Task',
        },
      ],
    },
    for: {
      reference: 'Patient/patient-uuid',
      display: 'John Doe',
    },
    owner: {
      reference: 'Practitioner/practitioner-1',
      display: 'Dr. Smith',
    },
    executionPeriod: {
      start: '2025-03-25T10:00:00Z',
      end: '2025-03-25T11:00:00Z',
    },
  },
  {
    resourceType: 'Task',
    id: 'task-2',
    status: 'in-progress',
    intent: 'order',
    description: 'Physical Exam',
    code: {
      text: 'Perform Physical Examination',
      coding: [
        {
          code: LAB_TESTS_TASK_CODE,
          display: 'Physical Exam Task',
        },
      ],
    },
    for: {
      reference: 'Patient/patient-uuid',
      display: 'John Doe',
    },
    owner: {
      reference: 'Practitioner/practitioner-2',
      display: 'Dr. Johnson',
    },
    partOf: [
      {
        reference: 'Task/parent-task-1',
      },
    ],
  },
  {
    resourceType: 'Task',
    id: 'task-3',
    status: 'requested',
    intent: 'order',
    description: 'Lab Review',
    code: {
      text: 'Review Lab Results',
      coding: [
        {
          code: '8701d0f9-98da-44be-afc9-e2319453f0d8',
          display: 'Lab Review Task',
        },
      ],
    },
    for: {
      reference: 'Patient/patient-uuid',
      display: 'John Doe',
    },
    partOf: [
      {
        reference: 'Task/parent-task-1',
      },
    ],
  },
  {
    resourceType: 'Task',
    id: 'parent-task-1',
    status: 'in-progress',
    intent: 'order',
    description: 'Complete Patient Intake',
    code: {
      text: 'Patient Intake',
      coding: [
        {
          code: '9801d0f9-98da-44be-afc9-e2319453f0d9',
          display: 'Intake Task',
        },
      ],
    },
    for: {
      reference: 'Patient/patient-uuid',
      display: 'John Doe',
    },
  },
];

export const mockTasksBundle: Bundle<Task> = {
  resourceType: 'Bundle',
  type: 'searchset',
  total: mockFHIRTasks.length,
  entry: mockFHIRTasks.map((task) => ({
    resource: task,
    fullUrl: `http://localhost:8080/openmrs/ws/fhir2/R4/Task/${task.id}`,
  })),
};

export const emptyTasksBundle: Bundle<Task> = {
  resourceType: 'Bundle',
  type: 'searchset',
  total: 0,
  entry: [],
};

// Derive mockTaskViewModels from FHIR tasks to avoid duplication
const formatMockDateTime = (isoDate?: string): string => {
  if (!isoDate) return '-';
  const date = new Date(isoDate);
  return date.toLocaleString('en-US', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });
};

export const mockTaskViewModels: TaskViewModel[] = mockFHIRTasks.map(
  (task) => ({
    id: task.id ?? '',
    name: task.description ?? task.code?.text ?? '',
    code: task.code?.coding?.[0]?.code ?? task.code?.text ?? '',
    status: task.status,
    completedBy: task.owner?.display,
    completedOn: formatMockDateTime(task.executionPeriod?.end),
    partOf:
      task.partOf
        ?.map((ref) => ref.reference)
        .filter((ref): ref is string => !!ref) ?? [],
    fhirResource: task,
  }),
);

export const mockLeafTasks: TaskViewModel[] = [
  mockTaskViewModels[1], // task-2 (has partOf)
  mockTaskViewModels[2], // task-3 (has partOf)
  mockTaskViewModels[0], // task-1 (no partOf, not referenced)
];

export const mockTasksControlConfig = {
  showOnlyLeafTasks: true,
  taskTypes: [VITALS_TASK_CODE, LAB_TESTS_TASK_CODE],
};

export const mockTasksControlConfigNoFitlers = {
  showOnlyLeafTasks: false,
};

export const mockTaskActionConfig = [
  {
    taskCode: VITALS_TASK_CODE,
    actions: [
      {
        label: 'Fill Form',
        type: 'launchForm',
        icon: 'edit',
        requiredPrivileges: ['Edit Vitals'],
        handlerConfig: {
          formInputCode: FORM_NAME_INPUT_CODE,
          encounterType: 'consultation',
        },
      },
    ],
  },
];

export const mockTasksControlConfigWithActions = {
  showOnlyLeafTasks: false,
  actionConfig: mockTaskActionConfig,
};

export const mockError = new Error('Failed to fetch tasks');
