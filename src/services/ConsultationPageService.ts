import { Dashboard } from '@types/config';
import { DashboardConfig } from '@types/dashboardConfig';
import { SidebarItemProps } from '@components/common/sidebar/Sidebar';

/**
 * Gets the default dashboard from an array of dashboards
 * @param dashboards Array of dashboard configurations
 * @returns The default dashboard or null if none is found
 */
export const getDefaultDashboard = (
  dashboards: Dashboard[],
): Dashboard | null => {
  const defaultDashboard = dashboards.find(
    (dashboard) => dashboard.default === true,
  );
  if (defaultDashboard) {
    return defaultDashboard;
  }
  return null;
};

/**
 * Converts dashboard sections to sidebar items
 * @param dashboardConfig The dashboard configuration containing sections
 * @returns Array of sidebar items
 */
export const getSidebarItems = (
  dashboardConfig: DashboardConfig,
): SidebarItemProps[] => {
  return dashboardConfig.sections.map((section) => ({
    id: section.name,
    icon: section.icon,
    // TODO: add translation
    label: section.name,
    active: false,
    action: () => {},
  }));
};
