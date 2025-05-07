export interface DashboardSection {
  name: string;
  translationKey?: string;
  icon: string;
  controls: [];
}

export interface DashboardConfig {
  sections: DashboardSection[];
}

export interface DashboardConfigContextType {
  dashboardConfig: DashboardConfig | null;
  isLoading: boolean;
  error: Error | null;
}
