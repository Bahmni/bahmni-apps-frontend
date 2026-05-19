import {
  useTranslation,
  CONSULTATION_ENCOUNTER_TYPE_UUID,
  setEncounterSessionDecision,
  setEncounterSessionLoading,
  resetEncounterSession,
} from '@bahmni/services';
import {
  PatientDetails,
  useActivePractitioner,
  usePatientUUID,
} from '@bahmni/widgets';
import React, { useEffect, useRef } from 'react';
import { useEncounterSession } from '../../hooks/useEncounterSession';
import ConsultationActionButton from './ConsultationActionButton';
import styles from './styles/PatientHeader.module.scss';

interface PatientHeaderProps {
  isActionAreaVisible: boolean;
}

/**
 * Header component for the Bahmni Clinical application
 * Displays patient details with consultation action button.
 *
 * BAH-4652: After resolving the encounter session this component also writes
 * the decision into the shared `encounterSessionStore` (Option B plumbing)
 * so that display widgets in @bahmni/widgets can read it without making their
 * own FHIR calls.
 *
 * @param {boolean} isActionAreaVisible - Whether the action area is currently visible
 * @returns {React.ReactElement} The Header component
 */
const PatientHeader: React.FC<PatientHeaderProps> = ({
  isActionAreaVisible,
}) => {
  const { t } = useTranslation();
  const { practitioner } = useActivePractitioner();
  const patientUUID = usePatientUUID();

  // Single hook call shared with ConsultationActionButton via props to avoid
  // duplicate FHIR searches. matchReason is exposed on the DOM so downstream
  // widget consumers can read it without waiting for ConsultationPad to open.
  const { matchReason, editActiveEncounter, isLoading, activeEncounter } =
    useEncounterSession({
      practitioner,
      encounterTypeUUID: CONSULTATION_ENCOUNTER_TYPE_UUID,
    });

  // Reset the shared store whenever the patient changes so stale data from a
  // previous patient is never surfaced to widgets on the new patient's page.
  const prevPatientUUID = useRef<string | null>(null);
  useEffect(() => {
    if (prevPatientUUID.current !== patientUUID) {
      prevPatientUUID.current = patientUUID;
      resetEncounterSession();
    }
  }, [patientUUID]);

  // Reflect the loading state in the shared store so widgets can show a
  // sensible loading indicator rather than a stale "no session" state.
  useEffect(() => {
    setEncounterSessionLoading(isLoading);
  }, [isLoading]);

  // Write the resolved decision into the shared store (BAH-4652 Option B).
  useEffect(() => {
    if (!isLoading) {
      setEncounterSessionDecision({
        reasons: matchReason,
        encounter: activeEncounter,
      });
    }
  }, [isLoading, matchReason, activeEncounter]);

  return (
    <div
      aria-label={t('PATIENT_HEADER_LABEL')}
      className={styles.header}
      data-testid="patient-header"
      data-match-reason={
        matchReason.length > 0 ? matchReason.join(',') : undefined
      }
      data-can-edit-encounter={editActiveEncounter ? 'true' : undefined}
    >
      <PatientDetails />
      <ConsultationActionButton
        isActionAreaVisible={isActionAreaVisible}
        editActiveEncounter={editActiveEncounter}
        isLoading={isLoading}
      />
    </div>
  );
};

export default PatientHeader;
