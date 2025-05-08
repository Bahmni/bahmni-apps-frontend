import React from 'react';
import { Tile } from '@carbon/react';
import { DashboardSection as DashboardSectionType } from '@types/dashboardConfig';
import * as styles from './styles/DashboardSection.module.scss';

export interface DashboardSectionProps {
  section: DashboardSectionType;
}

/**
 * DashboardSection component that renders a single dashboard section as a Carbon Tile
 *
 * @param {DashboardSectionProps} props - Component props
 * @returns {React.ReactElement} The rendered component
 */
const DashboardSection: React.FC<DashboardSectionProps> = ({ section }) => {
  return (
    <div id={`section-${section.name}`}>
      <Tile>
        <p className={styles.sectionTitle}>{section.name}</p>
      </Tile>
    </div>
  );
};

export default DashboardSection;
