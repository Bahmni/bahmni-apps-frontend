export interface DashboardSectionConfig {
  id?: string;
  name: string;
  translationKey?: string;
  icon: string;
  controls: Array<ControlConfig>;
}

export interface ControlConfig {
  type: string;
  name: string;
  translationKey?: string;
  conceptNames?: string[];
  requiredPrivileges?: string[];
  config?: Record<string, unknown>;
}

export interface DashboardConfig {
  sections: Array<DashboardSectionConfig>;
}
