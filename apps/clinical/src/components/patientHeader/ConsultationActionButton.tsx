import { Button } from '@bahmni/design-system';
import { useTranslation } from '@bahmni/services';
import { useActivePractitioner } from '@bahmni/widgets';
import React from 'react';
import { useEncounterSession } from '../../hooks/useEncounterSession';
import styles from './styles/PatientHeader.module.scss';

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
  const { practitioner } = useActivePractitioner();
  const { editActiveEncounter, isLoading } = useEncounterSession({
    practitioner,
  });

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
