import React, { ReactNode } from 'react';
import { Column, Grid } from '@carbon/react';
import * as styles from './Section.module.scss';

interface SectionProps {
  title: string;
  children: ReactNode;
}

const Section: React.FC<SectionProps> = ({ title, children }) => {
  return (
    <div className={styles.section}>
      <Grid>
        <Column lg={16} md={8} sm={4}>
          <h4 className={styles.sectionTitle}>{title}</h4>
        </Column>
      </Grid>
      {children}
    </div>
  );
};

export default Section;
