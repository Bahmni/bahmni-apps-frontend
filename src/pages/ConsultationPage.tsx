import React, { Suspense, useState, useMemo } from 'react';
import { Loading } from '@carbon/react';
import ClinicalLayout from '@layouts/clinical/ClinicalLayout';
import PatientDetails from '@displayControls/patient/PatientDetails';
import DashboardContainer from '@components/clinical/dashboardContainer/DashboardContainer';
import { useClinicalConfig } from '@hooks/useClinicalConfig';
import Header from '@components/clinical/header/Header';
import Sidebar from '@components/common/sidebar/Sidebar';
import { useDashboardConfig } from '@hooks/useDashboardConfig';
import useNotification from '@hooks/useNotification';
import {
  getDefaultDashboard,
  getSidebarItems,
} from '@services/ConsultationPageService';

const ConsultationPage: React.FC = () => {
  const { clinicalConfig } = useClinicalConfig();
  const { addNotification } = useNotification();
  const [activeSideBarItemId, setActiveSideBarItemId] = useState<string | null>(
    null,
  );

  const currentDashboard = useMemo(() => {
    if (!clinicalConfig) return null;
    return getDefaultDashboard(clinicalConfig?.dashboards || []);
  }, [clinicalConfig]);

  const { dashboardConfig } = useDashboardConfig(currentDashboard?.url || null);

  const handleSidebarItemClick = (itemId: string) => {
    setActiveSideBarItemId(itemId);
  };

  const sidebarItems = useMemo(() => {
    if (!dashboardConfig) return [];
    return getSidebarItems(dashboardConfig);
  }, [dashboardConfig]);

  if (!clinicalConfig) {
    return <Loading description="Loading..." />;
  }

  if (!currentDashboard) {
    addNotification({
      title: 'Error',
      message: 'No default dashboard configured',
      type: 'error',
    });
    return <Loading description="Error Loading dashboard" />;
  }

  if (!dashboardConfig) {
    return <Loading description="Loading dashboard config..." />;
  }

  return (
    <ClinicalLayout
      header={<Header />}
      patientDetails={<PatientDetails />}
      sidebar={
        <Sidebar
          items={sidebarItems}
          activeItemId={
            activeSideBarItemId ||
            (sidebarItems.length > 0 ? sidebarItems[0].id : null)
          }
          onItemClick={handleSidebarItemClick}
        />
      }
      mainDisplay={
        <Suspense fallback="loading">
          <DashboardContainer
            sections={dashboardConfig.sections}
            activeItemId={
              activeSideBarItemId ||
              (sidebarItems.length > 0 ? sidebarItems[0].id : null)
            }
          />
        </Suspense>
      }
    />
  );
};

export default ConsultationPage;
