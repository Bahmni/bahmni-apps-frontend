import { TaskActionType } from '../constants';
import type { TaskAction, TaskViewModel } from '../models';
import { extractFormNameFromTask } from '../utils';

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
        task: task.fhirResource,
      },
    }),
  );
};

export const handleTaskAction = (
  action: TaskAction,
  task: TaskViewModel,
): void => {
  if (action.type === TaskActionType.LAUNCH_FORM) {
    handleLaunchFormAction(action, task);
  }
};
