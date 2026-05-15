import { useTranslation } from '@bahmni/services';
import {
  DocumentPrintButton,
  PatientDetails,
  usePatientUUID,
  type PrintOption,
} from '@bahmni/widgets';
import React from 'react';
import { usePatientVisit } from '../../hooks/usePatientVisit';
import { useClinicalConfig } from '../../providers/clinicalConfig';
import ConsultationActionButton from './ConsultationActionButton';
import styles from './styles/PatientHeader.module.scss';

interface PatientHeaderProps {
  isActionAreaVisible: boolean;
}

/**
 * Header component for the Bahmni Clinical application
 * Displays patient details with consultation action button
 *
 * @param {boolean} isActionAreaVisible - Whether the action area is currently visible
 * @returns {React.ReactElement} The Header component
 */
const PatientHeader: React.FC<PatientHeaderProps> = ({
  isActionAreaVisible,
}) => {
  const { t } = useTranslation();
  const patientUuid = usePatientUUID();
  const { activeVisit, lastVisit } = usePatientVisit(patientUuid);
  const { clinicalConfig } = useClinicalConfig();

  const visitUuid = activeVisit?.id ?? lastVisit?.id;

  const renderContext: Record<string, string> = {
    ...(patientUuid && { patientUuid }),
    ...(visitUuid && { visitUuid }),
  };

  const printOptions: PrintOption[] = clinicalConfig?.printOptions ?? [];

  return (
    <div
      aria-label={t('PATIENT_HEADER_LABEL')}
      className={styles.header}
      data-testid="patient-header"
    >
      <PatientDetails />
      <div className={styles.actionButtons}>
        <ConsultationActionButton isActionAreaVisible={isActionAreaVisible} />
        <DocumentPrintButton
          printOptions={printOptions}
          renderContext={renderContext}
          data-testid="print-clinical-card"
          size="md"
        />
      </div>
    </div>
  );
};

export default PatientHeader;
