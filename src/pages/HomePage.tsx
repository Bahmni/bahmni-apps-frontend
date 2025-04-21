import React, { Suspense } from 'react';
import { Grid, Column, Section, Loading } from '@carbon/react';
import { useClinicalConfig } from '@hooks/useClinicalConfig';

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
  const { clinicalConfig } = useClinicalConfig();
  if (!clinicalConfig) {
    return <Loading description="Loading..." />;
  }
  console.log(clinicalConfig);
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
