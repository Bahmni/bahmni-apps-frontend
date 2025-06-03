import React from 'react';
import { useTranslation } from 'react-i18next';
import ActionArea from '@components/common/actionArea/ActionArea';
import { useCurrentEncounter } from '@hooks/useCurrentEncounter';
import { useActivePractitioner } from '@hooks/useActivePractitioner';
import { useEncounterConcepts } from '@hooks/useEncounterConcepts';
import { useLocations } from '@hooks/useLocations';
import { Column, Grid, Loading, MenuItemDivider } from '@carbon/react';
import * as styles from './styles/ConsultationPad.module.scss';
import BasicForm from '@components/clinical/forms/basic/BasicForm';
import DiagnosesForm from '@components/clinical/forms/diagnoses/DiagnosesForm';
import AllergiesForm from '@components/clinical/forms/allergies/AllergiesForm';
import { Concept } from '@types/encounterConcepts';
import { ConsultationBundle } from '@types/consultationBundle';
import {
  postConsultationBundle,
  createDiagnosisBundleEntries,
  createAllergiesBundleEntries,
} from '@services/consultationBundleService';
import useNotification from '@hooks/useNotification';
import { formatDate } from '@utils/date';
import { createEncounterResource } from '@utils/fhir/encounterResourceCreator';
import {
  createBundleEntry,
  createConsultationBundle,
} from '@utils/fhir/consultationBundleCreator';
import { ERROR_TITLES } from '@constants/errors';
import { useDiagnosisStore } from '@stores/diagnosisStore';
import useAllergyStore from '@stores/allergyStore';

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
    locations,
    loading: loadingLocations,
    error: errorLocations,
  } = useLocations();
  const {
    encounterConcepts,
    loading: loadingEncounterConcepts,
    error: errorEncounterConcepts,
  } = useEncounterConcepts();

  const {
    practitioner,
    user,
    loading: loadingPractitioner,
    error: errorPractitioner,
  } = useActivePractitioner();

  const {
    currentEncounter,
    loading: loadingEncounter,
    error: errorEncounter,
  } = useCurrentEncounter(patientUUID);

  const encounterTypeSelected = encounterConcepts?.encounterTypes.find(
    (item: Concept) => item.name === 'Consultation',
  );

  const currentEncounterId = currentEncounter?.type[0]?.coding[0]?.code || '';

  const visitTypeSelected = encounterConcepts?.visitTypes.find(
    (item: Concept) => item.uuid === currentEncounterId,
  );

  const formattedDate = formatDate(new Date());

  // Data validation check for consultation submission
  const canSubmitConsultation = !!(
    patientUUID &&
    practitioner &&
    practitioner.uuid &&
    currentEncounter &&
    locations?.length > 0 &&
    encounterTypeSelected
  );

  const submitConsultation = () => {
    const enconterResourceURL = `urn:uuid:${crypto.randomUUID()}`;
    const encounterResource = createEncounterResource(
      encounterTypeSelected!.uuid,
      encounterTypeSelected!.name,
      patientUUID,
      [practitioner!.uuid],
      currentEncounter!.id,
      locations[0].uuid,
      new Date(),
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

  if (
    loadingEncounterConcepts ||
    loadingLocations ||
    loadingPractitioner ||
    loadingEncounter ||
    isSubmitting
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
    errorLocations ||
    errorEncounterConcepts ||
    errorPractitioner ||
    errorEncounter ||
    !practitioner ||
    !patientUUID ||
    !encounterConcepts?.encounterTypes ||
    !encounterConcepts?.visitTypes ||
    !currentEncounter ||
    !visitTypeSelected ||
    !encounterTypeSelected ||
    !locations ||
    locations.length === 0 ||
    formattedDate.error
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
          <BasicForm
            practitioner={practitioner}
            encounterTypes={encounterConcepts.encounterTypes}
            encounterTypeSelected={encounterTypeSelected}
            visitTypes={encounterConcepts.visitTypes}
            visitTypeSelected={visitTypeSelected}
            location={locations[0]}
            locationSelected={locations[0]}
            defaultDate={formattedDate.formattedResult}
          />
          <DiagnosesForm />
          <MenuItemDivider />
          <AllergiesForm />
          <MenuItemDivider />
        </>
      }
    />
  );
};

export default ConsultationPad;
