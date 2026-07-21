import React from 'react';
import { TaskViewType } from '../constants';
import type { TaskView, TaskViewModel } from '../models';
import ViewFormData from './ViewFormData/ViewFormData';

export const handleTaskView = (
  view: TaskView,
  task: TaskViewModel,
  patientUuid: string,
  onClose: () => void,
): React.ReactNode => {
  if (view.type === TaskViewType.VIEW_FORM) {
    return (
      <ViewFormData
        open
        task={task}
        view={view}
        patientUuid={patientUuid}
        onClose={onClose}
      />
    );
  }
  return null;
};
