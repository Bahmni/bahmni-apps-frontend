import { ActionArea } from '@bahmni/design-system';
import { useTranslation } from '@bahmni/services';
import { Warning } from '@carbon/icons-react';
import React from 'react';
import { useActionAreaExpandProps } from '../../hooks/useActionAreaExpandProps';
import styles from './styles/ConsultationPadLock.module.scss';

const ICON_SIZE_PX = 48;

interface ConsultationPadLockProps {
  onClose: () => void;
  isActionAreaExpanded?: boolean;
  onToggleActionAreaExpand?: () => void;
}

const ConsultationPadLock: React.FC<ConsultationPadLockProps> = ({
  onClose,
  isActionAreaExpanded,
  onToggleActionAreaExpand,
}) => {
  const { t } = useTranslation();
  const actionAreaExpandProps = useActionAreaExpandProps({
    isExpanded: isActionAreaExpanded,
    onToggleExpand: onToggleActionAreaExpand,
  });

  return (
    <ActionArea
      title={t('CONSULTATION_PAD_TITLE')}
      primaryButtonText={t('CONSULTATION_PAD_CANCEL_BUTTON')}
      primaryButtonKind="secondary"
      contentClassName={styles.blockedContent}
      onPrimaryButtonClick={onClose}
      content={
        <div
          className={styles.blockedWrapper}
          data-testid="consultation-pad-lock"
          role="alert"
        >
          <Warning
            size={ICON_SIZE_PX}
            className={styles.blockedIcon}
            aria-hidden="true"
          />
          <h3 className={styles.blockedTitle}>{t('EOC_LOCKED_TITLE')}</h3>
          <p className={styles.blockedMessage}>{t('EOC_LOCKED_MESSAGE')}</p>
        </div>
      }
      ariaLabel={t('CONSULTATION_PAD_TITLE')}
      {...actionAreaExpandProps}
    />
  );
};

export default ConsultationPadLock;
