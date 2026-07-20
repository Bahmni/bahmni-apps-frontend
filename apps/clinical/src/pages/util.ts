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

// getFormattedError (shared errorHandling) classifies a failed patient-resource
// fetch as this translation key, regardless of the exact HTTP status the backend
// returned for the bad UUID. We key off it to surface a single "patient not
// found" message and hold back the patient-scoped widgets.
export const PATIENT_NOT_FOUND_ERROR_KEY = 'ERROR_PATIENT_NOT_FOUND';

export const isPatientNotFoundError = (error: unknown): boolean => {
  const message =
    typeof error === 'string'
      ? error
      : error instanceof Error
        ? error.message
        : '';
  return message === PATIENT_NOT_FOUND_ERROR_KEY;
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
