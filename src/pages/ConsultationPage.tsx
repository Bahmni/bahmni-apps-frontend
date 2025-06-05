import React, { Suspense, useMemo, useState } from 'react';
import { Loading } from '@carbon/react';
import ClinicalLayout from '@layouts/clinical/ClinicalLayout';
import DashboardContainer from '@components/clinical/dashboardContainer/DashboardContainer';
import { useClinicalConfig } from '@hooks/useClinicalConfig';
import HeaderWSideNav from '@components/common/headerWSideNav/HeaderWSideNav';
import { useDashboardConfig } from '@hooks/useDashboardConfig';
import useNotification from '@hooks/useNotification';
import { useTranslation } from 'react-i18next';
import { useSidebarNavigation } from '@hooks/useSidebarNavigation';
import {
  getDefaultDashboard,
  getSidebarItems,
} from '@services/consultationPageService';
import BahmniIcon from '@components/common/bahmniIcon/BahmniIcon';
import { ICON_SIZE } from '@constants/icon';
import { BAHMNI_CLINICAL_PATH, BAHMNI_HOME_PATH } from '@constants/app';
import ConsultationPad from '@components/clinical/consultationPad/ConsultationPad';
import PatientHeader from '@components/clinical/patientHeader/PatientHeader';

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
    renderIcon: (
      <BahmniIcon id="search-icon" name="fa-search" size={ICON_SIZE.LG} />
    ),
    onClick: () => console.log('Search clicked'),
  },
  {
    id: 'notifications',
    label: 'Notifications',
    renderIcon: (
      <BahmniIcon id="notifications-icon" name="fa-bell" size={ICON_SIZE.LG} />
    ),
    onClick: () => console.log('Notifications clicked'),
  },
  {
    id: 'user',
    label: 'User',
    renderIcon: (
      <BahmniIcon id="user-icon" name="fa-user" size={ICON_SIZE.LG} />
    ),
    onClick: () => console.log('App Switcher clicked'),
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
  const { addNotification } = useNotification();
  const [isActionAreaVisible, setIsActionAreaVisible] = useState(false);

  const currentDashboard = useMemo(() => {
    if (!clinicalConfig) return null;
    return getDefaultDashboard(clinicalConfig.dashboards || []);
  }, [clinicalConfig]);

  const dashboardUrl = currentDashboard?.url || null;
  const { dashboardConfig } = useDashboardConfig(dashboardUrl);

  const sidebarItems = useMemo(() => {
    if (!dashboardConfig) return [];
    return getSidebarItems(dashboardConfig);
  }, [dashboardConfig]);

  const { activeItemId, handleItemClick } = useSidebarNavigation(sidebarItems);

  if (!clinicalConfig) {
    return <Loading description={t('LOADING_CLINICAL_CONFIG')} role="status" />;
  }

  if (!currentDashboard) {
    addNotification({
      title: t('ERROR_DEFAULT_TITLE'),
      message: t('ERROR_NO_DEFAULT_DASHBOARD'),
      type: 'error',
    });
    return <Loading description={t('ERROR_LOADING_DASHBOARD')} role="alert" />;
  }

  if (!dashboardConfig) {
    return (
      <Loading description={t('LOADING_DASHBOARD_CONFIG')} role="status" />
    );
  }

  return (
    <ClinicalLayout
      headerWSideNav={
        <HeaderWSideNav
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
          fallback={
            <Loading
              description={t('LOADING_DASHBOARD_CONTENT')}
              role="status"
            />
          }
        >
          <DashboardContainer
            sections={dashboardConfig.sections}
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
  );
};

export default ConsultationPage;
