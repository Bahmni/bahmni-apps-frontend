export interface DashboardSectionConfig {
  id: string;
  name: string;
  translationKey?: string;
  icon: string;
  controls: [];
}

export interface DashboardConfig {
  sections: DashboardSectionConfig[];
}
