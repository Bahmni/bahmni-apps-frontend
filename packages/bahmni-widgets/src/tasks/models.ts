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

export interface TaskActionConfig {
  taskCode: string;
  actions: TaskAction[];
}

export interface TaskListConfig {
  showOnlyLeafTasks?: boolean;
  taskTypes?: string[];
  actionConfig?: TaskActionConfig[];
}
