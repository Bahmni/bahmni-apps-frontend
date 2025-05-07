import React, { Suspense, useState } from 'react';
import { Grid, Column, Section, Loading } from '@carbon/react';
import ClinicalLayout from '@layouts/clinical/ClinicalLayout';
import PatientDetails from '@displayControls/patient/PatientDetails';
import ConditionsTable from '@displayControls/conditions/ConditionsTable';
import AllergiesTable from '@displayControls/allergies/AllergiesTable';
import { useClinicalConfig } from '@hooks/useClinicalConfig';
import Header from '@components/clinical/header/Header';
import Sidebar, { SidebarItemProps } from '@components/common/sidebar/Sidebar';

const ConsultationPage: React.FC = () => {
  const { clinicalConfig } = useClinicalConfig();
  const [activeSidebarItem, setActiveSidebarItem] = useState<string | null>(
    null,
  );

  const handleSidebarItemClick = (itemId: string) => {
    setActiveSidebarItem(itemId);
  };

  if (!clinicalConfig) {
    return <Loading description="Loading..." />;
  }
  console.log(clinicalConfig);
  const sidebarItems: SidebarItemProps[] = [
    {
      id: 'notes',
      icon: 'fa-clipboard-list',
      label: 'Consultation Notes',
      active: activeSidebarItem == 'notes',
      action: () => handleSidebarItemClick('notes'),
    },
    {
      id: 'vitals',
      icon: 'fa-heartbeat',
      label: 'Vital Signs',
      active: activeSidebarItem == 'vitals',
      action: () => handleSidebarItemClick('vitals'),
    },
    {
      id: 'medications',
      icon: 'fa-pills',
      label: 'Medications',
      active: activeSidebarItem == 'medications',
      action: () => handleSidebarItemClick('medications'),
    },
    {
      id: 'lab-orders',
      icon: 'fa-flask',
      label: 'Lab Orders',
      active: activeSidebarItem == 'lab-orders',
      action: () => handleSidebarItemClick('lab-orders'),
    },
    {
      id: 'appointments',
      icon: 'fa-calendar-alt',
      label: 'Appointments',
      active: activeSidebarItem == 'appointments',
      action: () => handleSidebarItemClick('appointments'),
    },
  ];

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
