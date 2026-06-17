import { TaskViewModel } from '../../handlers/models';

export const mockTaskViewModels: TaskViewModel[] = [
  {
    id: 'task-1',
    name: 'Vitals Form',
    status: 'requested',
    code: 'vitals-form',
  },
  {
    id: 'task-2',
    name: 'Physical Exam',
    status: 'completed',
    completedBy: 'Dr. Smith',
    completedOn: '2025-03-25T11:00:00Z',
    code: 'physical-exam',
  },
  {
    id: 'task-3',
    name: 'Lab Review',
    status: 'in-progress',
    completedBy: 'Dr. Johnson',
    code: 'lab-review',
  },
];

export const emptyTaskList: TaskViewModel[] = [];

export const mockError = new Error('Failed to load tasks');
