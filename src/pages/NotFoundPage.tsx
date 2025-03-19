import React from "react";
import { Grid, Column, Heading, Section, Link } from "@carbon/react";
import { Link as RouterLink } from "react-router-dom";

const NotFoundPage: React.FC = () => {
  return (
    <Section>
      <Grid>
        <Column lg={16} md={8} sm={4}>
          <Heading>404 - Page Not Found</Heading>
          <p>The page you are looking for does not exist.</p>
          <Link as={RouterLink} to="/">
            Return to Home
          </Link>
        </Column>
      </Grid>
    </Section>
  );
};

export default NotFoundPage;
