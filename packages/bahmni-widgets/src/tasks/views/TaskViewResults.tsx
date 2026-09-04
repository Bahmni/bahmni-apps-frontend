import { Link, OverflowMenu, OverflowMenuItem } from '@bahmni/design-system';
import {
  fetchObservationForms,
  hasPrivilege,
  type ObservationForm,
  useTranslation,
} from '@bahmni/services';
import { useQuery } from '@tanstack/react-query';
import React, { useMemo, useState } from 'react';
import { usePatientUUID } from '../../hooks/usePatientUUID';
import { useUserPrivilege } from '../../userPrivileges/useUserPrivilege';
import type { TaskConfig, TaskView, TaskViewModel } from '../models';
import { hasViewFormConfig, isViewFormDataVisible } from '../utils';
import { handleTaskView } from './viewHandlers';

interface TaskViewResultsProps {
  task: TaskViewModel;
  taskConfig: TaskConfig[];
}

const TaskViewResults: React.FC<TaskViewResultsProps> = ({
  task,
  taskConfig,
}) => {
  const { userPrivileges } = useUserPrivilege();
  const { t } = useTranslation();
  const patientUuid = usePatientUUID();
  const [selectedView, setSelectedView] = useState<TaskView | null>(null);

  const shouldFetchForms = hasViewFormConfig(taskConfig, task.code);

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

  const permittedViews = useMemo(() => {
    if (!matchingConfig?.views || isFormsLoading) return [];

    return matchingConfig.views.filter((view) => {
      if (!hasPrivilege(userPrivileges, view.requiredPrivileges)) {
        return false;
      }

      return isViewFormDataVisible(view, task, allForms, userPrivileges);
    });
  }, [matchingConfig, userPrivileges, allForms, isFormsLoading, task]);

  if (permittedViews.length === 0) {
    return <>-</>;
  }

  if (permittedViews.length === 1) {
    const view = permittedViews[0];

    return (
      <>
        <Link
          onClick={() => setSelectedView(view)}
          testId={`task-view-${view.type}-${task.id}`}
        >
          {t(view.label)}
        </Link>
        {selectedView &&
          handleTaskView(selectedView, task, patientUuid ?? '', () =>
            setSelectedView(null),
          )}
      </>
    );
  }

  return (
    <>
      <OverflowMenu
        id={`task-views-menu-${task.id}`}
        testId={`task-views-menu-${task.id}`}
        aria-label={t('TASK_VIEWS_MENU_LABEL')}
        flipped
        size="sm"
      >
        {permittedViews.map((view) => (
          <OverflowMenuItem
            id={`task-view-${view.type}-${task.id}`}
            testId={`task-view-${view.type}-${task.id}`}
            key={view.type}
            itemText={t(view.label)}
            isDelete={false}
            onClick={() => setSelectedView(view)}
          />
        ))}
      </OverflowMenu>
      {selectedView &&
        handleTaskView(selectedView, task, patientUuid ?? '', () =>
          setSelectedView(null),
        )}
    </>
  );
};

export default TaskViewResults;
