import { HeaderSideNavItem } from '@bahmni/design-system';
import { hasRequiredPrivileges, type UserPrivilege } from '@bahmni/services';
import { Dashboard } from '../providers/clinicalConfig/models';
import {
  DashboardConfig,
  DashboardSectionConfig,
  ControlConfig,
} from './models';

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

export const filterControlsByPrivileges = (
  userPrivileges: UserPrivilege[] | null | undefined,
  controls: ControlConfig[],
): ControlConfig[] => {
  return controls.filter((control) =>
    hasRequiredPrivileges(userPrivileges, control.requiredPrivileges),
  );
};

export const filterSectionsByPrivileges = (
  userPrivileges: UserPrivilege[] | null | undefined,
  sections: DashboardSectionConfig[],
): DashboardSectionConfig[] => {
  // TODO (AC #4): Currently sections with no visible controls are removed entirely (binary show/hide).
  // Future enhancement should support read-only mode for view-without-edit privileges.
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
