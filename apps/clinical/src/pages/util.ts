import { HeaderSideNavItem } from '@bahmni/design-system';
import { useHasPrivilege } from '@bahmni/widgets';
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
  controls: ControlConfig[],
): ControlConfig[] => {
  return controls.filter((control) =>
    useHasPrivilege(control.requiredPrivileges),
  );
};

export const filterSectionsByPrivileges = (
  sections: DashboardSectionConfig[],
): DashboardSectionConfig[] => {
  return sections
    .map((section) => ({
      ...section,
      controls: filterControlsByPrivileges(section.controls),
    }))
    .filter((section) => section.controls.length > 0);
};

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
