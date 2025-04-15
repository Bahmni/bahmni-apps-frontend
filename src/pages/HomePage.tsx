import React, { Suspense } from 'react';
import { Grid, Column, Section, Loading } from '@carbon/react';
import { useConfig } from '@hooks/useConfig';

const PatientDetails = React.lazy(
  () => import('@components/patient/PatientDetails'),
);
const ConditionsTable = React.lazy(
  () => import('@components/conditions/ConditionsTable'),
);
const AllergiesTable = React.lazy(
  () => import('@components/allergies/AllergiesTable'),
);

const HomePage: React.FC = () => {
  const { config } = useConfig();

  if (!config) {
    return <Loading description="Loading..." />;
  }

  return (
    <Suspense fallback={<Loading description="Loading..." />}>
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
