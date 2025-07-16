import React from 'react';
import { Tile, Grid, Column } from '@carbon/react';
import PatientDetails from '@displayControls/patient/PatientDetails';
import { useTranslation } from 'react-i18next';
import * as styles from './styles/PatientHeader.module.scss';

interface PatientHeaderProps {}

/**
 * Header component for the Bahmni Clinical application
 * Displays patient details without action buttons
 *
 * @returns {React.ReactElement} The Header component
 */
const PatientHeader: React.FC<PatientHeaderProps> = () => {
  const { t } = useTranslation();

  return (
    <Tile aria-label={t('PATIENT_HEADER_LABEL')} className={styles.header}>
      <Grid>
        <Column sm={4} md={8} lg={16} xl={16}>
          <PatientDetails />
        </Column>
      </Grid>
    </Tile>
  );
};
export default PatientHeader;
