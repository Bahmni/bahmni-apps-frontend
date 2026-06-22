import { Bundle, Task } from 'fhir/r4';
import { TaskViewModel } from '../../models';

export const mockTaskViewModels: TaskViewModel[] = [
  {
    id: 'task-1',
    name: 'Vitals Form',
    code: '6501d0f9-98da-44be-afc9-e2319453f0d6',
    status: 'completed',
    completedBy: 'Dr. Smith',
    completedOn: '2025-03-25 11:00AM',
    partOf: [],
  },
  {
    id: 'task-2',
    name: 'Physical Exam',
    code: '7601d0f9-98da-44be-afc9-e2319453f0d7',
    status: 'in-progress',
    completedBy: 'Dr. Johnson',
    completedOn: '-',
    partOf: ['Task/parent-task-1'],
  },
  {
    id: 'task-3',
    name: 'Lab Review',
    code: '8701d0f9-98da-44be-afc9-e2319453f0d8',
    status: 'requested',
    completedBy: undefined,
    completedOn: '-',
    partOf: ['Task/parent-task-1'],
  },
  {
    id: 'parent-task-1',
    name: 'Complete Patient Intake',
    code: '9801d0f9-98da-44be-afc9-e2319453f0d9',
    status: 'in-progress',
    completedBy: undefined,
    completedOn: '-',
    partOf: [],
  },
];

export const mockLeafTasks: TaskViewModel[] = [
  mockTaskViewModels[1], // task-2 (has partOf)
  mockTaskViewModels[2], // task-3 (has partOf)
  mockTaskViewModels[0], // task-1 (no partOf, not referenced)
];

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
          code: '6501d0f9-98da-44be-afc9-e2319453f0d6',
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
          code: '7601d0f9-98da-44be-afc9-e2319453f0d7',
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

export const mockTasksControlConfig = {
  showOnlyLeafTasks: true,
  taskTypes: [
    '6501d0f9-98da-44be-afc9-e2319453f0d6',
    '7601d0f9-98da-44be-afc9-e2319453f0d7',
  ],
};

export const mockTasksControlConfigNoFitlers = {
  showOnlyLeafTasks: false,
};

export const mockError = new Error('Failed to fetch tasks');
