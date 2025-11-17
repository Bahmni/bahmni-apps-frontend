import { Tile } from '@bahmni/design-system';
import { useTranslation, DashboardSectionConfig } from '@bahmni/services';
import {
  AllergiesTable,
  ConditionsTable,
  DiagnosesTable,
  LabInvestigation,
  MedicationsTable,
  RadiologyInvestigationTable,
  VitalFlowSheet,
} from '@bahmni/widgets';
import React from 'react';
import styles from './styles/DashboardSection.module.scss';

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
          <div className={styles.divider} />
          <DiagnosesTable />
        </>
      );
    case 'Lab Investigations':
      return <LabInvestigation />;
    case 'Radiology Investigations':
      return <RadiologyInvestigationTable />;
    case 'Medications':
      return <MedicationsTable />;
    case 'Flowsheet':
      return (
        <VitalFlowSheet
          latestCount={5}
          groupBy="obstime"
          obsConcepts={[
            'Temperature',
            'Pulse',
            'Respiratory rate',
            'Blood Pressure',
            'Body Position',
          ]}
        />
      );
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
    <div
      id={`section-${section.id}`}
      ref={ref}
      className={styles.sectionWrapper}
    >
      <Tile id={`section-${section.id}`} className={styles.sectionName}>
        <p>{t(section.translationKey ?? section.name)}</p>
      </Tile>
      {renderSectionContent(section)}
    </div>
  );
};

export default DashboardSection;
