import type { Task } from 'fhir/r4';

export interface TaskViewModel {
  id: string;
  name: string;
  code: string;
  status: string;
  completedBy?: string;
  completedOn?: string;
  partOf: string[];
  fhirResource: Task;
}

export interface TaskAction {
  label: string;
  type: string;
  icon: string;
  requiredPrivileges: string[];
  handlerConfig: Record<string, unknown>;
}

export interface TaskView {
  label: string;
  type: string;
  requiredPrivileges: string[];
  handlerConfig: {
    formInputCode: string;
  };
}

export interface TaskConfig {
  taskCode: string;
  actions?: TaskAction[];
  views?: TaskView[];
}

export interface TaskListConfig {
  showOnlyLeafTasks?: boolean;
  taskTypes?: string[];
  taskConfig?: TaskConfig[];
}
