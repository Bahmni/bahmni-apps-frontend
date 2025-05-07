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
  // Return null if the array is empty
  if (dashboards.length === 0) {
    return null;
  }

  // Find dashboard with default: true
  const defaultDashboard = dashboards.find(
    (dashboard) => dashboard.default === true,
  );

  // Return the default dashboard if found
  if (defaultDashboard) {
    return defaultDashboard;
  }

  // Return the first dashboard if no default is specified
  return dashboards[0];
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
    label: section.translationKey || section.name,
    active: false,
    action: () => {},
  }));
};
