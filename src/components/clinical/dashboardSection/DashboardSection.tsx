import React from 'react';
import { Tile } from '@carbon/react';
import { DashboardSectionConfig } from '@types/dashboardConfig';
import * as styles from './styles/DashboardSection.module.scss';
import AllergiesTable from '@displayControls/allergies/AllergiesTable';
import ConditionsTable from '@displayControls/conditions/ConditionsTable';
import LabInvestigation from '@displayControls/labinvestigation/LabInvestigationControl';
import DiagnosesTable from '@displayControls/diagnoses/DiagnosesTable';
import RadiologyOrdersTable from '@displayControls/radiologyInvestigation/RadiologyInvestigationTable';
import { useTranslation } from 'react-i18next';

export interface DashboardSectionProps {
  section: DashboardSectionConfig;
  ref: React.RefObject<HTMLDivElement | null>;
}

//TODO: Refactor this to depend on Controls configuration
const renderSectionContent = (section: DashboardSectionConfig) => {
  switch (section.name) {
    case 'Allergies':
      return <AllergiesTable />;
    case 'Conditions':
      return (
        <>
          <ConditionsTable />
          <DiagnosesTable />
        </>
      );
    case 'Lab Investigations':
      return <LabInvestigation />;
    case 'Radiology Investigations':
      return <RadiologyOrdersTable />;
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
const DashboardSection: React.FC<DashboardSectionProps> = ({
  section,
  ref,
}) => {
  const { t } = useTranslation();
  return (
    <Tile id={`section-${section.id}`} ref={ref} className={styles.sectionTile}>
      <p className={styles.sectionTitle}>
        {t(section.translationKey || section.name)}
      </p>
      {renderSectionContent(section)}
    </Tile>
  );
};

export default DashboardSection;
