import { HeaderSideNavItem } from '@bahmni-frontend/bahmni-design-system';
import { Dashboard } from '@bahmni-frontend/bahmni-services';
import { DashboardConfig } from '@bahmni-frontend/bahmni-services';

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
): HeaderSideNavItem[] => {
  //const { t } = useTranslation();
  return dashboardConfig.sections.map((section) => ({
    id: section.id,
    icon: section.icon,
    label: section.translationKey ?? section.name,
  }));
};
