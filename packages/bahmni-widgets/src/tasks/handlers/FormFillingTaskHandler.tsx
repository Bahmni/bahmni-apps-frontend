import { DataTable, StatusTag } from '@bahmni/design-system';
import { useTranslation } from '@bahmni/services';
import React, { useCallback } from 'react';
import styles from '../TaskList.module.scss';
import { TaskViewModel } from './models';

interface TaskHandlerProps {
  tasks: TaskViewModel[];
  isLoading?: boolean;
  error?: Error | null;
  // handlerConfig?: Record<string, unknown>; // Config for actions implementation
}

const getStatusDotClassName = (status: string): string => {
  const statusMap: Record<string, string> = {
    completed: styles.completedStatus,
    'in-progress': styles.activeStatus,
    requested: styles.scheduledStatus,
    cancelled: styles.cancelledStatus,
    failed: styles.stoppedStatus,
  };
  return statusMap[status] || styles.defaultStatus;
};

export const FormFillingTaskHandler: React.FC<TaskHandlerProps> = ({
  tasks,
  isLoading,
  error,
  // handlerConfig - Reserved for future actions implementation
}) => {
  const { t } = useTranslation();

  const columns = [
    { key: 'name', header: t('TASK_NAME') },
    { key: 'status', header: t('STATUS') },
    { key: 'completedBy', header: t('COMPLETED_BY') },
    { key: 'completedOn', header: t('COMPLETED_ON') },
  ];

  const renderCell = useCallback(
    (task: TaskViewModel, columnKey: string) => {
      switch (columnKey) {
        case 'name':
          return task.name;
        case 'status':
          return (
            <StatusTag
              label={t(
                `TASK_STATUS_${task.status.toUpperCase().replaceAll('-', '_')}`,
              )}
              dotClassName={getStatusDotClassName(task.status)}
              testId={`task-status-${task.id}`}
            />
          );
        case 'completedBy':
          return task.completedBy ?? '-';
        case 'completedOn':
          return task.completedOn ?? '-';
        default:
          return null;
      }
    },
    [t],
  );

  return (
    <DataTable
      columns={columns}
      rows={tasks}
      ariaLabel={t('FORM_FILLING_TASKS')}
      dataTestId="form-filling-tasks-table"
      emptyStateMessage={tasks.length === 0 ? t('NO_TASKS_FOUND') : null}
      errorStateMessage={error ? t('ERROR_LOADING_TASKS') : null}
      loading={isLoading}
      renderCell={renderCell}
      className={styles.tasksTableBody}
    />
  );
};
