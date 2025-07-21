import { Add } from '@carbon/icons-react';
import { Button } from '@carbon/react';
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
    <div aria-label={t('PATIENT_HEADER_LABEL')} className={styles.header}>
      <PatientDetails />
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
    </div>
  );
};
export default PatientHeader;
