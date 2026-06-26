import {
  useTranslation,
  useSubscribeConsultationSaved,
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
import { useEncounterConcepts } from '../../hooks/useEncounterConcepts';
import { useEncounterSession } from '../../hooks/useEncounterSession';
import { usePatientVisit } from '../../hooks/usePatientVisit';
import { useClinicalConfig } from '../../providers/clinicalConfig';
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
  const { clinicalConfig } = useClinicalConfig();
  const { encounterConcepts } = useEncounterConcepts();

  const patientUUID = usePatientUUID();

  const defaultEncounterTypeName =
    clinicalConfig?.consultationPad?.inputControls?.find(
      (c) => c.type === 'encounterDetails',
    )?.metadata?.defaultEncounterType as string | undefined;

  const encounterTypeUUID = useMemo(() => {
    if (!defaultEncounterTypeName || !encounterConcepts) return undefined;
    return encounterConcepts.encounterTypes.find(
      (et) => et.name === defaultEncounterTypeName,
    )?.uuid;
  }, [defaultEncounterTypeName, encounterConcepts]);

  const {
    matchReason,
    editActiveEncounter,
    activeEncounter,
    isLoading,
    refetch,
  } = useEncounterSession({
    practitioner,
    encounterTypeUUID,
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
      timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
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
