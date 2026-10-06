import { Button, SkeletonPlaceholder } from '@bahmni/design-system';
import { useTranslation } from '@bahmni/services';
import { useHasPrivilege, CONSULTATION_PAD_PRIVILEGES } from '@bahmni/widgets';
import React from 'react';
import { dispatchConsultationStart } from '../../events/startConsultation';
import styles from './styles/PatientHeader.module.scss';

interface DispositionActionButtonProps {
  isActionAreaVisible: boolean;
  isLoading: boolean;
}

/**
 * Header action button that opens the Consultation Pad scoped to the
 * Disposition form only, mirroring how Stop Medications opens the pad
 * (see `stopMedications` input control / `editOnly`).
 */
const DispositionActionButton: React.FC<DispositionActionButtonProps> = ({
  isActionAreaVisible,
  isLoading,
}) => {
  const { t } = useTranslation();
  const canAddDisposition = useHasPrivilege(
    CONSULTATION_PAD_PRIVILEGES.DISPOSITION,
  );

  if (!canAddDisposition) {
    return null;
  }

  if (isLoading) {
    return (
      <SkeletonPlaceholder
        className={styles.dispositionButtonSkeleton}
        testId="disposition-action-button-skeleton"
      />
    );
  }

  return (
    <Button
      kind="tertiary"
      size="md"
      disabled={isActionAreaVisible}
      onClick={() =>
        dispatchConsultationStart({
          editOnly: 'disposition',
          editTitle: 'DISPOSITION_FORM_TITLE',
        })
      }
      data-testid="disposition-action-button"
    >
      {t('DISPOSITION_ACTION_LABEL')}
    </Button>
  );
};

export default DispositionActionButton;
