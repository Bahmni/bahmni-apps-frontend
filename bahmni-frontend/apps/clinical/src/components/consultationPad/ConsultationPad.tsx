import { Column, Grid , MenuItemDivider , ActionArea} from '@bahmni-frontend/bahmni-design-system';
import React, { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import AllergiesForm from '../forms/allergies/AllergiesForm';
import ConditionsAndDiagnoses from '../forms/conditionsAndDiagnoses/ConditionsAndDiagnoses';
import BasicForm from '../forms/encounterDetails/EncounterDetails';
import InvestigationsForm from '../forms/investigations/InvestigationsForm';
import MedicationsForm from '../forms/medications/MedicationsForm';
import { AUDIT_LOG_EVENT_DETAILS , AuditEventType , dispatchAuditEvent } from '@bahmni-frontend/bahmni-services';
import { ERROR_TITLES } from '../../constants/errors';
import { useEncounterSession } from '../../../src/hooks/useEncounterSession';
import { useNotification } from '@bahmni-frontend/bahmni-widgets';
import {
  postConsultationBundle,
  createDiagnosisBundleEntries,
  createAllergiesBundleEntries,
  createConditionsBundleEntries,
  createServiceRequestBundleEntries,
  createMedicationRequestEntries,
  createEncounterBundleEntry,
  getEncounterReference,
} from '@bahmni-frontend/bahmni-services';
import useAllergyStore from '../../../src/stores/allergyStore'
import { useConditionsAndDiagnosesStore } from '../../../src/stores/conditionsAndDiagnosesStore';
import { useEncounterDetailsStore } from '../../../src/stores/encounterDetailsStore';
import { useMedicationStore } from '../../../src/stores/medicationsStore';
import useServiceRequestStore from '../../../src/stores/serviceRequestStore';
import { ConsultationBundle } from '@types/consultationBundle';
import { createConsultationBundle } from '../../';
import { createEncounterResource } from '@utils/fhir/encounterResourceCreator';
import styles from './styles/ConsultationPad.module.scss';

interface ConsultationPadProps {
  onClose: () => void;
}

const ConsultationPad: React.FC<ConsultationPadProps> = ({ onClose }) => {
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const { t } = useTranslation();
  const { addNotification } = useNotification();

  // Use the diagnosis store
  const {
    selectedDiagnoses,
    selectedConditions,
    validate,
    reset: resetDiagnoses,
  } = useConditionsAndDiagnosesStore();
  // Use the allergy store
  const {
    selectedAllergies,
    validateAllAllergies,
    reset: resetAllergies,
  } = useAllergyStore();
  // Use the encounter details store
  const {
    activeVisit,
    selectedLocation,
    selectedEncounterType,
    encounterParticipants,
    consultationDate,
    isEncounterDetailsFormReady,
    practitioner,
    patientUUID,
    hasError,
    reset: resetEncounterDetails,
  } = useEncounterDetailsStore();

  const { selectedServiceRequests, reset: resetServiceRequests } =
    useServiceRequestStore();

  const {
    selectedMedications,
    validateAllMedications,
    reset: resetMedications,
  } = useMedicationStore();

  // Get encounter session state
  const { activeEncounter } = useEncounterSession();

  // Clean up on unmount
  useEffect(() => {
    return () => {
      resetEncounterDetails();
      resetAllergies();
      resetDiagnoses();
      resetServiceRequests();
      resetMedications();
    };
  }, [
    resetEncounterDetails,
    resetAllergies,
    resetDiagnoses,
    resetServiceRequests,
    resetMedications,
  ]);

  // Data validation check for consultation submission
  const canSubmitConsultation = !!(
    patientUUID &&
    practitioner?.uuid &&
    activeVisit &&
    selectedLocation &&
    selectedEncounterType &&
    encounterParticipants.length > 0
  );

  // TODO: Extract Business Logic
  // 1. Create a consultationService to handle submission logic
  // 2. Extract validation logic into a custom hook
  // 3. Create utility functions for bundle creation
  const submitConsultation = () => {
    // Create encounter resource
    const encounterResource = createEncounterResource(
      selectedEncounterType!.uuid,
      selectedEncounterType!.name,
      patientUUID!,
      encounterParticipants.map((p) => p.uuid),
      activeVisit!.id,
      selectedLocation!.uuid,
      consultationDate,
    );

    // Generate a single placeholder reference for consistency
    const placeholderReference = `urn:uuid:${crypto.randomUUID()}`;

    // Create encounter bundle entry (POST for new, PUT for existing)
    const encounterBundleEntry = createEncounterBundleEntry(
      activeEncounter,
      encounterResource,
    );

    // Get the appropriate encounter reference for other resources
    const encounterReference = getEncounterReference(
      activeEncounter,
      encounterBundleEntry.fullUrl ?? placeholderReference,
    );

    // Use consistent practitioner UUID for all resources
    const practitionerUUID = practitioner!.uuid;

    const diagnosisEntries = createDiagnosisBundleEntries({
      selectedDiagnoses,
      encounterSubject: encounterResource.subject!,
      encounterReference,
      practitionerUUID: practitionerUUID,
      consultationDate,
    });

    const allergyEntries = createAllergiesBundleEntries({
      selectedAllergies,
      encounterSubject: encounterResource.subject!,
      encounterReference,
      practitionerUUID: practitionerUUID,
    });

    const conditionEntries = createConditionsBundleEntries({
      selectedConditions,
      encounterSubject: encounterResource.subject!,
      encounterReference,
      practitionerUUID: practitionerUUID,
      consultationDate,
    });

    const serviceRequestEntries = createServiceRequestBundleEntries({
      selectedServiceRequests,
      encounterSubject: encounterResource.subject!,
      encounterReference,
      practitionerUUID: practitionerUUID,
    });

    const medicationEntries = createMedicationRequestEntries({
      selectedMedications,
      encounterSubject: encounterResource.subject!,
      encounterReference,
      practitionerUUID: practitionerUUID,
    });

    const consultationBundle = createConsultationBundle([
      encounterBundleEntry,
      ...diagnosisEntries,
      ...allergyEntries,
      ...conditionEntries,
      ...serviceRequestEntries,
      ...medicationEntries,
    ]);

    return postConsultationBundle<ConsultationBundle>(consultationBundle);
  };

  const handleOnPrimaryButtonClick = async () => {
    if (!isSubmitting && canSubmitConsultation) {
      const isConditionsAndDiagnosesValid = validate();
      const isAllergiesValid = validateAllAllergies();
      const isMedicationsValid = validateAllMedications();
      if (
        !isConditionsAndDiagnosesValid ||
        !isAllergiesValid ||
        !isMedicationsValid
      ) {
        return;
      }

      try {
        setIsSubmitting(true);
        await submitConsultation();

        setIsSubmitting(false);

        // Dispatch audit event for successful encounter edit/creation
        dispatchAuditEvent({
          eventType: AUDIT_LOG_EVENT_DETAILS.EDIT_ENCOUNTER
            .eventType as AuditEventType,
          patientUuid: patientUUID!,
          messageParams: {
            encounterType: selectedEncounterType!.name,
          },
        });
        resetDiagnoses();
        resetAllergies();
        resetEncounterDetails();
        resetServiceRequests();
        resetMedications();
        addNotification({
          title: t('CONSULTATION_SUBMITTED_SUCCESS_TITLE'),
          message: t('CONSULTATION_SUBMITTED_SUCCESS_MESSAGE'),
          type: 'success',
          timeout: 5000,
        });
        onClose();
      } catch (error) {
        setIsSubmitting(false);
        const errorMessage =
          error instanceof Error ? error.message : 'CONSULTATION_ERROR_GENERIC';
        addNotification({
          title: t(ERROR_TITLES.CONSULTATION_ERROR),
          message: t(errorMessage),
          type: 'error',
          timeout: 5000,
        });
        return null;
      }
    }
  };

  const handleOnSecondaryButtonClick = () => {
    resetDiagnoses();
    resetAllergies();
    resetServiceRequests();
    resetMedications();
    onClose();
  };

  return (
    <ActionArea
      title={hasError ? '' : t('CONSULTATION_ACTION_NEW')}
      primaryButtonText={t('CONSULTATION_PAD_DONE_BUTTON')}
      onPrimaryButtonClick={handleOnPrimaryButtonClick}
      isPrimaryButtonDisabled={
        !isEncounterDetailsFormReady || !canSubmitConsultation || isSubmitting
      }
      secondaryButtonText={t('CONSULTATION_PAD_CANCEL_BUTTON')}
      onSecondaryButtonClick={handleOnSecondaryButtonClick}
      content={
        hasError ? (
          <Grid className={styles.emptyState}>
            <Column
              sm={4}
              md={8}
              lg={16}
              xlg={16}
              className={styles.emptyStateTitle}
            >
              {t('CONSULTATION_PAD_ERROR_TITLE')}
            </Column>
            <Column
              sm={4}
              md={8}
              lg={16}
              xlg={16}
              className={styles.emptyStateBody}
            >
              {t('CONSULTATION_PAD_ERROR_BODY')}
            </Column>
          </Grid>
        ) : (
          <>
            <BasicForm />
            <MenuItemDivider />
            <AllergiesForm />
            <MenuItemDivider />
            <InvestigationsForm />
            <MenuItemDivider />
            <ConditionsAndDiagnoses />
            <MenuItemDivider />
            <MedicationsForm />
            <MenuItemDivider />
          </>
        )
      }
    />
  );
};

export default ConsultationPad;
