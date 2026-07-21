import type { TaskViewModel } from '../models';
import {
  extractFormNameFromTask,
  canUserEditForm,
  hasViewFormViews,
  isViewVisible,
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
  mockObservationForms,
  mockUserPrivileges,
  mockEmptyUserPrivileges,
} from './__mocks__/taskActionsMocks';
import { VITALS_TASK_CODE } from './__mocks__/taskListMocks';

describe('extractFormNameFromTask', () => {
  it('should extract valueString from matching input', () => {
    const formName = extractFormNameFromTask(
      mockTaskViewModelWithInput,
      'form-name-input-type',
    );
    expect(formName).toBe('Vitals');
  });

  it('should return null when input array is empty', () => {
    const formName = extractFormNameFromTask(
      mockTaskViewModelWithEmptyInput,
      'form-name-input-type',
    );
    expect(formName).toBeNull();
  });

  it('should return null when no matching inputType found', () => {
    const formName = extractFormNameFromTask(
      mockTaskViewModelWithInput,
      'non-existent-input-type',
    );
    expect(formName).toBeNull();
  });

  it('should return null when fhirTask.input is missing', () => {
    const formName = extractFormNameFromTask(
      mockTaskViewModelWithoutInput,
      'form-name-input-type',
    );
    expect(formName).toBeNull();
  });

  it('should match inputType by code in type.coding[0]', () => {
    const formName = extractFormNameFromTask(
      mockTaskViewModelWithInput,
      'other-input-type',
    );
    expect(formName).toBe('Some other value');
  });

  it('should handle case-insensitive form name extraction', () => {
    const formName = extractFormNameFromTask(
      mockTaskViewModelWithCaseInsensitiveForm,
      'form-name-input-type',
    );
    expect(formName).toBe('VITALS');
  });
});

describe('canUserEditForm', () => {
  const vitalsForm = mockObservationForms[0];
  const labTestsForm = mockObservationForms[1];
  const generalForm = mockObservationForms[2];
  const restrictedForm = mockObservationForms[3];

  it('should return false when form is undefined', () => {
    const canEdit = canUserEditForm(mockUserPrivileges, undefined);
    expect(canEdit).toBe(false);
  });

  it('should return false when userPrivileges is null', () => {
    const canEdit = canUserEditForm(null, vitalsForm);
    expect(canEdit).toBe(false);
  });

  it('should return false when userPrivileges is empty array', () => {
    const canEdit = canUserEditForm(mockEmptyUserPrivileges, vitalsForm);
    expect(canEdit).toBe(false);
  });

  it('should return true when form has no privileges configured', () => {
    const canEdit = canUserEditForm(mockUserPrivileges, generalForm);
    expect(canEdit).toBe(true);
  });

  it('should return true when user has editable privilege', () => {
    const canEdit = canUserEditForm(mockUserPrivileges, vitalsForm);
    expect(canEdit).toBe(true);
  });

  it('should return false when user has non-editable privilege', () => {
    const viewOnlyPrivileges = [{ name: 'View Only Access', retired: false }];
    const canEdit = canUserEditForm(viewOnlyPrivileges, labTestsForm);
    expect(canEdit).toBe(false);
  });

  it('should return false when user lacks required privilege', () => {
    const canEdit = canUserEditForm(mockUserPrivileges, restrictedForm);
    expect(canEdit).toBe(false);
  });

  it('should return true when user has at least one editable privilege among multiple', () => {
    const canEdit = canUserEditForm(mockUserPrivileges, labTestsForm);
    expect(canEdit).toBe(true);
  });

  it.each([
    [null, vitalsForm, false],
    [mockEmptyUserPrivileges, vitalsForm, false],
    [mockUserPrivileges, undefined, false],
    [mockUserPrivileges, generalForm, true],
    [mockUserPrivileges, vitalsForm, true],
  ])(
    'should return correct value for userPrivileges=%p, form=%p',
    (privileges, form, expected) => {
      const canEdit = canUserEditForm(privileges, form);
      expect(canEdit).toBe(expected);
    },
  );
});

describe('hasViewFormViews', () => {
  it.each([
    [
      'taskConfig with viewForm views',
      mockTaskConfigWithViews,
      VITALS_TASK_CODE,
      true,
    ],
    ['empty views array', mockTaskConfigEmptyViews, VITALS_TASK_CODE, false],
    ['no views property', mockTaskConfigNoViews, VITALS_TASK_CODE, false],
    ['empty taskConfig', [], VITALS_TASK_CODE, false],
    [
      'non-matching task code',
      mockTaskConfigWithViews,
      'non-existent-code',
      false,
    ],
  ])('should return %s for %s', (_, config, taskCode, expected) => {
    expect(hasViewFormViews(config, taskCode)).toBe(expected);
  });

  it('should return false when taskConfig is null', () => {
    expect(hasViewFormViews(null as any, VITALS_TASK_CODE)).toBe(false);
  });

  it('should return false when taskConfig is undefined', () => {
    expect(hasViewFormViews(undefined as any, VITALS_TASK_CODE)).toBe(false);
  });

  it('should return true when multiple views include viewForm type', () => {
    const configWithMultipleViews = [
      {
        taskCode: VITALS_TASK_CODE,
        views: [
          mockViewFormView,
          { ...mockViewFormView, label: 'Another View' },
        ],
      },
    ];
    expect(hasViewFormViews(configWithMultipleViews, VITALS_TASK_CODE)).toBe(
      true,
    );
  });

  it('should return false when views exist but none are viewForm type', () => {
    const configWithNonViewFormViews = [
      {
        taskCode: VITALS_TASK_CODE,
        views: [{ ...mockViewFormView, type: 'otherType' }],
      },
    ];
    expect(hasViewFormViews(configWithNonViewFormViews, VITALS_TASK_CODE)).toBe(
      false,
    );
  });
});

describe('isViewVisible', () => {
  const mockCompletedTask: TaskViewModel = {
    ...mockTaskViewModelWithInput,
    status: 'completed',
  };

  const mockInProgressTask: TaskViewModel = {
    ...mockTaskViewModelWithInput,
    status: 'in-progress',
  };

  const mockRequestedTask: TaskViewModel = {
    ...mockTaskViewModelWithInput,
    status: 'requested',
  };

  const mockReadyTask: TaskViewModel = {
    ...mockTaskViewModelWithInput,
    status: 'ready',
  };

  describe('Task status filtering', () => {
    it.each([
      ['in-progress', mockInProgressTask, false],
      ['requested', mockRequestedTask, false],
      ['ready', mockReadyTask, false],
      ['completed', mockCompletedTask, true],
    ])('should return %s for %s task status', (statusName, task, expected) => {
      const result = isViewVisible(mockViewFormView, task, mockUserPrivileges);
      expect(result).toBe(expected);
    });
  });

  describe('Form name extraction', () => {
    it('should return false when form name cannot be extracted', () => {
      const taskWithoutInput: TaskViewModel = {
        ...mockCompletedTask,
        fhirResource: {
          ...mockCompletedTask.fhirResource,
          input: [],
        },
      };
      const result = isViewVisible(
        mockViewFormView,
        taskWithoutInput,
        mockUserPrivileges,
      );
      expect(result).toBe(false);
    });

    it('should return false when task has no input property', () => {
      const taskWithNoInput: TaskViewModel = {
        ...mockCompletedTask,
        fhirResource: {
          ...mockCompletedTask.fhirResource,
          input: undefined,
        },
      };
      const result = isViewVisible(
        mockViewFormView,
        taskWithNoInput,
        mockUserPrivileges,
      );
      expect(result).toBe(false);
    });

    it('should return true when form name exists', () => {
      const result = isViewVisible(
        mockViewFormView,
        mockCompletedTask,
        mockUserPrivileges,
      );
      expect(result).toBe(true);
    });
  });

  describe('User privileges filtering', () => {
    it('should return false when userPrivileges is null', () => {
      const result = isViewVisible(mockViewFormView, mockCompletedTask, null);
      expect(result).toBe(false);
    });

    it('should return false when userPrivileges is empty array', () => {
      const result = isViewVisible(
        mockViewFormView,
        mockCompletedTask,
        mockEmptyUserPrivileges,
      );
      expect(result).toBe(false);
    });

    it('should return true when view has no required privileges', () => {
      const viewWithNoPrivileges = {
        ...mockViewFormView,
        requiredPrivileges: [],
      };
      const result = isViewVisible(
        viewWithNoPrivileges,
        mockCompletedTask,
        mockUserPrivileges,
      );
      expect(result).toBe(true);
    });

    it('should return true when user has all required privileges', () => {
      const result = isViewVisible(
        mockViewFormView,
        mockCompletedTask,
        mockUserPrivileges,
      );
      expect(result).toBe(true);
    });

    it('should return false when user lacks required privilege', () => {
      const result = isViewVisible(
        mockViewFormViewRestricted,
        mockCompletedTask,
        mockUserPrivileges,
      );
      expect(result).toBe(false);
    });

    it('should return false when user has only some of multiple required privileges', () => {
      const viewWithMultiplePrivileges = {
        ...mockViewFormView,
        requiredPrivileges: ['Edit Vitals', 'Admin Only'],
      };
      const result = isViewVisible(
        viewWithMultiplePrivileges,
        mockCompletedTask,
        mockUserPrivileges,
      );
      expect(result).toBe(false);
    });

    it('should return true when user has all of multiple required privileges', () => {
      const viewWithMultiplePrivileges = {
        ...mockViewFormView,
        requiredPrivileges: ['Edit Vitals', 'Edit Lab Tests'],
      };
      const result = isViewVisible(
        viewWithMultiplePrivileges,
        mockCompletedTask,
        mockUserPrivileges,
      );
      expect(result).toBe(true);
    });
  });

  describe('Combined conditions', () => {
    it.each([
      [
        'completed status + has privileges + has form',
        mockCompletedTask,
        mockViewFormView,
        mockUserPrivileges,
        true,
      ],
      [
        'in-progress status + has privileges + has form',
        mockInProgressTask,
        mockViewFormView,
        mockUserPrivileges,
        false,
      ],
      [
        'completed status + no privileges + has form',
        mockCompletedTask,
        mockViewFormView,
        mockEmptyUserPrivileges,
        false,
      ],
      [
        'completed status + has privileges + no form',
        {
          ...mockCompletedTask,
          fhirResource: { ...mockCompletedTask.fhirResource, input: [] },
        },
        mockViewFormView,
        mockUserPrivileges,
        false,
      ],
      [
        'completed status + lacks required privilege + has form',
        mockCompletedTask,
        mockViewFormViewRestricted,
        mockUserPrivileges,
        false,
      ],
    ])('should return %s when %s', (_, task, view, privileges, expected) => {
      const result = isViewVisible(view, task, privileges);
      expect(result).toBe(expected);
    });
  });
});
