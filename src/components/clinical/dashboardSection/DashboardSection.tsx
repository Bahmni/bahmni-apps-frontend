import React from 'react';
import { Tile } from '@carbon/react';
import { DashboardSectionConfig } from '@types/dashboardConfig';
import * as styles from './styles/DashboardSection.module.scss';
import AllergiesTable from '@/displayControls/allergies/AllergiesTable';
import ConditionsTable from '@/displayControls/conditions/ConditionsTable';

export interface DashboardSectionProps {
  section: DashboardSectionConfig;
}

//TODO: Refactor this to depend on Controls configuration
const renderSectionContent = (section: DashboardSectionConfig) => {
  switch (section.name) {
    case 'Allergies':
      return <AllergiesTable />;
    case 'Conditions':
      return <ConditionsTable />;
    default:
      return null;
  }
};
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
        {renderSectionContent(section)}
      </Tile>
    </div>
  );
};

export default DashboardSection;
