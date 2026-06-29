import type { ObservationForm, UserPrivilege } from '@bahmni/services';
import type { TaskAction, TaskViewModel } from '../models';
import { canUserEditForm, extractFormNameFromTask } from '../utils';

/**
 * Check action-specific visibility requirements
 * (Beyond privilege checks which are done in TaskActions.tsx)
 */
export const isActionVisible = (
  action: TaskAction,
  task: TaskViewModel,
  allForms: ObservationForm[],
  userPrivileges: UserPrivilege[] | null,
): boolean => {
  if (action.type === 'launchForm') {
    const formName = extractFormNameFromTask(
      task,
      action.handlerConfig.formInputCode,
    );

    if (!formName) return false;

    const matchingForm = allForms.find(
      (form) => form.name.toLowerCase() === formName.toLowerCase(),
    );
    return matchingForm ? canUserEditForm(userPrivileges, matchingForm) : false;
  }

  // Add more action types here as needed
  // if (action.type === 'otherType') { ... }

  return false;
};

const handleLaunchFormAction = (
  action: TaskAction,
  task: TaskViewModel,
): void => {
  const formName = extractFormNameFromTask(
    task,
    action.handlerConfig.formInputCode as string,
  );

  globalThis.dispatchEvent(
    new CustomEvent('startConsultation', {
      detail: {
        encounterType: action.handlerConfig.encounterType,
        taskFormName: formName,
        directFormMode: true,
        editOnly: 'observationForms',
      },
    }),
  );
};

export const handleTaskAction = (
  action: TaskAction,
  task: TaskViewModel,
): void => {
  if (action.type === 'launchForm') {
    handleLaunchFormAction(action, task);
  }
  // Add more action types here as needed
};
