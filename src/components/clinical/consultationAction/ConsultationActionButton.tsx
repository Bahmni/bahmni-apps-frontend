import React from 'react';
import { Button } from '@carbon/react';
import { useTranslation } from 'react-i18next';
import { Add, Edit } from '@carbon/icons-react';
import { useEncounterSession } from '@hooks/useEncounterSession';

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
  const { hasActiveSession, isLoading } = useEncounterSession();

  return (
    <Button
      size="lg"
      disabled={isActionAreaVisible || isLoading}
      onClick={() => setIsActionAreaVisible(!isActionAreaVisible)}
      renderIcon={hasActiveSession ? Edit : Add}
    >
      {isActionAreaVisible
        ? t('CONSULTATION_ACTION_IN_PROGRESS')
        : hasActiveSession
        ? t('CONSULTATION_ACTION_EDIT')
        : t('CONSULTATION_ACTION_NEW')}
    </Button>
  );
};

export default ConsultationActionButton;
