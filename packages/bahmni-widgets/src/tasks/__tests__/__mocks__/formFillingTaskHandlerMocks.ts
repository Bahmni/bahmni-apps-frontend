import { TaskViewModel } from '../../handlers/models';

export const mockTaskViewModels: TaskViewModel[] = [
  {
    id: 'task-1',
    name: 'Vitals Form',
    code: 'vitals-form',
    status: 'requested',
  },
  {
    id: 'task-2',
    name: 'Physical Exam',
    code: 'physical-exam',
    status: 'completed',
    completedBy: 'Dr. Smith',
    completedOn: '2025-03-25 11:00AM',
  },
  {
    id: 'task-3',
    name: 'Lab Review',
    code: 'lab-review',
    status: 'in-progress',
    completedBy: 'Dr. Johnson',
  },
];

export const emptyTaskList: TaskViewModel[] = [];

export const mockError = new Error('Failed to load tasks');
