import {
  Loading,
  Icon,
  Header,
  ICON_SIZE,
  useSidebarNavigation,
  ActionAreaLayout,
} from '@bahmni/design-system';
import {
  useTranslation,
  BAHMNI_HOME_PATH,
  getConfig,
  generateId,
} from '@bahmni/services';
import { useNotification, useUserPrivilege } from '@bahmni/widgets';
import { useQuery } from '@tanstack/react-query';
import React, { Suspense, useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import ConsultationPad from '../components/consultationPad/ConsultationPad';
import DashboardContainer from '../components/dashboardContainer/DashboardContainer';
import PatientHeader from '../components/patientHeader/PatientHeader';
import { BAHMNI_CLINICAL_PATH } from '../constants/app';
import { ClinicalAppProvider } from '../providers/ClinicalAppProvider';
import { useClinicalConfig } from '../providers/clinicConfig';
import { DASHBOARD_CONFIG_URL } from './constant';
import { DashboardConfig } from './models';
import dashboardConfigSchema from './schema.json';
import { getDefaultDashboard, getSidebarItems } from './util';

const breadcrumbItems = [
  { id: 'home', label: 'Home', href: BAHMNI_HOME_PATH },
  {
    id: 'clinical',
    label: 'Clinical',
    href: BAHMNI_CLINICAL_PATH,
  },
  { id: 'current', label: 'Current Patient', isCurrentPage: true },
];

const globalActions = [
  {
    id: 'search',
    label: 'Search',
    renderIcon: <Icon id="search-icon" name="fa-search" size={ICON_SIZE.LG} />,
    onClick: () => {},
  },
  {
    id: 'notifications',
    label: 'Notifications',
    renderIcon: (
      <Icon id="notifications-icon" name="fa-bell" size={ICON_SIZE.LG} />
    ),
    onClick: () => {},
  },
  {
    id: 'user',
    label: 'User',
    renderIcon: <Icon id="user-icon" name="fa-user" size={ICON_SIZE.LG} />,
    onClick: () => {},
  },
];

/**
 * ConsultationPage
 *
 * Main clinical consultation interface that displays patient information and clinical dashboard.
 * Integrates clinical layout with patient details, sidebar navigation, and dashboard content.
 * Dynamically loads dashboard configuration and handles navigation between different sections.
 *
 * @returns React component with clinical consultation interface
 */
const ConsultationPage: React.FC = () => {
  const { t } = useTranslation();
  const { clinicalConfig, isLoading: clinicalConfigLoading } =
    useClinicalConfig();
  const { userPrivileges } = useUserPrivilege();
  const { addNotification } = useNotification();
  const [isActionAreaVisible, setIsActionAreaVisible] = useState(false);
  const [searchParams] = useSearchParams();

  const episodeUuids = useMemo(() => {
    const episodeUuid = searchParams.get('episodeUuid');
    if (!episodeUuid) return [];
    return episodeUuid
      .split(',')
      .map((id) => id.trim())
      .filter(Boolean);
  }, [searchParams]);

  const currentDashboard = useMemo(() => {
    if (!clinicalConfig) return null;
    return getDefaultDashboard(clinicalConfig.dashboards ?? []);
  }, [clinicalConfig]);

  const dashboardURL = currentDashboard?.url ?? null;

  const {
    data: dashboardConfig,
    isLoading: isDashboardConfigLoading,
    error: dashboardConfigError,
  } = useQuery({
    queryKey: ['dashboardConfig', dashboardURL],
    queryFn: () =>
      getConfig<DashboardConfig>(
        DASHBOARD_CONFIG_URL(dashboardURL!),
        dashboardConfigSchema,
      ),
    select: (config) => {
      if (!config?.sections?.length) return config;
      return {
        ...config,
        sections: config.sections.map((section) =>
          section.id ? section : { ...section, id: generateId() },
        ),
      };
    },
    enabled: !!dashboardURL,
  });

  useEffect(() => {
    if (dashboardConfigError) {
      addNotification({
        title: t('ERROR_LOADING_DASHBOARD_CONFIG'),
        message: dashboardConfigError.message,
        type: 'error',
      });
    }
  }, [dashboardConfigError]);

  const sidebarItems = useMemo(() => {
    if (!dashboardConfig) return [];
    return getSidebarItems(dashboardConfig, t);
  }, [dashboardConfig, t]);

  const { activeItemId, handleItemClick } = useSidebarNavigation(sidebarItems);

  if (clinicalConfigLoading) {
    return (
      <Loading
        id="loading-clinical-config"
        description={t('LOADING_CLINICAL_CONFIG')}
        role="status"
      />
    );
  }
  if (!userPrivileges) {
    return <Loading description={t('LOADING_USER_PRIVILEGES')} role="status" />;
  }
  if (!currentDashboard) {
    addNotification({
      title: t('ERROR_DEFAULT_TITLE'),
      message: t('ERROR_NO_DEFAULT_DASHBOARD'),
      type: 'error',
    });
    return (
      <div
        id="error-no-default-dashboard"
        data-testid="error-no-default-dashboard-test-id"
      />
    );
  }

  if (isDashboardConfigLoading) {
    return (
      <Loading
        id="loading-dashboard-config"
        data-testid="loading-dashboard-config-test-id"
        description={t('LOADING_DASHBOARD_CONFIG')}
        role="status"
      />
    );
  }

  return (
    <ClinicalAppProvider episodeUuids={episodeUuids}>
      <ActionAreaLayout
        headerWSideNav={
          <Header
            breadcrumbItems={breadcrumbItems}
            globalActions={globalActions}
            sideNavItems={sidebarItems}
            activeSideNavItemId={activeItemId}
            onSideNavItemClick={handleItemClick}
            isRail={isActionAreaVisible}
          />
        }
        patientHeader={
          <PatientHeader
            isActionAreaVisible={isActionAreaVisible}
            setIsActionAreaVisible={setIsActionAreaVisible}
          />
        }
        mainDisplay={
          <Suspense
            data-testid="suspense-dashboard-container-test-id"
            fallback={
              <Loading
                id="loading-dashboard-content"
                data-testid="loading-dashboard-content-test-id"
                description={t('LOADING_DASHBOARD_CONTENT')}
                role="status"
              />
            }
          >
            <DashboardContainer
              sections={dashboardConfig!.sections}
              activeItemId={activeItemId}
            />
          </Suspense>
        }
        isActionAreaVisible={isActionAreaVisible}
        actionArea={
          <ConsultationPad
            onClose={() => setIsActionAreaVisible((prev) => !prev)}
          />
        }
      />
    </ClinicalAppProvider>
  );
};

export default ConsultationPage;
