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
import {
  ProgramDetails,
  useNotification,
  useUserPrivilege,
} from '@bahmni/widgets';
import { useQuery } from '@tanstack/react-query';
import React, { Suspense, useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import ConsultationPad from '../components/consultationPad/ConsultationPad';
import DashboardContainer from '../components/dashboardContainer/DashboardContainer';
import PatientHeader from '../components/patientHeader/PatientHeader';
import { BAHMNI_CLINICAL_PATH } from '../constants/app';
import { ClinicalAppProvider } from '../providers/ClinicalAppProvider';
import { useClinicalConfig } from '../providers/clinicalConfig';
import { useObservationFormsStore } from '../stores/observationFormsStore';
import {
  DASHBOARD_CONFIG_URL,
  CURRENT_DASHBOARD_SEARCH_PARAMS_KEY,
  EPISODE_UUID_SEARCH_PARAMS_KEY,
  PROGRAM_UUID_SEARCH_PARAMS_KEY,
} from './constant';
import { DashboardConfig } from './models';
import dashboardConfigSchema from './schema.json';
import styles from './styles/ConsultationPage.module.scss';
import { getDefaultDashboard, getSidebarItems } from './util';

const addSectionIds = (config: DashboardConfig): DashboardConfig => {
  if (!config?.sections?.length) return config;
  return {
    ...config,
    sections: config.sections.map((section) =>
      section.id ? section : { ...section, id: generateId() },
    ),
  };
};

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
  const viewingForm = useObservationFormsStore((state) => state.viewingForm);

  const episodeUuids = useMemo(() => {
    const episodeUuid = searchParams.get(EPISODE_UUID_SEARCH_PARAMS_KEY);
    if (!episodeUuid) return [];
    return episodeUuid
      .split(',')
      .map((id) => id.trim())
      .filter(Boolean);
  }, [searchParams]);

  const currentDashboardParam = searchParams.get(
    CURRENT_DASHBOARD_SEARCH_PARAMS_KEY,
  );

  const currentDashboard = useMemo(() => {
    if (!clinicalConfig) return null;

    if (!currentDashboardParam) {
      return getDefaultDashboard(clinicalConfig.dashboards || []);
    }

    return clinicalConfig.dashboards?.find(
      (dashboard) => dashboard.name === currentDashboardParam,
    );
  }, [clinicalConfig, currentDashboardParam]);

  const dashboardURL = currentDashboard?.url ?? null;

  const {
    data: dashboardConfig,
    isLoading: isDashboardConfigLoading,
    error: dashboardConfigError,
  } = useQuery({
    queryKey: ['dashboardConfig', dashboardURL],
    queryFn: () =>
      getConfig<DashboardConfig>(
        DASHBOARD_CONFIG_URL(dashboardURL),
        dashboardConfigSchema,
      ),
    select: addSectionIds,
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
    const errorMessage = currentDashboardParam
      ? t('ERROR_DASHBOARD_NOT_CONFIGURED', {
          dashboardName: currentDashboardParam,
        })
      : t('ERROR_NO_DEFAULT_DASHBOARD');

    addNotification({
      title: t('ERROR_DEFAULT_TITLE'),
      message: errorMessage,
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

  const renderContextInformation = () => {
    const programUUID = searchParams.get(PROGRAM_UUID_SEARCH_PARAMS_KEY);
    if (programUUID && clinicalConfig.contextInformation?.program)
      return (
        <ProgramDetails
          programUUID={programUUID}
          config={{
            fields: clinicalConfig.contextInformation?.program?.fields ?? [],
          }}
        />
      );
    return null;
  };

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
            <div
              id="section-sticky-header"
              data-testid="section-sticky-header-test-id"
              aria-label="section-sticky-header-aria-label"
              className={styles.stickySection}
            >
              <PatientHeader
                isActionAreaVisible={isActionAreaVisible}
                setIsActionAreaVisible={setIsActionAreaVisible}
              />
              {renderContextInformation()}
            </div>
            <DashboardContainer
              sections={dashboardConfig!.sections}
              activeItemId={activeItemId}
            />
          </Suspense>
        }
        isActionAreaVisible={isActionAreaVisible}
        layoutVariant={viewingForm ? 'extended' : 'default'}
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
