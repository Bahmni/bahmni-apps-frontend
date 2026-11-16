import { ActionArea } from '@bahmni/design-system';
import {
  useSubscribeConsultationStart,
  useSubscribeEocLocked,
  useTranslation,
} from '@bahmni/services';
import { Warning } from '@carbon/icons-react';
import React, { useCallback, useState } from 'react';
import { useActionAreaExpandProps } from '../../hooks/useActionAreaExpandProps';
import ConsultationPadContainer from '../consultationPadContainer';
import styles from './styles/ConsultationPadGuard.module.scss';

const ICON_SIZE_PX = 48;

type ConsultationPadGuardProps = React.ComponentProps<
  typeof ConsultationPadContainer
>;

const ConsultationPadGuard: React.FC<ConsultationPadGuardProps> = (props) => {
  const { t } = useTranslation();
  const [isEocLocked, setIsEocLocked] = useState(false);
  const actionAreaExpandProps = useActionAreaExpandProps({
    isExpanded: props.isActionAreaExpanded,
    onToggleExpand: props.onToggleActionAreaExpand,
  });

  useSubscribeEocLocked(useCallback(() => setIsEocLocked(true), []));
  useSubscribeConsultationStart(useCallback(() => setIsEocLocked(false), []));

  if (isEocLocked) {
    return (
      <ActionArea
        title={t('CONSULTATION_PAD_TITLE')}
        primaryButtonText={t('CONSULTATION_PAD_CANCEL_BUTTON')}
        primaryButtonKind="secondary"
        contentClassName={styles.blockedContent}
        onPrimaryButtonClick={props.onClose}
        content={
          <div
            className={styles.blockedWrapper}
            data-testid="consultation-pad-guard-blocked"
            role="alert"
          >
            <Warning
              size={ICON_SIZE_PX}
              className={styles.blockedIcon}
              aria-hidden="true"
            />
            <h3 className={styles.blockedTitle}>{t('EOC_LOCKED_TITLE')}</h3>
            <p className={styles.blockedMessage}>{t('EOC_LOCKED_MESSAGE_1')}</p>
            <p className={styles.blockedMessage}>{t('EOC_LOCKED_MESSAGE_2')}</p>
          </div>
        }
        ariaLabel={t('CONSULTATION_PAD_TITLE')}
        {...actionAreaExpandProps}
      />
    );
  }

  return <ConsultationPadContainer {...props} />;
};

export default ConsultationPadGuard;
