import {
  useTranslation,
  useSubscribeConsultationSaved,
  CONSULTATION_ENCOUNTER_TYPE_UUID,
  setEncounterSessionState,
  resetEncounterSession,
} from '@bahmni/services';
import {
  PatientDetails,
  useActivePractitioner,
  usePatientUUID,
} from '@bahmni/widgets';
import React, { useEffect } from 'react';
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
  const patientUUID = usePatientUUID();

  // Single hook call shared with ConsultationActionButton via props to avoid
  // duplicate FHIR searches. matchReason is exposed on the DOM so downstream
  // widget consumers can read it without waiting for ConsultationPad to open.
  const {
    matchReason,
    editActiveEncounter,
    activeEncounter,
    isLoading,
    refetch,
  } = useEncounterSession({
    practitioner,
    encounterTypeUUID: CONSULTATION_ENCOUNTER_TYPE_UUID,
  });

  useSubscribeConsultationSaved(
    (payload) => {
      if (payload.patientUUID === patientUUID) {
        refetch();
      }
    },
    [patientUUID],
  );

  // Publish encounter session state so widgets can read it without DOM queries.
  useEffect(() => {
    setEncounterSessionState({
      canEditOrCreate: editActiveEncounter,
      activeEncounterUuid:
        editActiveEncounter && activeEncounter?.id ? activeEncounter.id : null,
      activePractitionerUuid: practitioner?.uuid ?? null,
      isLoading,
    });
  }, [editActiveEncounter, activeEncounter, practitioner, isLoading]);

  useEffect(() => {
    return () => {
      resetEncounterSession();
    };
  }, []);

  return (
    <div
      aria-label={t('PATIENT_HEADER_LABEL')}
      className={styles.header}
      data-testid="patient-header"
      data-match-reason={
        matchReason.length > 0 ? matchReason.join(',') : undefined
      }
      data-can-edit-encounter={editActiveEncounter ? 'true' : undefined}
      data-active-encounter-uuid={
        editActiveEncounter && activeEncounter?.id
          ? activeEncounter.id
          : undefined
      }
      data-active-practitioner-uuid={practitioner?.uuid ?? undefined}
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
