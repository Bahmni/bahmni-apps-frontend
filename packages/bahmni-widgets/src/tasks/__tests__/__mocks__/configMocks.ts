import type { TaskView, TaskConfig } from '../../models';
import {
  VITALS_TASK_CODE,
  LAB_TESTS_TASK_CODE,
  FORM_NAME_INPUT_CODE,
} from './taskListMocks';

export const mockViewFormView: TaskView = {
  label: 'View Data',
  type: 'viewForm',
  requiredPrivileges: ['Edit Vitals'],
  handlerConfig: {
    formInputCode: FORM_NAME_INPUT_CODE,
  },
};

export const mockViewFormViewNoPrivileges: TaskView = {
  label: 'View Data',
  type: 'viewForm',
  requiredPrivileges: [],
  handlerConfig: {
    formInputCode: FORM_NAME_INPUT_CODE,
  },
};

export const mockViewFormViewRestricted: TaskView = {
  label: 'View Admin Data',
  type: 'viewForm',
  requiredPrivileges: ['Admin Only'],
  handlerConfig: {
    formInputCode: FORM_NAME_INPUT_CODE,
  },
};

export const mockTaskConfigWithViews: TaskConfig[] = [
  {
    taskCode: VITALS_TASK_CODE,
    views: [mockViewFormView],
  },
  {
    taskCode: LAB_TESTS_TASK_CODE,
    views: [mockViewFormViewNoPrivileges],
  },
];

export const mockTaskConfigWithActionsAndViews: TaskConfig[] = [
  {
    taskCode: VITALS_TASK_CODE,
    actions: [],
    views: [mockViewFormView],
  },
];

export const mockTaskConfigEmptyViews: TaskConfig[] = [
  {
    taskCode: VITALS_TASK_CODE,
    views: [],
  },
];

export const mockTaskConfigNoViews: TaskConfig[] = [
  {
    taskCode: VITALS_TASK_CODE,
  },
];
