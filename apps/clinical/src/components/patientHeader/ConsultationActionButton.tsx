import { Button } from '@bahmni/design-system';
import { useTranslation } from '@bahmni/services';

import {
  useActivePractitioner,
  useHasPrivilege,
  CONSULTATION_PAD_PRIVILEGES,
} from '@bahmni/widgets';
import React from 'react';
import { dispatchConsultationStart } from '../../events/startConsultation';
import { useEncounterSession } from '../../hooks/useEncounterSession';
import styles from './styles/PatientHeader.module.scss';

interface ConsultationActionButtonProps {
  isActionAreaVisible: boolean;
}

const ConsultationActionButton: React.FC<ConsultationActionButtonProps> = ({
  isActionAreaVisible,
}) => {
  const { t } = useTranslation();
  const { practitioner } = useActivePractitioner();
  const { editActiveEncounter, isLoading } = useEncounterSession({
    practitioner,
  });
  const canAddEncounter = useHasPrivilege(
    CONSULTATION_PAD_PRIVILEGES.ENCOUNTER,
  );

  if (!canAddEncounter) {
    return null;
  }
  return (
    <Button
      className={styles.newConsultationButton}
      size="md"
      disabled={isActionAreaVisible || isLoading}
      onClick={() => dispatchConsultationStart({})}
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
