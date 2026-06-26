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

  // Filter out actions the user doesn't have privilege for — completely hidden, not disabled
  const permittedActions = useMemo(() => {
    if (!matchingConfig?.actions || isFormsLoading) return [];

    return matchingConfig.actions.filter((action) => {
      // Common privilege check (applies to ALL action types)
      if (!hasPrivilege(userPrivileges, action.requiredPrivileges)) {
        return false;
      }

      // Action-specific visibility check
      return isActionVisible(action, task, allForms, userPrivileges);
    });
  }, [matchingConfig, userPrivileges, allForms, isFormsLoading, task]);

  if (permittedActions.length === 0) {
    return null;
  }

  const action = permittedActions[0];

  return (
    <IconButton
      label={action.label}
      kind="ghost"
      size="sm"
      onClick={() => handleTaskAction(action, task)}
      testId={`task-action-${action.type}-${task.id}`}
    >
      <Icon name={action.icon} id={`task-action-icon-${task.id}`} />
    </IconButton>
  );
};

export default TaskActions;
