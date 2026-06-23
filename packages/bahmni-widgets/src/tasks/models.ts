export interface TaskViewModel {
  id: string;
  name: string;
  code: string;
  status: string;
  completedBy?: string;
  completedOn?: string;
  partOf?: string[];
}

export interface ActionHandlerConfig {
  taskCode: string;
  handlerType: string;
  handlerConfig?: {
    actions?: Array<{
      label: string;
      type: string;
      encounterType?: string;
      requiredPrivileges?: string[];
      icon?: string;
    }>;
  };
}

export interface TaskListConfig {
  showOnlyLeafTasks?: boolean;
  taskTypes?: string[];
  actionHandlerConfig?: ActionHandlerConfig[];
}
