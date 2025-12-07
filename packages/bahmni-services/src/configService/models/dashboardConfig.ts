export interface DashboardSectionConfig {
  id: string;
  name: string;
  translationKey?: string;
  icon: string;
  controls: ControlConfig[];
}

export interface DashboardConfig {
  sections: DashboardSectionConfig[];
}

export interface ControlConfig {
  type: string;
  config: unknown;
}
