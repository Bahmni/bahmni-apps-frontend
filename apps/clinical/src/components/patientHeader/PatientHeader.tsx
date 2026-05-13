import {
  useTranslation,
  CONSULTATION_ENCOUNTER_TYPE_UUID,
} from '@bahmni/services';
import { PatientDetails, useActivePractitioner } from '@bahmni/widgets';
import React from 'react';
import { useEncounterSession } from '../../hooks/useEncounterSession';
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
  const { practitioner } = useActivePractitioner();

  // Preloads encounter session decision on page load so downstream consumers
  // (Allergies, Conditions, Medications widgets) have matchReason available
  // without waiting for ConsultationPad to open.
  const { matchReason, canEditEncounter } = useEncounterSession({
    practitioner,
    encounterTypeUUID: CONSULTATION_ENCOUNTER_TYPE_UUID,
  });

  return (
    <div
      aria-label={t('PATIENT_HEADER_LABEL')}
      className={styles.header}
      data-testid="patient-header"
      data-match-reason={matchReason ?? undefined}
      data-can-edit-encounter={canEditEncounter}
    >
      <PatientDetails />
      <ConsultationActionButton isActionAreaVisible={isActionAreaVisible} />
    </div>
  );
};

export default PatientHeader;
