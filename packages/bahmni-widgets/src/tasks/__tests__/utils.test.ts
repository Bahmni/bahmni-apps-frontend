import type { TaskViewModel } from '../models';
import {
  extractFormNameFromTask,
  hasViewFormConfig,
  hasLaunchFormActions,
  isViewFormDataVisible,
  canUserAccessForm,
} from '../utils';
import { FormPermissionType } from '../constants';
import {
  mockTaskConfigWithViews,
  mockTaskConfigEmptyViews,
  mockTaskConfigNoViews,
  mockViewFormView,
  mockViewFormViewRestricted,
} from './__mocks__/configMocks';
import {
  mockTaskViewModelWithInput,
  mockTaskViewModelWithoutInput,
  mockTaskViewModelWithEmptyInput,
  mockTaskViewModelWithCaseInsensitiveForm,
  mockUserPrivileges,
  mockEmptyUserPrivileges,
  mockObservationForms,
  mockTaskConfig,
} from './__mocks__/taskActionsMocks';
import { VITALS_TASK_CODE } from './__mocks__/taskListMocks';

describe('extractFormNameFromTask', () => {
  it.each([
    ['matching input', mockTaskViewModelWithInput, 'form-name-input-type', 'Vitals'],
    ['different input type', mockTaskViewModelWithInput, 'other-input-type', 'Some other value'],
    ['case-insensitive', mockTaskViewModelWithCaseInsensitiveForm, 'form-name-input-type', 'VITALS'],
    ['empty input array', mockTaskViewModelWithEmptyInput, 'form-name-input-type', null],
    ['no matching input', mockTaskViewModelWithInput, 'non-existent-input-type', null],
    ['missing input', mockTaskViewModelWithoutInput, 'form-name-input-type', null],
  ])('should handle %s', (_desc, task, inputType, expected) => {
    expect(extractFormNameFromTask(task, inputType)).toBe(expected);
  });
});

describe('hasViewFormConfig', () => {
  it.each([
    ['with viewForm views', mockTaskConfigWithViews, VITALS_TASK_CODE, true],
    ['empty views array', mockTaskConfigEmptyViews, VITALS_TASK_CODE, false],
    ['no views property', mockTaskConfigNoViews, VITALS_TASK_CODE, false],
    ['empty taskConfig', [], VITALS_TASK_CODE, false],
    ['non-matching task code', mockTaskConfigWithViews, 'non-existent-code', false],
    ['null taskConfig', null, VITALS_TASK_CODE, false],
    ['undefined taskConfig', undefined, VITALS_TASK_CODE, false],
  ])('should return correct value for %s', (_desc, config, taskCode, expected) => {
    expect(hasViewFormConfig(config as any, taskCode)).toBe(expected);
  });
});

describe('isViewFormDataVisible', () => {
  const mockCompletedTask: TaskViewModel = {
    ...mockTaskViewModelWithInput,
    status: 'completed',
  };

  it.each([
    ['completed task with form and privileges', mockCompletedTask, mockViewFormView, mockUserPrivileges, true],
    ['in-progress task', { ...mockCompletedTask, status: 'in-progress' }, mockViewFormView, mockUserPrivileges, false],
    ['null privileges', mockCompletedTask, mockViewFormView, null, false],
    ['empty privileges', mockCompletedTask, mockViewFormView, mockEmptyUserPrivileges, false],
    ['no form name', { ...mockCompletedTask, fhirResource: { ...mockCompletedTask.fhirResource, input: [] } }, mockViewFormView, mockUserPrivileges, false],
    ['lacks required privilege', mockCompletedTask, mockViewFormViewRestricted, mockUserPrivileges, false],
    ['no required privileges', mockCompletedTask, { ...mockViewFormView, requiredPrivileges: [] }, mockUserPrivileges, true],
  ])('should handle %s', (_desc, task, view, privileges, expected) => {
    expect(isViewFormDataVisible(view, task, privileges)).toBe(expected);
  });
});

describe('canUserAccessForm', () => {
  const vitalsForm = mockObservationForms[0];
  const labTestsForm = mockObservationForms[1];
  const generalForm = mockObservationForms[2];

  it.each([
    ['editable permission with privileges', mockUserPrivileges, vitalsForm, FormPermissionType.EDITABLE, true],
    ['viewable permission with privileges', mockUserPrivileges, labTestsForm, FormPermissionType.VIEWABLE, false],
    ['null privileges', null, vitalsForm, FormPermissionType.EDITABLE, false],
    ['empty privileges', mockEmptyUserPrivileges, vitalsForm, FormPermissionType.EDITABLE, false],
    ['undefined form', mockUserPrivileges, undefined, FormPermissionType.EDITABLE, false],
    ['form with no privileges', mockUserPrivileges, generalForm, FormPermissionType.EDITABLE, true],
  ])('should handle %s', (_desc, privileges, form, permissionType, expected) => {
    expect(canUserAccessForm(privileges, form, permissionType)).toBe(expected);
  });
});

describe('hasLaunchFormActions', () => {
  it.each([
    ['config with launch form actions', mockTaskConfig, VITALS_TASK_CODE, true],
    ['empty taskConfig', [], VITALS_TASK_CODE, false],
    ['non-matching task code', mockTaskConfig, 'non-existent-code', false],
  ])('should handle %s', (_desc, config, taskCode, expected) => {
    expect(hasLaunchFormActions(config, taskCode)).toBe(expected);
  });
});
