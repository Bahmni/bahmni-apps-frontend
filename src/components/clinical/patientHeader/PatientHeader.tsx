import React from 'react';
import { Tile, Button, Grid, Column } from '@carbon/react';
import PatientDetails from '@displayControls/patient/PatientDetails';
import { useTranslation } from 'react-i18next';
import * as styles from './styles/PatientHeader.module.scss';
import { Add } from '@carbon/icons-react';

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

  const handleOnButtonClick = () => {
    if (!isActionAreaVisible) setIsActionAreaVisible(true);
  };

  return (
    <Tile aria-label={t('PATIENT_HEADER_LABEL')} className={styles.header}>
      <Grid>
        <Column
          sm={4}
          md={8}
          lg={isActionAreaVisible ? 10 : 13}
          xl={isActionAreaVisible ? 10 : 13}
        >
          <PatientDetails />
        </Column>
        <Column
          sm={4}
          md={8}
          lg={isActionAreaVisible ? 6 : 3}
          xl={isActionAreaVisible ? 6 : 3}
          className={styles.controls}
        >
          <Button size="lg" onClick={handleOnButtonClick} renderIcon={Add}>
            {t('PATIENT_HEADER_SHOW_ACTION_AREA')}
          </Button>
        </Column>
      </Grid>
    </Tile>
  );
};
export default PatientHeader;
