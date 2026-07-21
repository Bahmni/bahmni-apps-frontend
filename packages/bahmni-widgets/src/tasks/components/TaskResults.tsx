import { Link } from '@bahmni/design-system';
import { hasPrivilege, useTranslation } from '@bahmni/services';
import React, { useCallback, useMemo, useState } from 'react';
import { usePatientUUID } from '../../hooks/usePatientUUID';
import { useUserPrivilege } from '../../userPrivileges/useUserPrivilege';
import { TaskViewType } from '../constants';
import type { TaskConfig, TaskView, TaskViewModel } from '../models';
import { isViewVisible } from '../utils';
import ViewFormModal from './ViewFormModal/ViewFormModal';

interface TaskResultsProps {
  task: TaskViewModel;
  taskConfig: TaskConfig[];
}

const TaskResults: React.FC<TaskResultsProps> = ({ task, taskConfig }) => {
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
};

export default TaskResults;
