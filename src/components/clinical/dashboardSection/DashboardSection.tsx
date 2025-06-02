import React from 'react';
import { Tile } from '@carbon/react';
import { DashboardSectionConfig } from '@/types/dashboardConfig';
import * as styles from './styles/DashboardSection.module.scss';
import AllergiesTable from '@displayControls/allergies/AllergiesTable';
import ConditionsTable from '@displayControls/conditions/ConditionsTable';
import DiagnosesControl from '@/displayControls/diagnoses/DiagnosesControl';
import { useTranslation } from 'react-i18next';
import LabInvestigation from '@displayControls/labinvestigation/LabInvestigationControl';

export interface DashboardSectionProps {
  section: DashboardSectionConfig;
  ref: React.RefObject<HTMLDivElement | null>;
}

//TODO: Refactor this to depend on Controls configuration
const renderSectionContent = (section: DashboardSectionConfig) => {
  if (section.controls && section.controls.length > 0) {
    return (
      <div className="section-controls">
        {section.controls.map((control, index) => (
          <div key={`${control.type}-${index}`}>
            {renderControlContent(control.type)}
          </div>
        ))}
      </div>
    );
  }

  switch (section.name) {
    case 'Allergies':
      return <AllergiesTable />;
    case 'Conditions':
      return <ConditionsTable />;
    case 'Lab Investigations':
      return <LabInvestigation />;
    case 'Diagnoses':
      return <DiagnosesControl />;
    default:
      return null;
  }
};

const renderControlContent = (controlType: string) => {
  switch (controlType) {
    case 'conditions':
      return <ConditionsTable />;
    case 'diagnoses':
      return <DiagnosesControl />;
    case 'allergies':
      return <AllergiesTable />;
    case 'labInvestigations':
      return <LabInvestigation />;
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
    <Tile id={`section-${section.name.toLowerCase().replace(/\s+/g, '-')}`} ref={ref}>
      <p className={styles.sectionTitle}>
        {t(section.translationKey || section.name)}
      </p>
      {renderSectionContent(section)}
    </Tile>
  );
};

export default DashboardSection;
