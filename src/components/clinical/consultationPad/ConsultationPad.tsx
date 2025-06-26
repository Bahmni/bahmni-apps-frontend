import React, { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import ActionArea from '@components/common/actionArea/ActionArea';
import { Column, Grid, MenuItemDivider } from '@carbon/react';
import BasicForm from '@components/clinical/forms/encounterDetails/EncounterDetails';
import DiagnosesForm from '@components/clinical/forms/conditionsAndDiagnoses/ConditionsAndDiagnoses';
import AllergiesForm from '@components/clinical/forms/allergies/AllergiesForm';
import InvestigationsForm from '@components/clinical/forms/investigations/InvestigationsForm';
import { ConsultationBundle } from '@types/consultationBundle';
import {
  postConsultationBundle,
  createDiagnosisBundleEntries,
  createAllergiesBundleEntries,
  createConditionsBundleEntries,
  createServiceRequestBundleEntries,
} from '@services/consultationBundleService';
import useNotification from '@hooks/useNotification';
import { createEncounterResource } from '@utils/fhir/encounterResourceCreator';
import {
  createBundleEntry,
  createConsultationBundle,
} from '@utils/fhir/consultationBundleCreator';
import { ERROR_TITLES } from '@constants/errors';
import { useConditionsAndDiagnosesStore } from '@stores/conditionsAndDiagnosesStore';
import useAllergyStore from '@stores/allergyStore';
import { useEncounterDetailsStore } from '@stores/encounterDetailsStore';
import * as styles from './styles/ConsultationPad.module.scss';
import useServiceRequestStore from '@stores/serviceRequestStore';
import MedicationsForm from '../forms/prescribeMedicines/MedicationsForm';

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
    user,
    patientUUID,
    hasError,
    reset: resetEncounterDetails,
  } = useEncounterDetailsStore();

  const { selectedServiceRequests, reset: resetServiceRequests } =
    useServiceRequestStore();

  // Clean up on unmount
  useEffect(() => {
    return () => {
      resetEncounterDetails();
      resetAllergies();
      resetDiagnoses();
      resetServiceRequests();
    };
  }, [
    resetEncounterDetails,
    resetAllergies,
    resetDiagnoses,
    resetServiceRequests,
  ]);

  // Data validation check for consultation submission
  const canSubmitConsultation = !!(
    patientUUID &&
    practitioner &&
    practitioner.uuid &&
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
    const enconterResourceURL = `urn:uuid:${crypto.randomUUID()}`;
    const encounterResource = createEncounterResource(
      selectedEncounterType!.uuid,
      selectedEncounterType!.name,
      patientUUID!,
      encounterParticipants.map((p) => p.uuid),
      activeVisit!.id,
      selectedLocation!.uuid,
      consultationDate,
    );
    const encounterBundleEntry = createBundleEntry(
      enconterResourceURL,
      encounterResource,
      'POST',
    );
    const diagnosisEntries = createDiagnosisBundleEntries({
      selectedDiagnoses,
      encounterSubject: encounterResource.subject!,
      encounterReference: enconterResourceURL,
      practitionerUUID: user!.uuid,
      consultationDate,
    });

    const allergyEntries = createAllergiesBundleEntries({
      selectedAllergies,
      encounterSubject: encounterResource.subject!,
      encounterReference: enconterResourceURL,
      practitionerUUID: user!.uuid,
    });

    const conditionEntries = createConditionsBundleEntries({
      selectedConditions,
      encounterSubject: encounterResource.subject!,
      encounterReference: enconterResourceURL,
      practitionerUUID: user!.uuid,
      consultationDate,
    });

    const serviceRequestEntries = createServiceRequestBundleEntries({
      selectedServiceRequests,
      encounterSubject: encounterResource.subject!,
      encounterReference: enconterResourceURL,
      practitionerUUID: practitioner!.uuid,
    });

    const consultationBundle = createConsultationBundle([
      encounterBundleEntry,
      ...diagnosisEntries,
      ...allergyEntries,
      ...conditionEntries,
      ...serviceRequestEntries,
    ]);

    return postConsultationBundle<ConsultationBundle>(consultationBundle);
  };

  const handleOnPrimaryButtonClick = async () => {
    if (!isSubmitting && canSubmitConsultation) {
      const isConditionsAndDiagnosesValid = validate();
      const isAllergiesValid = validateAllAllergies();
      if (!isConditionsAndDiagnosesValid || !isAllergiesValid) {
        return;
      }

      try {
        setIsSubmitting(true);
        await submitConsultation();
        setIsSubmitting(false);
        resetDiagnoses();
        resetAllergies();
        resetEncounterDetails();
        resetServiceRequests();
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
    onClose();
  };

  return (
    <ActionArea
      title={hasError ? '' : t('CONSULTATION_PAD_TITLE')}
      primaryButtonText={t('CONSULTATION_PAD_DONE_BUTTON')}
      onPrimaryButtonClick={handleOnPrimaryButtonClick}
      isPrimaryButtonDisabled={
        !isEncounterDetailsFormReady || !canSubmitConsultation || isSubmitting
      }
      secondaryButtonText={t('CONSULTATION_PAD_CANCEL_BUTTON')}
      onSecondaryButtonClick={handleOnSecondaryButtonClick}
      content={
        hasError ? (
          <>
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
          </>
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
            <MedicationsForm/>
            <MenuItemDivider />
          </>
        )
      }
    />
  );
};

export default ConsultationPad;
