import { Loading } from '@bahmni-frontend/bahmni-design-system';
import React, { Suspense, useMemo, useState } from 'react';
import { useTranslation } from '@bahmni-frontend/bahmni-services';
//import ConsultationPad from '@components/clinical/consultationPad/ConsultationPad';
import DashboardContainer from '../components/dashboardContainer/DashboardContainer';
import PatientHeader from '../components/patientHeader/PatientHeader';
import { Icon } from '@bahmni-frontend/bahmni-design-system';
import { HeaderWSideNav } from '@bahmni-frontend/bahmni-design-system';
import { BAHMNI_CLINICAL_PATH, BAHMNI_HOME_PATH } from '../constants/app';
import { ICON_SIZE } from '@bahmni-frontend/bahmni-design-system';
import { useClinicalConfig } from '../hooks/useClinicalConfig';
import { useDashboardConfig } from '../hooks/useDashboardConfig';
import { useNotification } from '@bahmni-frontend/bahmni-widgets';
import { useSidebarNavigation } from '@bahmni-frontend/bahmni-design-system';
import { ClinicalLayout } from '@bahmni-frontend/bahmni-design-system';
import {
  getDefaultDashboard,
  getSidebarItems,
} from '../services/consultationPageService';
import AllergiesForm from '../components/forms/allergies/AllergiesForm';
import EncounterDetails from '../components/forms/encounterDetails/EncounterDetails';

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
      <Icon id="search-icon" name="fa-search" size={ICON_SIZE.LG} />
    ),
    onClick: () => { },
  },
  {
    id: 'notifications',
    label: 'Notifications',
    renderIcon: (
      <Icon id="notifications-icon" name="fa-bell" size={ICON_SIZE.LG} />
    ),
    onClick: () => { },
  },
  {
    id: 'user',
    label: 'User',
    renderIcon: (
      <Icon id="user-icon" name="fa-user" size={ICON_SIZE.LG} />
    ),
    onClick: () => { },
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

  const dashboardUrl = currentDashboard?.url ?? null;
  const { dashboardConfig } = useDashboardConfig(dashboardUrl);

  const sidebarItems = useMemo(() => {
    if (!dashboardConfig) return [];
    return getSidebarItems(dashboardConfig, t);
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
      // actionArea={
      //   <ConsultationPad
      //     onClose={() => setIsActionAreaVisible((prev) => !prev)}
      //   />
      // }
      actionArea={<div><AllergiesForm/><EncounterDetails/></div>} // Placeholder for ConsultationPad
    />
  );
};

export default ConsultationPage;
