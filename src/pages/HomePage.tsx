import React, { Suspense } from 'react';
import { Grid, Column, Section } from '@carbon/react';
import PatientDetails from '@components/patient/PatientDetails';
import ConditionsTable from '@components/conditions/ConditionsTable';
import AllergiesTable from '@components/allergies/AllergiesTable';

const HomePage: React.FC = () => {
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
