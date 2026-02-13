import React from 'react';
import { FormattedMessage } from 'react-intl';
import { Button } from '../../atoms/button';
import styles from './styles/SaveAndCancelButtons.module.scss';

export interface SaveAndCancelButtonsProps {
  onSave: () => void;
  onClose: () => void;
  isSaveDisabled?: boolean;
  primaryButtonText?: React.ReactNode;
}

export const SaveAndCancelButtons: React.FC<SaveAndCancelButtonsProps> = ({
  onSave,
  onClose,
  isSaveDisabled = false,
  primaryButtonText = <FormattedMessage id="SAVE" defaultMessage="Save" />,
}) => {
  return (
    <div className={styles.footer}>
      <Button
        kind="secondary"
        size="lg"
        data-testid="cancel"
        onClick={onClose}
        className={styles.cancelButton}
      >
        <span>
          <FormattedMessage id="CANCEL" defaultMessage="Cancel" />
        </span>
      </Button>
      <Button
        kind="primary"
        size="lg"
        onClick={onSave}
        disabled={isSaveDisabled}
        data-testid="save"
        className={styles.saveButton}
      >
        {primaryButtonText}
      </Button>
    </div>
  );
};
