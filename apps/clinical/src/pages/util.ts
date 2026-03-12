import { HeaderSideNavItem } from '@bahmni/design-system';
import { UserPrivilege } from '@bahmni/services';
import { Dashboard } from '../providers/clinicalConfig/models';
import {
  DashboardConfig,
  DashboardSectionConfig,
  ControlConfig,
} from './models';

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
 * Checks if user has all required privileges for a control
 * @param userPrivileges Array of user privilege names
 * @param requiredPrivileges Array of required privilege names
 * @returns true if user has all required privileges or if no privileges are required
 */
export const hasRequiredPrivileges = (
  userPrivileges: UserPrivilege[] | null | undefined,
  requiredPrivileges: string[] | undefined,
): boolean => {
  if (!requiredPrivileges || requiredPrivileges.length === 0) {
    return true;
  }
  if (!userPrivileges) {
    return false;
  }
  const privilegeNames = userPrivileges.map((p) => p.name);
  return requiredPrivileges.every((privilege) =>
    privilegeNames.includes(privilege),
  );
};

/**
 * Filters controls based on user privileges
 * @param userPrivileges Array of user privileges
 * @param controls Array of controls to filter
 * @returns Filtered array of controls that user has access to
 */
export const filterControlsByPrivileges = (
  userPrivileges: UserPrivilege[] | null | undefined,
  controls: ControlConfig[],
): ControlConfig[] => {
  return controls.filter((control) =>
    hasRequiredPrivileges(userPrivileges, control.requiredPrivileges),
  );
};

/**
 * Filters sections based on visible controls after privilege filtering
 * @param userPrivileges Array of user privileges
 * @param sections Array of sections to filter
 * @returns Filtered array of sections that have at least one visible control
 */
export const filterSectionsByPrivileges = (
  userPrivileges: UserPrivilege[] | null | undefined,
  sections: DashboardSectionConfig[],
): DashboardSectionConfig[] => {
  return sections
    .map((section) => ({
      ...section,
      controls: filterControlsByPrivileges(userPrivileges, section.controls),
    }))
    .filter((section) => section.controls.length > 0);
};

/**
 * Converts dashboard sections to sidebar items, filtering by user privileges
 * @param dashboardConfig The dashboard configuration containing sections
 * @param t Translation function
 * @param userPrivileges User privileges for filtering
 * @returns Array of sidebar items that user has access to
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
