import React from 'react';
import { useTranslation } from 'react-i18next';
import ActionArea from '@components/common/actionArea/ActionArea';
import { useCurrentEncounter } from '@hooks/useCurrentEncounter';
import { useActivePractitioner } from '@hooks/useActivePractitioner';
import { useEncounterConcepts } from '@hooks/useEncounterConcepts';
import { useLocations } from '@hooks/useLocations';
import { Column, FlexGrid, Loading } from '@carbon/react';
import * as styles from './styles/ConsultationPad.module.scss';
import BasicForm from '@/components/clinical/basicForm/BasicForm';
import { Concept } from '@/types/encounterConcepts';

interface ConsultationPadProps {
  patientUUID: string;
  onClose: () => void;
}

const ConsultationPad: React.FC<ConsultationPadProps> = ({
  patientUUID,
  onClose,
}) => {
  const { t } = useTranslation();
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

  const handleOnPrimaryButtonClick = () => {
    onClose();
  };

  const handleOnSecondaryButtonClick = () => {
    onClose();
  };

  if (
    loadingEncounterConcepts ||
    loadingLocations ||
    loadingPractitioner ||
    loadingEncounter
  ) {
    return (
      <ActionArea
        title={t('CONSULTATION_PAD_TITLE')}
        primaryButtonText={t('CONSULTATION_PAD_DONE_BUTTON')}
        onPrimaryButtonClick={handleOnPrimaryButtonClick}
        secondaryButtonText={t('CONSULTATION_PAD_CANCEL_BUTTON')}
        onSecondaryButtonClick={handleOnSecondaryButtonClick}
        content={
          <FlexGrid fullWidth>
            <Column sm={4} md={8} lg={16} className={styles.loadingContent}>
              <Loading
                description={t('CONSULTATION_PAD_LOADING')}
                withOverlay={false}
              />
            </Column>
          </FlexGrid>
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
    locations.length === 0
  ) {
    return (
      <ActionArea
        title={t('CONSULTATION_PAD_TITLE')}
        primaryButtonText={t('CONSULTATION_PAD_DONE_BUTTON')}
        onPrimaryButtonClick={handleOnPrimaryButtonClick}
        secondaryButtonText={t('CONSULTATION_PAD_CANCEL_BUTTON')}
        onSecondaryButtonClick={handleOnSecondaryButtonClick}
        content={
          <FlexGrid>
            <Column sm={4} md={8} lg={16}>
              <h2>{t('CONSULTATION_PAD_ERROR')}</h2>
            </Column>
          </FlexGrid>
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
        <BasicForm
          practitioner={practitioner}
          encounterTypes={encounterConcepts.encounterTypes}
          encounterTypeSelected={encounterTypeSelected}
          visitTypes={encounterConcepts.visitTypes}
          visitTypeSelected={visitTypeSelected}
          location={locations[0]}
          locationSelected={locations[0]}
          defaultDate={new Date().toDateString()}
        />
      }
    />
  );
};

export default ConsultationPad;
