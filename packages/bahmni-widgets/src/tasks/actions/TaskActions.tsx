import {
  Icon,
  IconButton,
  OverflowMenu,
  OverflowMenuItem,
} from '@bahmni/design-system';
import {
  fetchObservationForms,
  hasPrivilege,
  type ObservationForm,
  useTranslation,
} from '@bahmni/services';
import { useQuery } from '@tanstack/react-query';
import React, { useMemo } from 'react';
import { useUserPrivilege } from '../../userPrivileges/useUserPrivilege';
import type { TaskViewModel, TaskConfig } from '../models';
import { hasLaunchFormActions, isFormActionVisible } from '../utils';
import { handleTaskAction } from './actionHandlers';

const READY_TASK_STATUS = 'ready' as const;

interface TaskActionsProps {
  task: TaskViewModel;
  taskConfig: TaskConfig[];
}

const TaskActions: React.FC<TaskActionsProps> = ({ task, taskConfig }) => {
  const { userPrivileges } = useUserPrivilege();
  const { t } = useTranslation();

  const shouldFetchForms = hasLaunchFormActions(taskConfig, task.code);

  const { data: allForms = [], isLoading: isFormsLoading } = useQuery<
    ObservationForm[],
    Error
  >({
    queryKey: ['observationForms'],
    queryFn: () => fetchObservationForms(),
    enabled: shouldFetchForms,
  });

  const matchingConfig = useMemo(() => {
    if (!taskConfig) return null;
    return taskConfig.find((config) => config.taskCode === task.code);
  }, [taskConfig, task.code]);

  const permittedActions = useMemo(() => {
    if (!matchingConfig?.actions || isFormsLoading) return [];

    return matchingConfig.actions.filter((action) => {
      if (!hasPrivilege(userPrivileges, action.requiredPrivileges)) {
        return false;
      }

      return isFormActionVisible(action, task, allForms, userPrivileges);
    });
  }, [matchingConfig, userPrivileges, allForms, isFormsLoading, task]);

  if (permittedActions.length === 0) {
    return null;
  }

  const isActionDisabled = task.status !== READY_TASK_STATUS;

  if (permittedActions.length === 1) {
    const action = permittedActions[0];

    return (
      <IconButton
        label={t(action.label)}
        kind="ghost"
        size="sm"
        onClick={() => handleTaskAction(action, task)}
        testId={`task-action-${action.type}-${task.id}`}
        disabled={isActionDisabled}
      >
        <Icon name={action.icon} id={`task-action-icon-${task.id}`} />
      </IconButton>
    );
  }

  return (
    <OverflowMenu
      id={`task-actions-menu-${task.id}`}
      testId={`task-actions-menu-${task.id}`}
      aria-label={t('TASK_ACTIONS_MENU_LABEL')}
      flipped
      size="sm"
    >
      {permittedActions.map((action) => (
        <OverflowMenuItem
          id={`task-action-${action.type}-${task.id}`}
          testId={`task-action-${action.type}-${task.id}`}
          key={action.type}
          itemText={t(action.label)}
          isDelete={false}
          disabled={isActionDisabled}
          onClick={() => handleTaskAction(action, task)}
        />
      ))}
    </OverflowMenu>
  );
};

export default TaskActions;
