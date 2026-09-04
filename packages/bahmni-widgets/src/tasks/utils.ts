import type { ObservationForm, UserPrivilege } from '@bahmni/services';
import { TaskActionType, TaskViewType, FormPermissionType } from './constants';
import type { TaskViewModel, TaskConfig, TaskView, TaskAction } from './models';

export const extractFormNameFromTask = (
  task: TaskViewModel,
  inputType: string,
): string | null => {
  const fhirTask = task.fhirResource;

  if (!fhirTask.input) {
    return null;
  }

  // Find the input entry that matches the inputType
  const matchingInput = fhirTask.input.find((input) => {
    const typeCoding = input.type?.coding?.[0];
    return typeCoding?.code === inputType;
  });

  // Return the valueString from the matching input
  return matchingInput?.valueString ?? null;
};

export const canUserAccessForm = (
  userPrivileges: UserPrivilege[] | null,
  form: ObservationForm | undefined,
  permissionType: FormPermissionType = FormPermissionType.EDITABLE,
): boolean => {
  if (!form) {
    return false;
  }

  if (!userPrivileges || userPrivileges.length === 0) {
    return false;
  }

  if (!form.privileges || form.privileges.length === 0) {
    return true;
  }

  const userPrivilegeNames = new Set(
    userPrivileges.map((privilege) => privilege.name),
  );

  return form.privileges.some((formPrivilege) => {
    const hasFormPrivilege = userPrivilegeNames.has(
      formPrivilege.privilegeName,
    );
    return hasFormPrivilege && formPrivilege[permissionType];
  });
};

export const hasFormActions = (
  taskConfig: TaskConfig[],
  taskCode: string,
): boolean => {
  const matchingConfig = taskConfig?.find(
    (config) => config.taskCode === taskCode,
  );
  return (
    matchingConfig?.actions?.some(
      (action) =>
        action.type === TaskActionType.LAUNCH_FORM ||
        action.type === TaskActionType.EDIT_FORM,
    ) ?? false
  );
};

export const hasViewFormConfig = (
  taskConfig: TaskConfig[],
  taskCode: string,
): boolean => {
  const matchingConfig = taskConfig?.find(
    (config) => config.taskCode === taskCode,
  );
  return (
    matchingConfig?.views?.some(
      (view) => view.type === TaskViewType.VIEW_FORM,
    ) ?? false
  );
};

const FORM_ACTION_STATUS_PREDICATE: Partial<
  Record<TaskActionType, (status: string) => boolean>
> = {
  [TaskActionType.LAUNCH_FORM]: (status) => status !== 'completed',
  [TaskActionType.EDIT_FORM]: (status) => status === 'completed',
};

export const isFormActionVisible = (
  action: TaskAction,
  task: TaskViewModel,
  allForms: ObservationForm[],
  userPrivileges: UserPrivilege[] | null,
): boolean => {
  const statusPredicate = FORM_ACTION_STATUS_PREDICATE[action.type];
  if (!statusPredicate?.(task.status)) return false;

  const formName = extractFormNameFromTask(
    task,
    action.handlerConfig.formInputCode as string,
  );
  if (!formName) return false;

  const matchingForm = allForms.find(
    (form) => form.name.toLowerCase() === formName.toLowerCase(),
  );
  return matchingForm
    ? canUserAccessForm(
        userPrivileges,
        matchingForm,
        FormPermissionType.EDITABLE,
      )
    : false;
};

export const isViewFormDataVisible = (
  view: TaskView,
  task: TaskViewModel,
  allForms: ObservationForm[],
  userPrivileges: UserPrivilege[] | null,
): boolean => {
  if (view.type !== TaskViewType.VIEW_FORM) {
    return false;
  }

  if (task.status !== 'completed') {
    return false;
  }

  const formName = extractFormNameFromTask(
    task,
    view.handlerConfig.formInputCode,
  );

  if (!formName) {
    return false;
  }

  if (!userPrivileges || userPrivileges.length === 0) {
    return false;
  }

  if (view.requiredPrivileges.length > 0) {
    const userPrivilegeNames = new Set(
      userPrivileges.map((privilege) => privilege.name),
    );
    const hasAllRequired = view.requiredPrivileges.every((requiredPrivilege) =>
      userPrivilegeNames.has(requiredPrivilege),
    );
    if (!hasAllRequired) {
      return false;
    }
  }

  const matchingForm = allForms.find(
    (form) => form.name.toLowerCase() === formName.toLowerCase(),
  );
  return matchingForm
    ? canUserAccessForm(
        userPrivileges,
        matchingForm,
        FormPermissionType.VIEWABLE,
      )
    : false;
};
