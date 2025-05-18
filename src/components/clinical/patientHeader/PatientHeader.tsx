import React from 'react';
import { Tile, Button, Grid, Column } from '@carbon/react';
import PatientDetails from '@displayControls/patient/PatientDetails';
import * as styles from './styles/PatientHeader.module.scss';

interface PatientHeaderProps {
  setIsActionAreaVisible: React.Dispatch<React.SetStateAction<boolean>>;
  isActionAreaVisible: boolean;
}

/**
 * Header component for the Bahmni Clinical application
 * Provides navigation and branding elements
 *
 * @returns {React.ReactElement} The Header component
 */
const PatientHeader: React.FC<PatientHeaderProps> = ({
  isActionAreaVisible,
  setIsActionAreaVisible,
}) => {
  return (
    <Tile aria-label="Patient Header" className={styles.header}>
      <Grid>
        <Column sm={4} md={8} lg={13} xl={13}>
          <PatientDetails />
        </Column>
        <Column sm={4} md={8} lg={3} xl={3} className={styles.controls}>
          <Button
            size="lg"
            onClick={() => setIsActionAreaVisible(!isActionAreaVisible)}
          >
            {isActionAreaVisible ? 'Hide Action Area' : 'Show Action Area'}
          </Button>
        </Column>
      </Grid>
    </Tile>
  );
};
export default PatientHeader;
