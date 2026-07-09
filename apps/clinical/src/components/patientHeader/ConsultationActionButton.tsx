import { Button, SkeletonPlaceholder } from '@bahmni/design-system';
import { useTranslation } from '@bahmni/services';
import { useHasPrivilege, CONSULTATION_PAD_PRIVILEGES } from '@bahmni/widgets';
import React from 'react';
import { dispatchConsultationStart } from '../../events/startConsultation';
import styles from './styles/PatientHeader.module.scss';

interface ConsultationActionButtonProps {
  isActionAreaVisible: boolean;
  editActiveEncounter: boolean;
  isLoading: boolean;
}

const ConsultationActionButton: React.FC<ConsultationActionButtonProps> = ({
  isActionAreaVisible,
  editActiveEncounter,
  isLoading,
}) => {
  const { t } = useTranslation();
  const canAddEncounter = useHasPrivilege(
    CONSULTATION_PAD_PRIVILEGES.ENCOUNTER,
  );

  if (!canAddEncounter) {
    return null;
  }

  if (isLoading) {
    return (
      <SkeletonPlaceholder
        className={styles.newConsultationButtonSkeleton}
        testId="consultation-action-button-skeleton"
      />
    );
  }

  return (
    <Button
      size="md"
      disabled={isActionAreaVisible}
      onClick={() => dispatchConsultationStart({})}
      data-testid="consultation-action-button"
    >
      {isActionAreaVisible
        ? t('CONSULTATION_ACTION_IN_PROGRESS')
        : editActiveEncounter
          ? t('CONSULTATION_ACTION_CONTINUE')
          : t('CONSULTATION_ACTION_NEW')}
    </Button>
  );
};

export default ConsultationActionButton;
