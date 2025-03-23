import React from 'react';
import { Grid, Column, Section } from '@carbon/react';
import PatientDetails from '../components/patient/PatientDetails';

const patientUUID = '02f47490-d657-48ee-98e7-4c9133ea168b';
const HomePage: React.FC = () => {
  return (
    <Section>
      <Grid>
        <Column lg={16} md={8} sm={4}>
          <PatientDetails patientUUID={patientUUID} />
        </Column>
      </Grid>
    </Section>
  );
};

export default HomePage;
