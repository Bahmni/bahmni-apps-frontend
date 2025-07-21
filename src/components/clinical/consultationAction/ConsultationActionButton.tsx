import { Add, Edit } from '@carbon/icons-react';
import { Button } from '@carbon/react';
import React from 'react';
import { useTranslation } from 'react-i18next';
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
  const { hasActiveSession, isPractitionerMatch, isLoading } =
    useEncounterSession();

  // Only show edit button if there's an active session AND it belongs to current practitioner
  const shouldShowEditButton = hasActiveSession && isPractitionerMatch;

  return (
    <Button
      size="lg"
      disabled={isActionAreaVisible || isLoading}
      onClick={() => setIsActionAreaVisible(!isActionAreaVisible)}
      renderIcon={shouldShowEditButton ? Edit : Add}
    >
      {isActionAreaVisible
        ? t('CONSULTATION_ACTION_IN_PROGRESS')
        : shouldShowEditButton
          ? t('CONSULTATION_ACTION_EDIT')
          : t('CONSULTATION_ACTION_NEW')}
    </Button>
  );
};

export default ConsultationActionButton;
