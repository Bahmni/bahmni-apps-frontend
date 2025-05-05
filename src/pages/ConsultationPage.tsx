import React, { Suspense, useEffect } from 'react';
import { Grid, Column, Section, Loading } from '@carbon/react';
import PatientDetails from '@displayControls/patient/PatientDetails';
import ConditionsTable from '@displayControls/conditions/ConditionsTable';
import AllergiesTable from '@displayControls/allergies/AllergiesTable';
import { useClinicalConfig } from '@hooks/useClinicalConfig';
import { Dashboard } from '@types/config';

const ConsultationPage: React.FC = () => {
  const { clinicalConfig } = useClinicalConfig();
  if (!clinicalConfig) {
    return <Loading description="Loading..." />;
  }
  console.log(clinicalConfig);
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
    <Suspense fallback="loading">
      <Section>
        <Grid>
          <Column lg={16} md={8} sm={4}>
            <PatientDetails />
            <AllergiesTable />
            <ConditionsTable />
          </Column>
        </Grid>
      </Section>
    </Suspense>
  );
};

export default ConsultationPage;
