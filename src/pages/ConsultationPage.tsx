import React, { Suspense, useState, useMemo } from 'react';
import { Grid, Column, Section, Loading } from '@carbon/react';
import ClinicalLayout from '@layouts/clinical/ClinicalLayout';
import PatientDetails from '@displayControls/patient/PatientDetails';
import ConditionsTable from '@displayControls/conditions/ConditionsTable';
import AllergiesTable from '@displayControls/allergies/AllergiesTable';
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

  const [activeSidebarItem, setActiveSidebarItem] = useState<string | null>(
    null,
  );

  const handleSidebarItemClick = (itemId: string) => {
    setActiveSidebarItem(itemId);
  };

  if (!clinicalConfig) {
    return <Loading description="Loading..." />;
  }

  const currentDashboard = useMemo(() => {
    if (!clinicalConfig) return null;
    return getDefaultDashboard(clinicalConfig.dashboards);
  }, [clinicalConfig]);

  if (!currentDashboard) {
    addNotification({
      title: 'Error',
      message: 'No default dashboard configured',
      type: 'error',
    });
    return <Loading description="Error Loading dashboard" />;
  }
  const { dashboardConfig } = useDashboardConfig(currentDashboard.url);

  if (!dashboardConfig) {
    return <Loading description="Loading dashboard config..." />;
  }

  return (
    <ClinicalLayout
      header={<Header />}
      patientDetails={<PatientDetails />}
      sidebar={
        <Sidebar
          items={getSidebarItems(dashboardConfig)}
          activeItemId={activeSidebarItem}
          onItemClick={handleSidebarItemClick}
        />
      }
      mainDisplay={
        <Suspense fallback="loading">
          <Section>
            <Grid>
              <Column lg={16} md={8} sm={4}>
                <AllergiesTable />
                <ConditionsTable />
              </Column>
            </Grid>
          </Section>
        </Suspense>
      }
    />
  );
};

export default ConsultationPage;
