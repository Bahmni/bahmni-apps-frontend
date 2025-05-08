import React from 'react';
import { Grid, Column, Section } from '@carbon/react';
import { DashboardSectionConfig } from '@types/dashboardConfig';
import DashboardSection from '../dashboardSection/DashboardSection';
import * as styles from './styles/DashboardContainer.module.scss';

export interface DashboardContainerProps {
  sections: DashboardSectionConfig[];
  activeItemId?: string | null;
}

/**
 * DashboardContainer component that renders dashboard sections as Carbon Tiles
 *
 * @param {DashboardContainerProps} props - Component props
 * @returns {React.ReactElement} The rendered component
 */
const DashboardContainer: React.FC<DashboardContainerProps> = ({
  sections,
}) => {
  // If no sections, show a message
  if (!sections.length) {
    return <div>No dashboard sections configured</div>;
  }

  return (
    <Section>
      <Grid>
        {sections.map((section) => (
          <Column
            lg={16}
            md={8}
            sm={4}
            key={section.name}
            className={styles.sectionColumn}
          >
            <DashboardSection section={section} />
          </Column>
        ))}
      </Grid>
    </Section>
  );
};

export default DashboardContainer;
