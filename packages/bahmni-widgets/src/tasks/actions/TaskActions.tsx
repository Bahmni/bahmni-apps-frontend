import {
  Add,
  Edit,
  Icon,
  IconButton,
  Loading,
  OverflowMenu,
  OverflowMenuItem,
} from '@bahmni/design-system';
import {
  fetchObservationForms,
  getFormattedError,
  hasPrivilege,
  type ObservationForm,
  useTranslation,
} from '@bahmni/services';
import { useQuery } from '@tanstack/react-query';
import React, { useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { useNotification } from '../../notification';
import { useUserPrivilege } from '../../userPrivileges/useUserPrivilege';
import { TaskActionType } from '../constants';
import type { TaskAction, TaskViewModel, TaskConfig } from '../models';
import { hasFormActions, isFormActionVisible } from '../utils';
import { handleTaskAction } from './actionHandlers';

const READY_TASK_STATUS = 'ready' as const;

const TASK_ACTION_ICONS: Record<string, React.ReactNode> = {
  [TaskActionType.LAUNCH_FORM]: <Add data-testid="task-action-icon-add" />,
  [TaskActionType.EDIT_FORM]: <Edit data-testid="task-action-icon-edit" />,
};

interface TaskActionsProps {
  task: TaskViewModel;
  taskConfig: TaskConfig[];
}

const TaskActions: React.FC<TaskActionsProps> = ({ task, taskConfig }) => {
  const { userPrivileges } = useUserPrivilege();
  const { t } = useTranslation();
  const { addNotification } = useNotification();
  const [isLoading, setIsLoading] = useState(false);

  const shouldFetchForms = hasFormActions(taskConfig, task.code);

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

  const getIsActionDisabled = (action: { type: string }): boolean =>
    action.type === TaskActionType.EDIT_FORM
      ? task.status !== 'completed'
      : task.status !== READY_TASK_STATUS;

  const handleActionClick = async (action: TaskAction) => {
    setIsLoading(true);
    try {
      await handleTaskAction(action, task);
    } catch (error) {
      const { message } = getFormattedError(error);
      addNotification({
        title: t('ERROR_DEFAULT_TITLE'),
        message,
        type: 'error',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const loadingOverlay =
    isLoading &&
    createPortal(
      <div data-testid={`task-action-loading-overlay-${task.id}`}>
        <Loading active withOverlay />
      </div>,
      document.body,
    );

  if (permittedActions.length === 1) {
    const action = permittedActions[0];

    return (
      <>
        <IconButton
          label={t(action.label)}
          kind="ghost"
          size="sm"
          onClick={() => handleActionClick(action)}
          testId={`task-action-${action.type}-${task.id}`}
          disabled={getIsActionDisabled(action)}
        >
          {TASK_ACTION_ICONS[action.type] ?? (
            <Icon name={action.icon} id={`task-action-icon-${task.id}`} />
          )}
        </IconButton>
        {loadingOverlay}
      </>
    );
  }

  return (
    <>
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
            disabled={getIsActionDisabled(action)}
            onClick={() => handleActionClick(action)}
          />
        ))}
      </OverflowMenu>
      {loadingOverlay}
    </>
  );
};

export default TaskActions;
