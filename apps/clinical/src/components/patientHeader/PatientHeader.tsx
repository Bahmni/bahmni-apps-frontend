import {
  useTranslation,
  useSubscribeConsultationSaved,
  CONSULTATION_ENCOUNTER_TYPE_UUID,
  setEncounterSessionDecision,
  setEncounterSessionLoading,
  resetEncounterSession,
} from '@bahmni/services';
import {
  DocumentPrintButton,
  PatientDetails,
  useActivePractitioner,
  usePatientUUID,
  type PrintOption,
} from '@bahmni/widgets';
import React, { useEffect, useMemo, useRef } from 'react';
import { useEncounterSession } from '../../hooks/useEncounterSession';
import { usePatientVisit } from '../../hooks/usePatientVisit';
import ConsultationActionButton from './ConsultationActionButton';
import styles from './styles/PatientHeader.module.scss';

interface PatientHeaderProps {
  isActionAreaVisible: boolean;
  printOptions?: PrintOption[];
}

/**
 * Header component for the Bahmni Clinical application
 * Displays patient details with consultation action button.
 *
 * @param {boolean} isActionAreaVisible - Whether the action area is currently visible
 * @returns {React.ReactElement} The Header component
 */
const PatientHeader: React.FC<PatientHeaderProps> = ({
  isActionAreaVisible,
  printOptions,
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

  useEffect(() => {
    if (!isLoading) {
      setEncounterSessionDecision({
        reasons: matchReason,
        encounter: activeEncounter,
      });
    }
  }, [isLoading, matchReason, activeEncounter]);

  useSubscribeConsultationSaved(
    (payload) => {
      if (payload.patientUUID === patientUUID) {
        refetch();
      }
    },
    [patientUUID],
  );

  const {
    activeVisit,
    lastVisit,
    loading: visitLoading,
  } = usePatientVisit(patientUUID);

  const visitUuid = activeVisit?.id ?? lastVisit?.id;

  const renderContext = useMemo(
    () => ({
      ...(patientUUID && { patientUUID }),
      ...(visitUuid && { visitUuid }),
    }),
    [patientUUID, visitUuid],
  );

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
      <div className={styles.actionButtons}>
        <ConsultationActionButton
          isActionAreaVisible={isActionAreaVisible}
          editActiveEncounter={editActiveEncounter}
          isLoading={isLoading}
        />
        <DocumentPrintButton
          printOptions={printOptions}
          renderContext={renderContext}
          disabled={visitLoading}
          data-testid="print-clinical-card"
          size="md"
        />
      </div>
    </div>
  );
};

export default PatientHeader;
