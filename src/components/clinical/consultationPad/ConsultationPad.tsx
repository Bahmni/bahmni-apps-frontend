import { Column, Grid, MenuItemDivider } from '@carbon/react';
import React, { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import AllergiesForm from '@components/clinical/forms/allergies/AllergiesForm';
import DiagnosesForm from '@components/clinical/forms/conditionsAndDiagnoses/ConditionsAndDiagnoses';
import BasicForm from '@components/clinical/forms/encounterDetails/EncounterDetails';
import InvestigationsForm from '@components/clinical/forms/investigations/InvestigationsForm';
import MedicationsForm from '@components/clinical/forms/prescribeMedicines/MedicationsForm';
import ActionArea from '@components/common/actionArea/ActionArea';
import { ERROR_TITLES } from '@constants/errors';
import { useEncounterSession } from '@hooks/useEncounterSession';
import useNotification from '@hooks/useNotification';
import {
  postConsultationBundle,
  createDiagnosisBundleEntries,
  createAllergiesBundleEntries,
  createConditionsBundleEntries,
  createServiceRequestBundleEntries,
  createMedicationRequestEntries,
  createEncounterBundleEntry,
  getEncounterReference,
} from '@services/consultationBundleService';
import useAllergyStore from '@stores/allergyStore';
import { useConditionsAndDiagnosesStore } from '@stores/conditionsAndDiagnosesStore';
import { useEncounterDetailsStore } from '@stores/encounterDetailsStore';
import { useMedicationStore } from '@stores/medicationsStore';
import useServiceRequestStore from '@stores/serviceRequestStore';
import { ConsultationBundle } from '@types/consultationBundle';
import { createConsultationBundle } from '@utils/fhir/consultationBundleCreator';
import { createEncounterResource } from '@utils/fhir/encounterResourceCreator';
import * as styles from './styles/ConsultationPad.module.scss';

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
  const { editActiveEncounter, activeEncounter, refetch } =
    useEncounterSession();

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

        // If this was a new consultation (POST), refetch encounter session to update button
        if (!activeEncounter) {
          // Add a small delay to allow server to process the encounter
          setTimeout(async () => {
            await refetch();
          }, 1000); // 1 second delay
        }

        setIsSubmitting(false);
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
            <DiagnosesForm />
            <MenuItemDivider />
            <AllergiesForm />
            <MenuItemDivider />
            <InvestigationsForm />
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
