export interface DashboardSection {
  name: string;
  translationKey?: string;
  icon: string;
  controls: [];
}

export interface DashboardConfig {
  sections: DashboardSection[];
}
