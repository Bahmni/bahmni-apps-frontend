import { FormPermissionType } from '../constants';
import type { TaskViewModel } from '../models';
import {
  extractFormNameFromTask,
  hasViewFormConfig,
  hasFormActions,
  isViewFormDataVisible,
  isFormActionVisible,
  canUserAccessForm,
} from '../utils';
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
  mockTaskViewModelCompleted,
  mockLaunchFormAction,
  mockEditFormAction,
  mockUserPrivileges,
  mockEmptyUserPrivileges,
  mockObservationForms,
  mockTaskConfig,
  mockTaskConfigWithEditForm,
} from './__mocks__/taskActionsMocks';
import { VITALS_TASK_CODE } from './__mocks__/taskListMocks';

describe('extractFormNameFromTask', () => {
  it.each([
    [
      'matching input',
      mockTaskViewModelWithInput,
      'form-name-input-type',
      'Vitals',
    ],
    [
      'different input type',
      mockTaskViewModelWithInput,
      'other-input-type',
      'Some other value',
    ],
    [
      'case-insensitive',
      mockTaskViewModelWithCaseInsensitiveForm,
      'form-name-input-type',
      'VITALS',
    ],
    [
      'empty input array',
      mockTaskViewModelWithEmptyInput,
      'form-name-input-type',
      null,
    ],
    [
      'no matching input',
      mockTaskViewModelWithInput,
      'non-existent-input-type',
      null,
    ],
    [
      'missing input',
      mockTaskViewModelWithoutInput,
      'form-name-input-type',
      null,
    ],
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
    [
      'non-matching task code',
      mockTaskConfigWithViews,
      'non-existent-code',
      false,
    ],
    ['null taskConfig', null, VITALS_TASK_CODE, false],
    ['undefined taskConfig', undefined, VITALS_TASK_CODE, false],
  ])(
    'should return correct value for %s',
    (_desc, config, taskCode, expected) => {
      expect(hasViewFormConfig(config as any, taskCode)).toBe(expected);
    },
  );
});

describe('isViewFormDataVisible', () => {
  const mockCompletedTask: TaskViewModel = {
    ...mockTaskViewModelWithInput,
    status: 'completed',
  };

  const viewableVitalsForm = {
    ...mockObservationForms[0],
    privileges: [
      { privilegeName: 'Edit Vitals', editable: true, viewable: true },
    ],
  };
  const nonViewableVitalsForm = {
    ...mockObservationForms[0],
    privileges: [
      { privilegeName: 'Edit Vitals', editable: true, viewable: false },
    ],
  };
  const viewableFormsList = [
    viewableVitalsForm,
    ...mockObservationForms.slice(1),
  ];
  const nonViewableFormsList = [
    nonViewableVitalsForm,
    ...mockObservationForms.slice(1),
  ];

  it.each([
    [
      'completed task with form and viewable privilege',
      mockCompletedTask,
      mockViewFormView,
      viewableFormsList,
      mockUserPrivileges,
      true,
    ],
    [
      'in-progress task',
      { ...mockCompletedTask, status: 'in-progress' },
      mockViewFormView,
      viewableFormsList,
      mockUserPrivileges,
      false,
    ],
    [
      'null privileges',
      mockCompletedTask,
      mockViewFormView,
      viewableFormsList,
      null,
      false,
    ],
    [
      'empty privileges',
      mockCompletedTask,
      mockViewFormView,
      viewableFormsList,
      mockEmptyUserPrivileges,
      false,
    ],
    [
      'no form name',
      {
        ...mockCompletedTask,
        fhirResource: { ...mockCompletedTask.fhirResource, input: [] },
      },
      mockViewFormView,
      viewableFormsList,
      mockUserPrivileges,
      false,
    ],
    [
      'lacks required privilege',
      mockCompletedTask,
      mockViewFormViewRestricted,
      viewableFormsList,
      mockUserPrivileges,
      false,
    ],
    [
      'no required privileges, form is viewable',
      mockCompletedTask,
      { ...mockViewFormView, requiredPrivileges: [] },
      viewableFormsList,
      mockUserPrivileges,
      true,
    ],
    [
      'form not viewable by user',
      mockCompletedTask,
      mockViewFormView,
      nonViewableFormsList,
      mockUserPrivileges,
      false,
    ],
    [
      'no matching form in allForms',
      mockCompletedTask,
      mockViewFormView,
      [],
      mockUserPrivileges,
      false,
    ],
  ])(
    'should handle %s',
    (_desc, task, view, allForms, privileges, expected) => {
      expect(isViewFormDataVisible(view, task, allForms, privileges)).toBe(
        expected,
      );
    },
  );
});

describe('canUserAccessForm', () => {
  const vitalsForm = mockObservationForms[0];
  const labTestsForm = mockObservationForms[1];
  const generalForm = mockObservationForms[2];

  it.each([
    [
      'editable permission with privileges',
      mockUserPrivileges,
      vitalsForm,
      FormPermissionType.EDITABLE,
      true,
    ],
    [
      'viewable permission with privileges',
      mockUserPrivileges,
      labTestsForm,
      FormPermissionType.VIEWABLE,
      false,
    ],
    ['null privileges', null, vitalsForm, FormPermissionType.EDITABLE, false],
    [
      'empty privileges',
      mockEmptyUserPrivileges,
      vitalsForm,
      FormPermissionType.EDITABLE,
      false,
    ],
    [
      'undefined form',
      mockUserPrivileges,
      undefined,
      FormPermissionType.EDITABLE,
      false,
    ],
    [
      'form with no privileges',
      mockUserPrivileges,
      generalForm,
      FormPermissionType.EDITABLE,
      true,
    ],
  ])(
    'should handle %s',
    (_desc, privileges, form, permissionType, expected) => {
      expect(canUserAccessForm(privileges, form, permissionType)).toBe(
        expected,
      );
    },
  );
});

describe('hasFormActions', () => {
  it.each([
    ['config with launch form actions', mockTaskConfig, VITALS_TASK_CODE, true],
    [
      'config with edit form actions',
      mockTaskConfigWithEditForm,
      VITALS_TASK_CODE,
      true,
    ],
    ['empty taskConfig', [], VITALS_TASK_CODE, false],
    ['non-matching task code', mockTaskConfig, 'non-existent-code', false],
  ])('should handle %s', (_desc, config, taskCode, expected) => {
    expect(hasFormActions(config, taskCode)).toBe(expected);
  });
});

describe('isFormActionVisible', () => {
  describe('LAUNCH_FORM action', () => {
    it('should be visible for ready task with matching form and privilege', () => {
      const readyTask = { ...mockTaskViewModelWithInput, status: 'ready' };
      expect(
        isFormActionVisible(
          mockLaunchFormAction,
          readyTask,
          mockObservationForms,
          mockUserPrivileges,
        ),
      ).toBe(true);
    });

    it('should not be visible for completed task', () => {
      expect(
        isFormActionVisible(
          mockLaunchFormAction,
          mockTaskViewModelCompleted,
          mockObservationForms,
          mockUserPrivileges,
        ),
      ).toBe(false);
    });

    it('should not be visible when form name is missing', () => {
      expect(
        isFormActionVisible(
          mockLaunchFormAction,
          mockTaskViewModelWithoutInput,
          mockObservationForms,
          mockUserPrivileges,
        ),
      ).toBe(false);
    });
  });

  describe('EDIT_FORM action', () => {
    it('should be visible for completed task with matching form and privilege', () => {
      expect(
        isFormActionVisible(
          mockEditFormAction,
          mockTaskViewModelCompleted,
          mockObservationForms,
          mockUserPrivileges,
        ),
      ).toBe(true);
    });

    it('should not be visible for non-completed task', () => {
      const readyTask = { ...mockTaskViewModelWithInput, status: 'ready' };
      expect(
        isFormActionVisible(
          mockEditFormAction,
          readyTask,
          mockObservationForms,
          mockUserPrivileges,
        ),
      ).toBe(false);
    });

    it('should not be visible when form name is missing', () => {
      const completedTaskNoInput: TaskViewModel = {
        ...mockTaskViewModelCompleted,
        fhirResource: { ...mockTaskViewModelCompleted.fhirResource, input: [] },
      };
      expect(
        isFormActionVisible(
          mockEditFormAction,
          completedTaskNoInput,
          mockObservationForms,
          mockUserPrivileges,
        ),
      ).toBe(false);
    });

    it('should not be visible when user lacks edit privilege', () => {
      expect(
        isFormActionVisible(
          mockEditFormAction,
          mockTaskViewModelCompleted,
          mockObservationForms,
          mockEmptyUserPrivileges,
        ),
      ).toBe(false);
    });
  });
});
