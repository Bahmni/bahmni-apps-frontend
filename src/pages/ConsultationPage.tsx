import React, { Suspense, useMemo } from 'react';
import { Loading } from '@carbon/react';
import ClinicalLayout from '@layouts/clinical/ClinicalLayout';
import PatientDetails from '@displayControls/patient/PatientDetails';
import DashboardContainer from '@components/clinical/dashboardContainer/DashboardContainer';
import { useClinicalConfig } from '@hooks/useClinicalConfig';
import Header from '@components/clinical/header/Header';
import Sidebar from '@components/common/sidebar/Sidebar';
import { useDashboardConfig } from '@hooks/useDashboardConfig';
import useNotification from '@hooks/useNotification';
import { useTranslation } from 'react-i18next';
import { useSidebarNavigation } from '@hooks/useSidebarNavigation';
import {
  getDefaultDashboard,
  getSidebarItems,
} from '@services/ConsultationPageService';

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
      header={<Header />}
      patientDetails={<PatientDetails />}
      sidebar={
        <Sidebar
          items={sidebarItems}
          activeItemId={activeItemId}
          onItemClick={handleItemClick}
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
    />
  );
};

export default ConsultationPage;
