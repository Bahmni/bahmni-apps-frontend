import { HeaderSideNavItem } from '@bahmni/design-system';
import { Dashboard } from '../providers/clinicalConfig/models';
import { DashboardConfig } from './models';

/**
 * Gets the default dashboard from an array of dashboards
 * @param dashboards Array of dashboard configurations
 * @returns The default dashboard or null if none is found
 */
export const getDefaultDashboard = (
  dashboards: Dashboard[],
): Dashboard | null => {
  if (dashboards.length === 0) {
    return null;
  }

  const defaultDashboard = dashboards.find(
    (dashboard) => dashboard.default === true,
  );

  if (defaultDashboard) {
    return defaultDashboard;
  }

  return dashboards[0];
};

/**
 * Converts dashboard sections to sidebar items
 * @param dashboardConfig The dashboard configuration containing sections
 * @returns Array of sidebar items
 */
export const getSidebarItems = (
  dashboardConfig: DashboardConfig,
  t: (key: string) => string,
): HeaderSideNavItem[] => {
  return dashboardConfig.sections.map((section) => ({
    id: section.id!,
    icon: section.icon,
    label: t(section.translationKey ?? section.name),
  }));
};
