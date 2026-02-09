import {
  Loading,
  Icon,
  Header,
  ICON_SIZE,
  useSidebarNavigation,
  ActionAreaLayout,
} from '@bahmni/design-system';
import { useTranslation, BAHMNI_HOME_PATH } from '@bahmni/services';
import {
  ProgramDetails,
  useNotification,
  useUserPrivilege,
} from '@bahmni/widgets';
import React, { Suspense, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import ConsultationPad from '../components/consultationPad/ConsultationPad';
import DashboardContainer from '../components/dashboardContainer/DashboardContainer';
import PatientHeader from '../components/patientHeader/PatientHeader';
import { BAHMNI_CLINICAL_PATH } from '../constants/app';
import { useClinicalConfig } from '../hooks/useClinicalConfig';
import { useDashboardConfig } from '../hooks/useDashboardConfig';
import { ClinicalAppProvider } from '../providers/ClinicalAppProvider';
import {
  getDefaultDashboard,
  getSidebarItems,
} from '../services/consultationPageService';
import { useObservationFormsStore } from '../stores/observationFormsStore';
import {
  CURRENT_DASHBOARD_SEARCH_PARAMS_KEY,
  EPISODE_UUID_SEARCH_PARAMS_KEY,
  PROGRAM_UUID_SEARCH_PARAMS_KEY,
} from './constant';
import styles from './styles/ConsultationPage.module.scss';

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
  const { clinicalConfig } = useClinicalConfig();
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

  const dashboardUrl = currentDashboard?.url ?? null;
  const { dashboardConfig } = useDashboardConfig(dashboardUrl);

  const sidebarItems = useMemo(() => {
    if (!dashboardConfig) return [];
    return getSidebarItems(dashboardConfig, t);
  }, [dashboardConfig, t]);

  const { activeItemId, handleItemClick } = useSidebarNavigation(sidebarItems);

  if (!clinicalConfig) {
    return <Loading description={t('LOADING_CLINICAL_CONFIG')} role="status" />;
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
    return <Loading description={t('ERROR_LOADING_DASHBOARD')} role="alert" />;
  }

  if (!dashboardConfig) {
    return (
      <Loading description={t('LOADING_DASHBOARD_CONFIG')} role="status" />
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
            fallback={
              <Loading
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
              sections={dashboardConfig.sections}
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
