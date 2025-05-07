import React, { Suspense } from 'react';
import { Grid, Column, Section, Loading } from '@carbon/react';
import ClinicalLayout from '@layouts/clinical/ClinicalLayout';
import PatientDetails from '@displayControls/patient/PatientDetails';
import ConditionsTable from '@displayControls/conditions/ConditionsTable';
import AllergiesTable from '@displayControls/allergies/AllergiesTable';
import { useClinicalConfig } from '@hooks/useClinicalConfig';
import Header from '@components/clinical/header/Header';
import Sidebar, { SidebarItemProps } from '@components/common/sidebar/Sidebar';
import { Dashboard } from '@types/config';
import { useDashboardConfig } from '@hooks/useDashboardConfig';
import { DashboardConfig } from '@types/dashboardConfig';
import useNotification from '@hooks/useNotification';

const ConsultationPage: React.FC = () => {
  const { clinicalConfig } = useClinicalConfig();
  const { addNotification } = useNotification();

  const getDefaultDashboard = (dashboards: Dashboard[]): Dashboard | null => {
    const defaultDashboard = dashboards.find(
      (dashboard) => dashboard.default === true,
    );
    if (defaultDashboard) {
      return defaultDashboard;
    }
    return null;
  };

  const getSidebarItems = (
    dashboardConfig: DashboardConfig,
  ): SidebarItemProps[] => {
    return dashboardConfig.sections.map((section) => ({
      id: section.name,
      icon: section.icon,
      // TODO: add translation
      label: section.name,
      active: false,
      action: () => {},
    }));
  };

  if (!clinicalConfig) {
    return <Loading description="Loading..." />;
  }
  const currentDashboard = getDefaultDashboard(clinicalConfig.dashboards);

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
      sidebar={<Sidebar items={getSidebarItems(dashboardConfig)} />}
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
