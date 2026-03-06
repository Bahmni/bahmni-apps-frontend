import { Button } from '@bahmni/design-system';
import { hasPrivilege, useTranslation } from '@bahmni/services';
import { useActivePractitioner, useUserPrivilege} from '@bahmni/widgets';
import React from 'react';
import { useEncounterSession } from '../../hooks/useEncounterSession';
import { CONSULTATION_PAD_PRIVILEGES } from '../../constants/consultationPadPrivileges';
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
  const { userPrivileges } = useUserPrivilege();
  
// Check if user has permission to add encounters
  const canAddEncounter = hasPrivilege(
    userPrivileges,
    CONSULTATION_PAD_PRIVILEGES.ENCOUNTER,
  );

  // Hide button if user lacks privilege
  if (!canAddEncounter) {
    return null;
  }
  return (
    <Button
      className={styles.newConsultationButton}
      size="md"
      disabled={isActionAreaVisible || isLoading}
      onClick={() => setIsActionAreaVisible(!isActionAreaVisible)}
      data-testid="consultation-action-button"
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
