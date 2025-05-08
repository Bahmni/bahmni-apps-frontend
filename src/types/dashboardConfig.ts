export interface DashboardSectionConfig {
  name: string;
  translationKey?: string;
  icon: string;
  controls: [];
}

export interface DashboardConfig {
  sections: DashboardSectionConfig[];
}
