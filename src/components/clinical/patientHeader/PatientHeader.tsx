import { Add } from '@carbon/icons-react';
import { Tile, Button, Grid, Column } from '@carbon/react';
import React from 'react';
import { useTranslation } from 'react-i18next';
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
  const { t } = useTranslation();

  return (
    <Tile aria-label={t('PATIENT_HEADER_LABEL')} className={styles.header}>
      <Grid>
        <Column
          sm={4}
          md={8}
          lg={isActionAreaVisible ? 16 : 13}
          xl={isActionAreaVisible ? 16 : 13}
        >
          <PatientDetails />
        </Column>
        <Column
          sm={4}
          md={8}
          lg={isActionAreaVisible ? 16 : 3}
          xl={isActionAreaVisible ? 16 : 3}
          className={styles.controls}
        >
          <Button
            size="lg"
            disabled={isActionAreaVisible}
            onClick={() => setIsActionAreaVisible(!isActionAreaVisible)}
            renderIcon={Add}
          >
            {t(
              isActionAreaVisible
                ? 'PATIENT_HEADER_ACTION_AREA_IN_PROGRESS'
                : 'PATIENT_HEADER_SHOW_ACTION_AREA',
            )}
          </Button>
        </Column>
      </Grid>
    </Tile>
  );
};
export default PatientHeader;
