import { DataTable, StatusTag } from '@bahmni/design-system';
import {
  shouldEnableEncounterFilter,
  useTranslation,
  getTasks,
  formatDateTime,
  camelToScreamingSnakeCase,
  useSubscribeConsultationSaved,
} from '@bahmni/services';
import { useQuery } from '@tanstack/react-query';
import { Task } from 'fhir/r4';
import React, { useMemo, useCallback } from 'react';
import { usePatientUUID } from '../hooks/usePatientUUID';
import { WidgetProps } from '../registry';
import TaskActions from './components/TaskActions';
import { TaskViewModel, TaskListConfig } from './models';
import styles from './TaskList.module.scss';

interface TaskListProps extends WidgetProps {
  orderReference?: string;
  showEmptyStateMessage?: boolean;
}

const mapTaskToViewModel = (
  task: Task,
  t: (key: string) => string,
): TaskViewModel => {
  return {
    id: task.id ?? '',
    name: task.description ?? task.code?.text ?? '',
    code: task.code?.coding?.[0]?.code ?? task.code?.text ?? '',
    status: task.status,
    completedBy: task.owner?.display,
    completedOn: task.executionPeriod?.end
      ? formatDateTime(task.executionPeriod.end, t, true).formattedResult
      : '-',
    partOf:
      task.partOf
        ?.map((ref) => ref.reference)
        .filter((ref): ref is string => !!ref) ?? [],
    fhirResource: task,
  };
};

const fetchAndTransformTasks = async (
  t: (key: string) => string,
  patientUuid?: string,
  orderReference?: string,
  // encounterUuids?: string[], Would work once backend supports encounter filter for tasks API.
): Promise<TaskViewModel[]> => {
  const data = await getTasks(patientUuid, orderReference);

  if (!data?.entry || data.entry.length === 0) {
    return [];
  }

  return data.entry.map((entry) =>
    mapTaskToViewModel(entry.resource as Task, t),
  );
};

const identifyLeafTasks = (allTasks: TaskViewModel[]): Set<string> => {
  const allTaskIds = new Set(allTasks.map((t) => t.id));
  const parentTaskIds = new Set<string>();

  // Collect all task IDs that appear in partOf arrays (these are parents)
  allTasks.forEach((task) => {
    task.partOf?.forEach((parentRef) => {
      const parentId = parentRef.split('/').pop();
      if (parentId && allTaskIds.has(parentId)) {
        parentTaskIds.add(parentId);
      }
    });
  });

  // Leaf tasks are those NOT in the parent set
  const leafTaskIds = new Set<string>();
  allTasks.forEach((task) => {
    if (!parentTaskIds.has(task.id)) {
      leafTaskIds.add(task.id);
    }
  });

  return leafTaskIds;
};

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

const getTaskStatusKey = (status: string): string => {
  if (!status) return 'TASK_STATUS_UNKNOWN';
  return `TASK_STATUS_${camelToScreamingSnakeCase(status)}`;
};

const TaskList: React.FC<TaskListProps> = ({
  config,
  episodeOfCareUuids,
  encounterUuids,
  orderReference,
  showEmptyStateMessage = true,
}) => {
  const { t } = useTranslation();
  const patientUuid = usePatientUUID();

  const taskListConfig = config as TaskListConfig | undefined;
  const showOnlyLeafTasks = taskListConfig?.showOnlyLeafTasks ?? false;
  const taskTypes = taskListConfig?.taskTypes;

  const emptyEncounterFilter = shouldEnableEncounterFilter(
    episodeOfCareUuids,
    encounterUuids,
  );

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['tasks', patientUuid, orderReference, encounterUuids],
    queryFn: () => fetchAndTransformTasks(t, patientUuid ?? '', orderReference),
    enabled: !!patientUuid && !emptyEncounterFilter,
  });

  useSubscribeConsultationSaved(
    (payload) => {
      if (
        payload.patientUUID === patientUuid &&
        payload.updatedResources.observationFormsWithBasedOn
      ) {
        refetch();
      }
    },
    [patientUuid, refetch],
  );

  const filteredTasks = useMemo(() => {
    if (!data || data.length === 0) {
      return [];
    }

    let tasks = data;

    if (taskTypes && taskTypes.length > 0) {
      tasks = tasks.filter((task) => taskTypes.includes(task.code));
    }

    if (showOnlyLeafTasks) {
      const leafTaskIds = identifyLeafTasks(tasks);
      tasks = tasks.filter((task) => leafTaskIds.has(task.id));
    }

    return tasks;
  }, [data, taskTypes, showOnlyLeafTasks]);

  const columns = useMemo(() => {
    const baseColumns = [
      { key: 'name', header: t('TASK_NAME') },
      { key: 'completedBy', header: t('TASK_COMPLETED_BY') },
      { key: 'completedOn', header: t('TASK_COMPLETED_ON') },
      { key: 'status', header: t('TASK_STATUS') },
    ];

    const hasActions = taskListConfig?.actionConfig?.some(
      (config) => config.actions && config.actions.length > 0,
    );

    return hasActions
      ? [...baseColumns, { key: 'actions', header: t('TASK_ACTIONS') }]
      : baseColumns;
  }, [t, taskListConfig?.actionConfig]);

  const renderCell = useCallback(
    (task: TaskViewModel, columnKey: string) => {
      switch (columnKey) {
        case 'name':
          return task.name;
        case 'completedBy':
          return task.completedBy ?? '-';
        case 'completedOn':
          return task.completedOn ?? '-';
        case 'status':
          return (
            <StatusTag
              label={t(getTaskStatusKey(task.status))}
              dotClassName={getStatusDotClassName(task.status)}
              testId={`task-status-${task.id}`}
            />
          );
        case 'actions':
          return (
            taskListConfig?.actionConfig && (
              <TaskActions
                task={task}
                actionConfig={taskListConfig?.actionConfig}
                episodeOfCareUuids={episodeOfCareUuids}
              />
            )
          );
        default:
          return null;
      }
    },
    [t, taskListConfig?.actionConfig, episodeOfCareUuids],
  );

  if (emptyEncounterFilter) {
    return (
      <div className={styles.emptyState} data-testid="task-list-empty">
        {t('TASKS_NOT_FOUND')}
      </div>
    );
  }

  if (!showEmptyStateMessage && filteredTasks.length === 0 && !isLoading) {
    return null;
  }

  return (
    <div data-testid="task-list">
      <DataTable
        columns={columns}
        rows={filteredTasks}
        ariaLabel={t('FORM_FILLING_TASKS')}
        dataTestId="tasks-table"
        emptyStateMessage={
          filteredTasks.length === 0 ? t('TASKS_NOT_FOUND') : null
        }
        errorStateMessage={error ? t('TASKS_LOADING_ERROR') : null}
        loading={isLoading}
        renderCell={renderCell}
        className={styles.tasksTableBody}
      />
    </div>
  );
};

export default TaskList;
