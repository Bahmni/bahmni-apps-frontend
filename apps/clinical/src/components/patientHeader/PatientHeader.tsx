import { useTranslation } from '@bahmni/services';
import { PatientDetails } from '@bahmni/widgets';
import React from 'react';
import ConsultationActionButton from './ConsultationActionButton';
import styles from './styles/PatientHeader.module.scss';

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
    <div
      aria-label={t('PATIENT_HEADER_LABEL')}
      className={styles.header}
      data-testid="patient-header"
    >
      <PatientDetails />
      <ConsultationActionButton
        isActionAreaVisible={isActionAreaVisible}
        setIsActionAreaVisible={setIsActionAreaVisible}
      />
    </div>
  );
};

export default PatientHeader;
