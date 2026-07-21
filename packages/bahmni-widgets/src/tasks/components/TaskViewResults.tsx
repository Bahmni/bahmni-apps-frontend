import { Link, OverflowMenu, OverflowMenuItem } from '@bahmni/design-system';
import { hasPrivilege, useTranslation } from '@bahmni/services';
import React, { useCallback, useMemo, useState } from 'react';
import { usePatientUUID } from '../../hooks/usePatientUUID';
import { useUserPrivilege } from '../../userPrivileges/useUserPrivilege';
import { TaskViewType } from '../constants';
import type { TaskConfig, TaskView, TaskViewModel } from '../models';
import { isViewVisible } from '../utils';
import ViewFormModal from './ViewFormModal/ViewFormModal';

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

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedView, setSelectedView] = useState<TaskView | null>(null);

  const matchingConfig = useMemo(() => {
    if (!taskConfig) return null;
    return taskConfig.find((config) => config.taskCode === task.code);
  }, [taskConfig, task.code]);

  const permittedViews = useMemo(() => {
    if (!matchingConfig?.views) return [];

    return matchingConfig.views.filter((view) => {
      if (!hasPrivilege(userPrivileges, view.requiredPrivileges)) {
        return false;
      }

      return isViewVisible(view, task, userPrivileges);
    });
  }, [matchingConfig, userPrivileges, task]);

  const handleViewClick = useCallback((view: TaskView) => {
    if (view.type === TaskViewType.VIEW_FORM) {
      setSelectedView(view);
      setIsModalOpen(true);
    }
  }, []);

  const handleCloseModal = useCallback(() => {
    setIsModalOpen(false);
    setSelectedView(null);
  }, []);

  const renderModal = () => {
    if (!isModalOpen || !selectedView) return null;

    if (selectedView.type === TaskViewType.VIEW_FORM) {
      return (
        <ViewFormModal
          open={isModalOpen}
          task={task}
          view={selectedView}
          patientUuid={patientUuid ?? ''}
          onClose={handleCloseModal}
        />
      );
    }

    return null;
  };

  if (permittedViews.length === 0) {
    return <>-</>;
  }

  if (permittedViews.length === 1) {
    const view = permittedViews[0];

    return (
      <>
        <Link
          onClick={() => handleViewClick(view)}
          testId={`task-view-${view.type}-${task.id}`}
        >
          {t(view.label)}
        </Link>
        {renderModal()}
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
            onClick={() => handleViewClick(view)}
          />
        ))}
      </OverflowMenu>
      {renderModal()}
    </>
  );
};

export default TaskViewResults;
