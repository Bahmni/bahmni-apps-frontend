import { Button } from '@carbon/react';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { useEncounterSession } from '@hooks/useEncounterSession';
import * as styles from './styles/PatientHeader.module.scss';

interface ConsultationActionButtonProps {
  isActionAreaVisible: boolean;
  setIsActionAreaVisible: React.Dispatch<React.SetStateAction<boolean>>;
}

/**
 * ConsultationActionButton component that shows "New Consultation" or "Edit Consultation"
 * based on encounter session state
 *
 * @param {ConsultationActionButtonProps} props - Component props
 * @returns {React.ReactElement} The ConsultationActionButton component
 */
const ConsultationActionButton: React.FC<ConsultationActionButtonProps> = ({
  isActionAreaVisible,
  setIsActionAreaVisible,
}) => {
  const { t } = useTranslation();
  const { editActiveEncounter, isLoading } = useEncounterSession();

  return (
    <Button
      className={styles.newConsultationButton}
      size="md"
      disabled={isActionAreaVisible || isLoading}
      onClick={() => setIsActionAreaVisible(!isActionAreaVisible)}
    >
      {isActionAreaVisible
        ? t('CONSULTATION_ACTION_IN_PROGRESS')
        : editActiveEncounter
          ? t('CONSULTATION_ACTION_EDIT')
          : t('CONSULTATION_ACTION_NEW')}
    </Button>
  );
};

export default ConsultationActionButton;
