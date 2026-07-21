import type { ObservationForm, UserPrivilege } from '@bahmni/services';
import { TaskActionType, TaskViewType, FormPermissionType } from './constants';
import type { TaskViewModel, TaskConfig, TaskView, TaskAction } from './models';

/**
 * Extract form name from task input based on inputType
 * @param task - TaskViewModel containing the full FHIR Task resource
 * @param inputType - The concept UUID to look for in task.input[].type.coding[].code
 * @returns The form name from task.input[].valueString, or null if not found
 */
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

/**
 * Check if user has privileges to access a specific form with given permission type
 * @param userPrivileges - User's privileges
 * @param form - Observation form to check
 * @param permissionType - Type of permission to check ('editable' or 'viewable')
 * @returns true if user has the specified permission for the form, false otherwise
 */
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

/**
 * Check if action config has any 'launchForm' type actions for the given task
 * @param taskConfig - Array of task configurations
 * @param taskCode - The task code to check
 * @returns true if there are launchForm actions, false otherwise
 */
export const hasLaunchFormActions = (
  taskConfig: TaskConfig[],
  taskCode: string,
): boolean => {
  const matchingConfig = taskConfig?.find(
    (config) => config.taskCode === taskCode,
  );
  return (
    matchingConfig?.actions?.some(
      (action) => action.type === TaskActionType.LAUNCH_FORM,
    ) ?? false
  );
};

/**
 * Check if task config has any 'viewForm' type views for the given task
 * @param taskConfig - Array of task configurations
 * @param taskCode - The task code to check
 * @returns true if there are viewForm views, false otherwise
 */
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

/**
 * Check if an action should be visible for the given task
 * @param action - TaskAction configuration
 * @param task - TaskViewModel
 * @param allForms - All available observation forms
 * @param userPrivileges - User's privileges
 * @returns true if action should be visible, false otherwise
 */
export const isFormActionVisible = (
  action: TaskAction,
  task: TaskViewModel,
  allForms: ObservationForm[],
  userPrivileges: UserPrivilege[] | null,
): boolean => {
  if (action.type === TaskActionType.LAUNCH_FORM) {
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
  }

  return false;
};

/**
 * Check if a view should be visible for the given task
 * @param view - TaskView configuration
 * @param task - TaskViewModel
 * @param userPrivileges - User's privileges
 * @returns true if view should be visible, false otherwise
 */
export const isViewFormDataVisible = (
  view: TaskView,
  task: TaskViewModel,
  userPrivileges: UserPrivilege[] | null,
): boolean => {
  if (view.type === TaskViewType.VIEW_FORM) {
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

    if (view.requiredPrivileges.length === 0) {
      return true;
    }

    const userPrivilegeNames = new Set(
      userPrivileges.map((privilege) => privilege.name),
    );

    return view.requiredPrivileges.every((requiredPrivilege) =>
      userPrivilegeNames.has(requiredPrivilege),
    );
  }

  return false;
};
