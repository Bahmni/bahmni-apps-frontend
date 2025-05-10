import React, { useEffect, useRef } from 'react';
import { Grid, Column, Section } from '@carbon/react';
import { DashboardSectionConfig } from '@types/dashboardConfig';
import DashboardSection from '../dashboardSection/DashboardSection';
import * as styles from './styles/DashboardContainer.module.scss';

// TODO: The name is confusing for someone without project context, consider renaming
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
  activeItemId,
}) => {
  // Create a ref map for each section - fix the type definition here
  const sectionRefs = useRef<{
    [key: string]: React.RefObject<HTMLDivElement>;
  }>({});

  // Initialize refs for each section
  useEffect(() => {
    sections.forEach((section) => {
      if (!sectionRefs.current[section.name]) {
        sectionRefs.current[section.name] = React.createRef<HTMLDivElement>();
      }
    });
  }, [sections]);

  // Scroll to active section when activeItemId changes
  useEffect(() => {
    if (activeItemId) {
      // Find the section that corresponds to the activeItemId
      const activeSection = sections.find(
        (section) =>
          // This assumes sidebar item IDs match section names or have a consistent pattern
          section.name === activeItemId ||
          `section-${section.name}` === activeItemId,
      );

      if (activeSection && sectionRefs.current[activeSection.name]?.current) {
        // Added optional chaining and null check to prevent errors
        sectionRefs.current[activeSection.name].current.scrollIntoView({
          behavior: 'smooth',
        });
      }
    }
  }, [activeItemId, sections]);

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
            ref={sectionRefs.current[section.name]}
          >
            <DashboardSection
              section={section}
              ref={sectionRefs.current[section.name]}
            />
          </Column>
        ))}
      </Grid>
    </Section>
  );
};

export default DashboardContainer;
