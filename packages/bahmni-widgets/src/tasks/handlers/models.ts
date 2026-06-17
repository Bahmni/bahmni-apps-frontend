export interface TaskViewModel {
  id: string;
  name: string;
  status: string;
  completedBy?: string;
  completedOn?: string;
  code?: string;
}

export interface TaskHandlerConfig {
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
