import { Button, SkeletonPlaceholder } from '@bahmni/design-system';
import { useTranslation, dispatchConsultationStart } from '@bahmni/services';
import { useHasPrivilege, CONSULTATION_PAD_PRIVILEGES } from '@bahmni/widgets';
import type { ServiceRequest } from 'fhir/r4';
import React from 'react';
import styles from './styles/PatientHeader.module.scss';

const DISPOSITION_SERVICE_REQUEST: ServiceRequest = {
  resourceType: 'ServiceRequest',
  status: 'draft',
  intent: 'order',
  subject: {},
};

interface DispositionActionButtonProps {
  isActionAreaVisible: boolean;
  isLoading: boolean;
}

/**
 * Header action button that opens the Consultation Pad scoped to the
 * Disposition form only, by dispatching a draft ServiceRequest action;
 * the draft status distinguishes it from the investigations control.
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
          action: {
            type: 'create',
            resources: [DISPOSITION_SERVICE_REQUEST],
          },
        })
      }
      data-testid="disposition-action-button"
    >
      {t('DISPOSITION_ACTION_LABEL')}
    </Button>
  );
};

export default DispositionActionButton;
