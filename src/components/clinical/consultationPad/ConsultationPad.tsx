import React, { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import ActionArea from '@components/common/actionArea/ActionArea';
import { useActiveVisit } from '@/hooks/useActiveVisit';
import { useActivePractitioner } from '@hooks/useActivePractitioner';
import { Column, Grid, Loading, MenuItemDivider } from '@carbon/react';
import * as styles from './styles/ConsultationPad.module.scss';
import BasicForm from '@components/clinical/forms/basic/BasicForm';
import DiagnosesForm from '@components/clinical/forms/diagnoses/DiagnosesForm';
import AllergiesForm from '@components/clinical/forms/allergies/AllergiesForm';
import { ConsultationBundle } from '@types/consultationBundle';
import {
  postConsultationBundle,
  createDiagnosisBundleEntries,
  createAllergiesBundleEntries,
} from '@services/consultationBundleService';
import useNotification from '@hooks/useNotification';
import { createEncounterResource } from '@utils/fhir/encounterResourceCreator';
import {
  createBundleEntry,
  createConsultationBundle,
} from '@utils/fhir/consultationBundleCreator';
import { ERROR_TITLES } from '@constants/errors';
import { useDiagnosisStore } from '@stores/diagnosisStore';
import useAllergyStore from '@stores/allergyStore';
import { useEncounterDetailsStore } from '@stores/encounterDetailsStore';

interface ConsultationPadProps {
  patientUUID: string;
  onClose: () => void;
}

const ConsultationPad: React.FC<ConsultationPadProps> = ({
  patientUUID,
  onClose,
}) => {
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const { t } = useTranslation();
  const { addNotification } = useNotification();

  // Use the diagnosis store
  const {
    selectedDiagnoses,
    validateAllDiagnoses,
    reset: resetDiagnoses,
  } = useDiagnosisStore();
  // Use the allergy store
  const {
    selectedAllergies,
    validateAllAllergies,
    reset: resetAllergies,
  } = useAllergyStore();

  const {
    selectedLocation,
    selectedEncounterType,
    encounterParticipants,
    consultationDate,
    isEncounterDetailsFormReady,
    reset: resetEncounterDetails,
  } = useEncounterDetailsStore();

  const {
    practitioner,
    user,
    loading: loadingPractitioner,
    error: errorPractitioner,
  } = useActivePractitioner();

  const {
    activeVisit,
    loading: loadingEncounter,
    error: errorEncounter,
  } = useActiveVisit(patientUUID);

  // Clean up on unmount
  useEffect(() => {
    return () => {
      resetEncounterDetails();
      resetDiagnoses();
    };
  }, [resetEncounterDetails, resetDiagnoses]);

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

  const submitConsultation = () => {
    const enconterResourceURL = `urn:uuid:${crypto.randomUUID()}`;
    const encounterResource = createEncounterResource(
      selectedEncounterType!.uuid,
      selectedEncounterType!.name,
      patientUUID,
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
    });

    const allergyEntries = createAllergiesBundleEntries({
      selectedAllergies,
      encounterSubject: encounterResource.subject!,
      encounterReference: enconterResourceURL,
      practitionerUUID: user!.uuid,
    });

    const consultationBundle = createConsultationBundle([
      encounterBundleEntry,
      ...diagnosisEntries,
      ...allergyEntries,
    ]);

    return postConsultationBundle<ConsultationBundle>(consultationBundle);
  };

  const handleOnPrimaryButtonClick = async () => {
    if (!isSubmitting && canSubmitConsultation) {
      const isDiagnosesValid = validateAllDiagnoses();
      const isAllergiesValid = validateAllAllergies();
      if (!isDiagnosesValid || !isAllergiesValid) {
        return;
      }

      try {
        setIsSubmitting(true);
        await submitConsultation();
        setIsSubmitting(false);
        resetDiagnoses();
        resetAllergies();
        resetEncounterDetails();
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
    onClose();
  };

  if (loadingPractitioner || loadingEncounter || isSubmitting) {
    return (
      <ActionArea
        title={t('CONSULTATION_PAD_TITLE')}
        primaryButtonText={t('CONSULTATION_PAD_DONE_BUTTON')}
        onPrimaryButtonClick={handleOnPrimaryButtonClick}
        secondaryButtonText={t('CONSULTATION_PAD_CANCEL_BUTTON')}
        onSecondaryButtonClick={handleOnSecondaryButtonClick}
        content={
          <Grid>
            <Column sm={3} md={8} lg={16} className={styles.loadingContent}>
              <Loading
                description={t('CONSULTATION_PAD_LOADING')}
                withOverlay={false}
              />
            </Column>
          </Grid>
        }
      />
    );
  }

  if (
    errorPractitioner ||
    errorEncounter ||
    !practitioner ||
    !patientUUID ||
    !activeVisit
  ) {
    return (
      <ActionArea
        title={t('CONSULTATION_PAD_TITLE')}
        primaryButtonText={t('CONSULTATION_PAD_DONE_BUTTON')}
        onPrimaryButtonClick={handleOnPrimaryButtonClick}
        secondaryButtonText={t('CONSULTATION_PAD_CANCEL_BUTTON')}
        onSecondaryButtonClick={handleOnSecondaryButtonClick}
        content={
          <Grid>
            <Column sm={4} md={8} lg={16}>
              <h2>{t('CONSULTATION_PAD_ERROR')}</h2>
            </Column>
          </Grid>
        }
      />
    );
  }

  return (
    <ActionArea
      title={t('CONSULTATION_PAD_TITLE')}
      primaryButtonText={t('CONSULTATION_PAD_DONE_BUTTON')}
      onPrimaryButtonClick={handleOnPrimaryButtonClick}
      secondaryButtonText={t('CONSULTATION_PAD_CANCEL_BUTTON')}
      onSecondaryButtonClick={handleOnSecondaryButtonClick}
      content={
        <>
          <BasicForm activeVisit={activeVisit} />
          {isEncounterDetailsFormReady && <DiagnosesForm />}
          {isEncounterDetailsFormReady && <MenuItemDivider />}
          {isEncounterDetailsFormReady && <AllergiesForm />}
          {isEncounterDetailsFormReady && <MenuItemDivider />}
        </>
      }
    />
  );
};

export default ConsultationPad;
