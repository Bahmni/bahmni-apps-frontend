import { Tile, Grid, Column } from '@carbon/react';
import React from 'react';
import { useTranslation } from 'react-i18next';
import ConsultationActionButton from '@components/clinical/consultationAction/ConsultationActionButton';
import PatientDetails from '@displayControls/patient/PatientDetails';
import * as styles from './styles/PatientHeader.module.scss';

interface PatientHeaderProps {
  isActionAreaVisible: boolean;
  setIsActionAreaVisible: React.Dispatch<React.SetStateAction<boolean>>;
}

/**
 * Header component for the Bahmni Clinical application
 * Displays patient details with consultation action button
 *
 * @param {boolean} isActionAreaVisible - Whether the action area is currently visible
 * @param {function} setIsActionAreaVisible - Function to toggle action area visibility
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
          <ConsultationActionButton
            isActionAreaVisible={isActionAreaVisible}
            setIsActionAreaVisible={setIsActionAreaVisible}
          />
        </Column>
      </Grid>
    </Tile>
  );
};
export default PatientHeader;
