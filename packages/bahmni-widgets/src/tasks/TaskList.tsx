import {
  shouldEnableEncounterFilter,
  useTranslation,
  getTasks,
  formatDateTime,
} from '@bahmni/services';
import { useQuery } from '@tanstack/react-query';
import { Task } from 'fhir/r4';
import React, { useMemo } from 'react';
import { usePatientUUID } from '@bahmni/widgets';
import { WidgetProps } from '../registry';
import { FormFillingTaskHandler } from './handlers/FormFillingTaskHandler';
import { TaskViewModel, TaskHandlerConfig } from './handlers/models';
import styles from './TaskList.module.scss';

interface TaskListProps extends WidgetProps {
  orderReference?: string;
}

const mapTaskToViewModel = (task: Task, t): TaskViewModel => {
  return {
    id: task.id ?? '',
    name: task.code?.text ?? task.code?.coding?.[0]?.display ?? '',
    code: task.code?.coding?.[0]?.code ?? task.code?.text ?? '',
    status: task.status,
    completedBy: task.owner?.display,
    completedOn: task.executionPeriod?.end
      ? formatDateTime(task.executionPeriod.end, t, true).formattedResult
      : '-',
  };
};

const fetchAndTransformTasks = async (
  t,
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

const getTaskHandler = (handlerType: string) => {
  if (handlerType === 'formFilling') {
    return FormFillingTaskHandler;
  }
  return null;
  // Future handlers can be added here:
};

const TaskList: React.FC<TaskListProps> = ({
  config,
  episodeOfCareUuids,
  encounterUuids,
  orderReference,
}) => {
  const { t } = useTranslation();
  const patientUuid = usePatientUUID();
  const taskHandlerConfig = config?.taskHandlerConfig as
    | TaskHandlerConfig[]
    | undefined;

  const emptyEncounterFilter = shouldEnableEncounterFilter(
    episodeOfCareUuids,
    encounterUuids,
  );

  const { data, isLoading, error } = useQuery({
    queryKey: ['tasks', patientUuid, orderReference, encounterUuids],
    queryFn: () => fetchAndTransformTasks(t, patientUuid, orderReference),
    enabled: !!patientUuid && !emptyEncounterFilter,
  });

  // Process and group tasks by handler type
  const tasksByHandler = useMemo(() => {
    if (!data || data.length === 0) {
      return null;
    }

    const tasksMap = new Map<
      string,
      { config: TaskHandlerConfig; tasks: TaskViewModel[] }
    >();

    // Group tasks by their handler configuration
    if (taskHandlerConfig && taskHandlerConfig.length > 0) {
      data.forEach((task) => {
        const handlerConf = taskHandlerConfig.find(
          (conf) => conf.taskCode === task.code,
        );

        if (handlerConf) {
          const key = `${handlerConf.handlerType}`;
          if (!tasksMap.has(key)) {
            tasksMap.set(key, {
              config: handlerConf,
              tasks: [],
            });
          }
          tasksMap.get(key)?.tasks.push(task);
        }
      });
    }

    return tasksMap;
  }, [data, taskHandlerConfig]);

  if (emptyEncounterFilter) {
    return (
      <div className={styles.emptyState} data-testid="task-list-empty">
        {t('TASKS_NOT_FOUND')}
      </div>
    );
  }

  if (!taskHandlerConfig || taskHandlerConfig.length === 0) {
    return (
      <div className={styles.emptyState} data-testid="task-list-error">
        {t('TASKS_HANDLER_NOT_CONFIGURED')}
      </div>
    );
  }

  return (
    <div data-testid="task-list">
      {tasksByHandler &&
        Array.from(tasksByHandler.entries()).map(([key, { config, tasks }]) => {
          const Handler = getTaskHandler(config.handlerType);
          if (Handler) {
            return (
              <div key={key}>
                <Handler
                  tasks={tasks}
                  isLoading={isLoading}
                  error={error ?? null}
                />
              </div>
            );
          }
        })}
    </div>
  );
};

export default TaskList;
