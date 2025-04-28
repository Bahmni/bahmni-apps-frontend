import React, { Suspense } from 'react';
import { Grid, Column, Section, Loading } from '@carbon/react';
import PatientDetails from '@displayControls/patient/PatientDetails';
import ConditionsTable from '@displayControls/conditions/ConditionsTable';
import AllergiesTable from '@displayControls/allergies/AllergiesTable';
import { useClinicalConfig } from '@hooks/useClinicalConfig';

const HomePage: React.FC = () => {
  const { clinicalConfig } = useClinicalConfig();
  if (!clinicalConfig) {
    return <Loading description="Loading..." />;
  }
  console.log(clinicalConfig);
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

export default HomePage;
