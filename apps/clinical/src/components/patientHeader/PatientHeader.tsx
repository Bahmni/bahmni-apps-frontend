import { type FormattedPatientData, useTranslation } from '@bahmni/services';
import { PatientDetails } from '@bahmni/widgets';
import React from 'react';
import ConsultationActionButton from './ConsultationActionButton';
import styles from './styles/PatientHeader.module.scss';

interface PatientHeaderProps {
  isActionAreaVisible: boolean;
  patient?: FormattedPatientData | null;
  loading?: boolean;
  error?: Error | null;
}

/**
 * Header component for the Bahmni Clinical application
 * Displays patient details with consultation action button
 *
 * @param {boolean} isActionAreaVisible - Whether the action area is currently visible
 * @param {FormattedPatientData | null} patient - Optional pre-fetched patient data
 * @param {boolean} loading - Optional loading state from parent
 * @param {Error | null} error - Optional error state from parent
 * @returns {React.ReactElement} The Header component
 */
const PatientHeader: React.FC<PatientHeaderProps> = ({
  isActionAreaVisible,
  patient,
  loading,
  error,
}) => {
  const { t } = useTranslation();

  return (
    <div
      aria-label={t('PATIENT_HEADER_LABEL')}
      className={styles.header}
      data-testid="patient-header"
    >
      <PatientDetails patient={patient} loading={loading} error={error} />
      <ConsultationActionButton isActionAreaVisible={isActionAreaVisible} />
    </div>
  );
};

export default PatientHeader;
