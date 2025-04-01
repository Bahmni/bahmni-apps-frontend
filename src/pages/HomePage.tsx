import React from 'react';
import { Grid, Column, Section } from '@carbon/react';
import PatientDetails from '@components/patient/PatientDetails';
import ConditionsTable from '@components/conditions/ConditionsTable';

const HomePage: React.FC = () => {
  return (
    <Section>
      <Grid>
        <Column lg={16} md={8} sm={4}>
          <PatientDetails />
          <ConditionsTable />
        </Column>
      </Grid>
    </Section>
  );
};

export default HomePage;
