import { Icon, IconButton } from '@bahmni/design-system';
import {
  fetchObservationForms,
  hasPrivilege,
  type ObservationForm,
} from '@bahmni/services';
import { useQuery } from '@tanstack/react-query';
import React, { useMemo } from 'react';
import { useUserPrivilege } from '../../userPrivileges/useUserPrivilege';
import type { TaskViewModel, TaskActionConfig } from '../models';
import { handleTaskAction, isActionVisible } from './actionHandlers';

const READY_TASK_STATUS = 'ready' as const;

interface TaskActionsProps {
  task: TaskViewModel;
  actionConfig: TaskActionConfig[];
}

const TaskActions: React.FC<TaskActionsProps> = ({ task, actionConfig }) => {
  const { userPrivileges } = useUserPrivilege();

  const { data: allForms = [], isLoading: isFormsLoading } = useQuery<
    ObservationForm[],
    Error
  >({
    queryKey: ['observationForms'],
    queryFn: () => fetchObservationForms(),
  });

  const matchingConfig = useMemo(() => {
    if (!actionConfig) return null;
    return actionConfig.find((config) => config.taskCode === task.code);
  }, [actionConfig, task.code]);

  const permittedActions = useMemo(() => {
    if (!matchingConfig?.actions || isFormsLoading) return [];

    return matchingConfig.actions.filter((action) => {
      if (!hasPrivilege(userPrivileges, action.requiredPrivileges)) {
        return false;
      }

      return isActionVisible(action, task, allForms, userPrivileges);
    });
  }, [matchingConfig, userPrivileges, allForms, isFormsLoading, task]);

  if (permittedActions.length === 0) {
    return null;
  }

  const action = permittedActions[0];

  const isButtonDisabled = task.status !== READY_TASK_STATUS;

  return (
    <IconButton
      label={action.label}
      kind="ghost"
      size="sm"
      onClick={() => handleTaskAction(action, task)}
      testId={`task-action-${action.type}-${task.id}`}
      disabled={isButtonDisabled}
    >
      <Icon name={action.icon} id={`task-action-icon-${task.id}`} />
    </IconButton>
  );
};

export default TaskActions;
