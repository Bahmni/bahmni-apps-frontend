<<<<<<< HEAD
import { Button } from '@carbon/react';
=======
>>>>>>> e44c85839265ee3f596d66722f95f6bf104f847e
import React from 'react';
import { useTranslation } from 'react-i18next';
import ConsultationActionButton from '@/components/clinical/patientHeader/ConsultationActionButton';
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
    <div aria-label={t('PATIENT_HEADER_LABEL')} className={styles.header}>
      <PatientDetails />
      <ConsultationActionButton
        isActionAreaVisible={isActionAreaVisible}
        setIsActionAreaVisible={setIsActionAreaVisible}
      />
    </div>
  );
};

export default PatientHeader;
