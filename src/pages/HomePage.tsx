import React from "react";
import { Grid, Column, Heading, Section } from "@carbon/react";

const HomePage: React.FC = () => {
  return (
    <Section>
      <Grid>
        <Column lg={16} md={8} sm={4}>
          <Heading>Welcome to Bahmni Clinical Frontend</Heading>
          <p>
            This is a React TypeScript application built with Webpack and Carbon
            Design System. It includes PWA support for offline capabilities.
          </p>
        </Column>
      </Grid>
    </Section>
  );
};

export default HomePage;
