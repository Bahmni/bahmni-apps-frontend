import React, { Suspense, useEffect } from 'react';
import { Grid, Column, Section, Loading } from '@carbon/react';
import ClinicalLayout from '@layouts/clinical/ClinicalLayout';
import PatientDetails from '@displayControls/patient/PatientDetails';
import ConditionsTable from '@displayControls/conditions/ConditionsTable';
import AllergiesTable from '@displayControls/allergies/AllergiesTable';
import { useClinicalConfig } from '@hooks/useClinicalConfig';
import Header from '@components/clinical/header/Header';
import Sidebar from '@components/common/sidebar/Sidebar';
import { SidebarItemProps } from '@/components/common/sidebar/SidebarItem';
import { Dashboard } from '@types/config';

const ConsultationPage: React.FC = () => {
  const { clinicalConfig } = useClinicalConfig();
  if (!clinicalConfig) {
    return <Loading description="Loading..." />;
  }
  console.log(clinicalConfig);
  const sidebarItems: SidebarItemProps[] = [
    {
      id: 'notes',
      icon: 'fa-clipboard-list',
      label: 'Consultation Notes',
      active: true,
      action: () => {},
    },
    {
      id: 'vitals',
      icon: 'fa-heartbeat',
      label: 'Vital Signs',
      action: () => {},
    },
    {
      id: 'medications',
      icon: 'fa-pills',
      label: 'Medications',
      action: () => {},
    },
    {
      id: 'lab-orders',
      icon: 'fa-flask',
      label: 'Lab Orders',
      action: () => {},
    },
    {
      id: 'appointments',
      icon: 'fa-calendar-alt',
      label: 'Appointments',
      action: () => {},
    },
  ];

  const [currentDashboard, setCurrentDashboard] =
    React.useState<Dashboard | null>(null);

  const getDefaultDashboard = () => {
    //find the default dashboard with the default property set to true
    const defaultDashboard = clinicalConfig.dashboards.find(
      (dashboard) => dashboard.default === true,
    );
    if (!defaultDashboard) {
      return null;
    }
    return defaultDashboard;
  };

  useEffect(() => {
    if (clinicalConfig) {
      setCurrentDashboard(getDefaultDashboard);
    }
  }, [clinicalConfig]);

  return (
    <ClinicalLayout
      header={<Header />}
      patientDetails={<PatientDetails />}
      sidebar={<Sidebar items={sidebarItems} />}
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
